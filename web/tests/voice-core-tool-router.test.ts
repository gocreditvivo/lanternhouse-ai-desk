import { describe, expect, it, vi } from 'vitest';
import { mockPosAdapter } from '../src/lib/pos/mock';
import { executeLinhTool } from '../src/lib/voice-core/tool-router';

const sideEffects = {
  transferCall: vi.fn(async () => undefined),
  sendSms: vi.fn(async () => undefined),
};

const baseContext = {
  businessId: 'lantern-house',
  locationId: 'lantern-house-falls-church',
  callerPhone: '+17032682878',
  language: 'vi' as const,
  callerConfirmedAction: true,
};

describe('executeLinhTool', () => {
  it('requires caller confirmation before side effects', async () => {
    const result = await executeLinhTool(
      { type: 'transfer_call', targetPhone: '+15717495444' },
      { ...baseContext, callerConfirmedAction: false },
      { pos: mockPosAdapter, sideEffects },
    );

    expect(result).toEqual({
      ok: false,
      code: 'missing_confirmation',
      message: 'Caller confirmation is required before taking this action.',
    });
    expect(sideEffects.transferCall).not.toHaveBeenCalled();
  });

  it('refuses to submit an order when prices are unverified', async () => {
    const result = await executeLinhTool(
      {
        type: 'create_order',
        order: {
          fulfillment: 'pickup',
          customerName: 'Synthetic Customer',
          lines: [{ menuItemId: 'mock-pho-tai', quantity: 1 }],
        },
      },
      baseContext,
      { pos: mockPosAdapter, sideEffects },
    );

    expect(result).toEqual({
      ok: false,
      code: 'unverified_price',
      message: 'Order price is not verified. Linh must not quote or submit this order yet.',
    });
  });

  it('fails closed for unknown menu items', async () => {
    const result = await executeLinhTool(
      {
        type: 'create_order',
        order: {
          fulfillment: 'pickup',
          lines: [{ menuItemId: 'not-real', quantity: 1 }],
        },
      },
      baseContext,
      { pos: mockPosAdapter, sideEffects },
    );

    expect(result).toMatchObject({ ok: false, code: 'invalid_request' });
  });

  it('allows confirmed transfer and SMS side effects', async () => {
    sideEffects.transferCall.mockClear();
    sideEffects.sendSms.mockClear();

    const transfer = await executeLinhTool(
      { type: 'transfer_call', targetPhone: '+15717495444' },
      baseContext,
      { pos: mockPosAdapter, sideEffects },
    );
    const sms = await executeLinhTool(
      { type: 'send_sms', to: '+17035550198', body: 'Your reservation request was received.' },
      baseContext,
      { pos: mockPosAdapter, sideEffects },
    );

    expect(transfer).toEqual({ ok: true, type: 'transfer_call' });
    expect(sms).toEqual({ ok: true, type: 'send_sms' });
    expect(sideEffects.transferCall).toHaveBeenCalledTimes(1);
    expect(sideEffects.sendSms).toHaveBeenCalledTimes(1);
  });
});
