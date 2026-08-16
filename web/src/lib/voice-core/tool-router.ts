import type { BookingAdapter } from '@/lib/booking/types';
import type { PosAdapter, PosMenuItem } from '@/lib/pos/types';
import { claimIdempotencyKey, consumePilotConfirmation, normalizeUsPhone } from '@/lib/test-mode/security';
import type { PilotActionPayload, PilotDeploymentConfig } from '@/lib/test-mode/types';
import type { LinhCallContext, LinhSideEffects, LinhToolRequest, LinhToolResult } from './types';

function providerError(): LinhToolResult {
  return { ok: false, code: 'provider_error', message: 'The simulated provider could not complete this action safely.' };
}

function validateOrder(menu: PosMenuItem[], request: Extract<LinhToolRequest, { type: 'create_order' }>): LinhToolResult | null {
  if (request.order.lines.length === 0) {
    return { ok: false, code: 'invalid_request', message: 'Order must contain at least one item.' };
  }

  for (const line of request.order.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      return { ok: false, code: 'invalid_request', message: 'Order quantities must be positive whole numbers.' };
    }

    const item = menu.find((entry) => entry.id === line.menuItemId);
    if (!item) return { ok: false, code: 'invalid_request', message: 'Order contains an unknown menu item.' };
    if (item.priceCents <= 0) {
      return { ok: false, code: 'unverified_price', message: 'Order price is not verified. Linh must not quote or submit this order yet.' };
    }

    const selected = line.modifierOptionIds ?? [];
    const groups = item.modifiers ?? [];
    const validOptionIds = new Set(groups.flatMap((group) => group.options.filter((option) => option.available !== false).map((option) => option.id)));
    if (selected.some((optionId) => !validOptionIds.has(optionId))) {
      return { ok: false, code: 'invalid_request', message: 'Order contains an unknown or unavailable modifier.' };
    }

    for (const group of groups) {
      const optionIds = new Set(group.options.map((option) => option.id));
      const count = selected.filter((optionId) => optionIds.has(optionId)).length;
      const min = group.required ? Math.max(1, group.minSelections ?? 1) : group.minSelections ?? 0;
      const max = group.maxSelections ?? Number.POSITIVE_INFINITY;
      if (count < min || count > max) {
        return { ok: false, code: 'invalid_request', message: 'Order modifier selections do not satisfy the menu rules.' };
      }
    }
  }

  return null;
}

function toPilotPayload(request: LinhToolRequest): PilotActionPayload {
  if (request.type === 'create_order') return request;
  if (request.type === 'book_appointment') return request;
  if (request.type === 'transfer_call') return request;
  return request;
}

