import type { BookingAdapter } from '@/lib/booking/types';
import type { PosAdapter } from '@/lib/pos/types';
import type { LinhCallContext, LinhSideEffects, LinhToolRequest, LinhToolResult } from './types';

function hasUnverifiedPrice(
  adapterMenu: Awaited<ReturnType<PosAdapter['getMenu']>>,
  request: Extract<LinhToolRequest, { type: 'create_order' }>,
): boolean {
  return request.order.lines.some((line) => {
    const item = adapterMenu.find((entry) => entry.id === line.menuItemId);
    if (!item) return false;
    return item.priceCents <= 0;
  });
}

export async function executeLinhTool(
  request: LinhToolRequest,
  context: LinhCallContext,
  deps: {
    pos: PosAdapter;
    booking: BookingAdapter;
    sideEffects: LinhSideEffects;
  },
): Promise<LinhToolResult> {
  if (!context.businessId) {
    return { ok: false, code: 'invalid_request', message: 'Business context is required.' };
  }

  if (!context.callerConfirmedAction) {
    return {
      ok: false,
      code: 'missing_confirmation',
      message: 'Caller confirmation is required before taking this action.',
    };
  }

  try {
    if (request.type === 'create_order') {
      if (!deps.pos.capabilities.createOrder) {
        return {
          ok: false,
          code: 'unsupported_capability',
          message: 'The connected POS does not support order creation.',
        };
      }

      if (!context.locationId) {
        return { ok: false, code: 'invalid_request', message: 'Location is required to create an order.' };
      }

      const menu = await deps.pos.getMenu(context.locationId);
      for (const line of request.order.lines) {
        const item = menu.find((entry) => entry.id === line.menuItemId);
        if (!item) {
          return { ok: false, code: 'invalid_request', message: `Unknown menu item: ${line.menuItemId}` };
        }

        if (!(await deps.pos.getItemAvailability(context.locationId, line.menuItemId))) {
          return {
            ok: false,
            code: 'invalid_request',
            message: `${item.name} is not currently available.`,
          };
        }
      }

      if (hasUnverifiedPrice(menu, request)) {
        return {
          ok: false,
          code: 'unverified_price',
          message: 'Order price is not verified. Linh must not quote or submit this order yet.',
        };
      }

      const order = await deps.pos.createOrder(context.locationId, request.order);
      return { ok: true, type: 'create_order', order };
    }

    if (request.type === 'book_appointment') {
      if (!deps.booking.capabilities.createBooking) {
        return {
          ok: false,
          code: 'unsupported_capability',
          message: 'The connected booking system does not support booking creation.',
        };
      }
      if (!context.locationId) {
        return { ok: false, code: 'invalid_request', message: 'Location is required to create a booking.' };
      }

      const services = await deps.booking.getServices(context.locationId);
      const service = services.find((entry) => entry.id === request.booking.serviceId && entry.active);
      if (!service) {
        return { ok: false, code: 'invalid_request', message: 'Unknown or inactive booking service.' };
      }

      if (deps.booking.capabilities.liveAvailability) {
        const slots = await deps.booking.getAvailability(
          context.locationId,
          request.booking.serviceId,
          request.booking.startIso,
          request.booking.staffId,
        );
        const slotExists = slots.some((slot) => slot.startIso === request.booking.startIso);
        if (!slotExists) {
          return {
            ok: false,
            code: 'invalid_request',
            message: 'That time is no longer available. Linh must offer another time.',
          };
        }
      }

      const booking = await deps.booking.createBooking(context.locationId, request.booking);
      return { ok: true, type: 'book_appointment', booking };
    }

    if (request.type === 'transfer_call') {
      if (!request.targetPhone.trim()) {
        return { ok: false, code: 'invalid_request', message: 'Transfer number is required.' };
      }
      await deps.sideEffects.transferCall(request.targetPhone);
      return { ok: true, type: 'transfer_call' };
    }

    if (request.type === 'send_sms') {
      if (!request.to.trim() || !request.body.trim()) {
        return { ok: false, code: 'invalid_request', message: 'SMS recipient and message are required.' };
      }
      await deps.sideEffects.sendSms(request.to, request.body);
      return { ok: true, type: 'send_sms' };
    }

    return { ok: false, code: 'invalid_request', message: 'Unsupported Linh tool request.' };
  } catch (error) {
    return {
      ok: false,
      code: 'provider_error',
      message: error instanceof Error ? error.message : 'Provider action failed.',
    };
  }
}