export async function executeLinhTool(
  request: LinhToolRequest,
  context: LinhCallContext,
  deps: { pos: PosAdapter; booking: BookingAdapter; sideEffects: LinhSideEffects; config: PilotDeploymentConfig },
): Promise<LinhToolResult> {
  if (!context.businessId || !context.locationId) {
    return { ok: false, code: 'invalid_request', message: 'Business and location context are required.' };
  }
  if (context.businessId !== deps.config.businessId || context.locationId !== deps.config.locationId) {
    return { ok: false, code: 'invalid_request', message: 'Business or location scope does not match the Test Mode deployment.' };
  }
  if (!context.confirmationId) {
    return { ok: false, code: 'missing_confirmation', message: 'Exact action confirmation is required before simulated execution.' };
  }
  if (!context.idempotencyKey || !claimIdempotencyKey(`${context.businessId}:${context.locationId}:${context.idempotencyKey}`)) {
    return { ok: false, code: 'duplicate_request', message: 'This simulated action was already attempted.' };
  }

  const confirmation = consumePilotConfirmation(context.confirmationId, toPilotPayload(request), deps.config);
  if (!confirmation.ok) {
    return { ok: false, code: confirmation.code, message: 'Confirmation is missing, expired, changed, or already used.' };
  }

  try {
    if (request.type === 'create_order') {
      if (!deps.pos.capabilities.createOrder) return { ok: false, code: 'unsupported_capability', message: 'The simulated POS does not support order creation.' };
      const menu = await deps.pos.getMenu(context.locationId);
      const validation = validateOrder(menu, request);
      if (validation) return validation;
      for (const line of request.order.lines) {
        if (!(await deps.pos.getItemAvailability(context.locationId, line.menuItemId))) {
          return { ok: false, code: 'invalid_request', message: 'An ordered item is not currently available.' };
        }
      }
      const order = await deps.pos.createOrder(context.locationId, request.order);
      const expected = request.order.lines.reduce((sum, line) => {
        const item = menu.find((entry) => entry.id === line.menuItemId)!;
        const selected = new Set(line.modifierOptionIds ?? []);
        const modifiers = (item.modifiers ?? []).flatMap((group) => group.options)
          .filter((option) => selected.has(option.id))
          .reduce((acc, option) => acc + (option.priceDeltaCents ?? 0), 0);
        return sum + (item.priceCents + modifiers) * line.quantity;
      }, 0);
      if (order.totalCents !== expected || order.totalCents <= 0) {
        return { ok: false, code: 'invalid_request', message: 'Simulated POS returned an invalid total.' };
      }
      return { ok: true, type: 'create_order', order, simulated: true };
    }

    if (request.type === 'book_appointment') {
      const booking = request.booking;
      if (!booking.customerName.trim() || !normalizeUsPhone(booking.customerPhone)) {
        return { ok: false, code: 'invalid_request', message: 'Valid customer name and synthetic US phone are required.' };
      }
      const start = new Date(booking.startIso);
      if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
        return { ok: false, code: 'invalid_request', message: 'Booking time must be a valid future time.' };
      }
      const services = await deps.booking.getServices(context.locationId);
      const service = services.find((entry) => entry.id === booking.serviceId && entry.active);
      if (!service) return { ok: false, code: 'invalid_request', message: 'Unknown or inactive booking service.' };
      if (booking.staffId) {
        const staff = await deps.booking.getStaff(context.locationId);
        if (!staff.some((member) => member.id === booking.staffId && member.active && (!service.staffIds || service.staffIds.includes(member.id)))) {
          return { ok: false, code: 'invalid_request', message: 'Requested staff member is not valid for this service.' };
        }
      }
      if (!deps.booking.capabilities.liveAvailability) {
        return { ok: false, code: 'availability_unverified', message: 'Authoritative availability is unavailable. Record a request or escalate instead.', escalationRequired: true };
      }
      const slots = await deps.booking.getAvailability(context.locationId, booking.serviceId, booking.startIso, booking.staffId);
      if (!slots.some((slot) => slot.startIso === booking.startIso)) {
        return { ok: false, code: 'invalid_request', message: 'That time is not available. Linh must offer another time.' };
      }
      const result = await deps.booking.createBooking(context.locationId, booking);
      return { ok: true, type: 'book_appointment', booking: result, simulated: true };
    }

    if (request.type === 'transfer_call') {
      const target = deps.config.transferDestinations[request.destinationKey];
      if (!target || !normalizeUsPhone(target)) {
        return { ok: false, code: 'invalid_request', message: 'Transfer destination is not allowed by Test Mode configuration.' };
      }
      await deps.sideEffects.transferCall(target);
      return { ok: true, type: 'transfer_call', simulated: true };
    }

    const to = normalizeUsPhone(request.to);
    if (!to || !request.body.trim() || request.body.length > deps.config.smsMaxLength) {
      return { ok: false, code: 'invalid_request', message: 'SMS recipient or message is invalid for Test Mode.' };
    }
    if (!request.transactional && !request.consentRecorded) {
      return { ok: false, code: 'invalid_request', message: 'SMS consent is required for non-transactional messages.' };
    }
    await deps.sideEffects.sendSms(to, request.body.trim());
    return { ok: true, type: 'send_sms', simulated: true };
  } catch {
    return providerError();
  }
}
