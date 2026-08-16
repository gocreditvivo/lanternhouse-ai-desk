import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockBookingAdapter } from '../src/lib/booking/mock';
import { mockPosAdapter } from '../src/lib/pos/mock';
import { issuePilotConfirmation, resetPilotSecurityStateForTests } from '../src/lib/test-mode/security';
import type { PilotActionPayload, PilotDeploymentConfig } from '../src/lib/test-mode/types';
import { executeLinhTool } from '../src/lib/voice-core/tool-router';

const config: PilotDeploymentConfig = {
  businessId: 'lantern-house-test',
  locationId: 'lantern-house-falls-church',
  timezone: 'America/New_York',
  transferDestinations: { manager: '+17035550101' },
  smsMaxLength: 320,
};

const sideEffects = { transferCall: vi.fn(async () => undefined), sendSms: vi.fn(async () => undefined) };
const deps = { pos: mockPosAdapter, booking: mockBookingAdapter, sideEffects, config };

function contextFor(payload: PilotActionPayload, idempotencyKey = `idem-${Math.random()}`) {
  const confirmation = issuePilotConfirmation(payload, config);
  return {
    businessId: config.businessId,
    locationId: config.locationId,
    callerPhone: '+17035550199',
    language: 'mixed' as const,
    confirmationId: confirmation.id,
    idempotencyKey,
  };
}

beforeEach(() => {
  resetPilotSecurityStateForTests();
  sideEffects.transferCall.mockClear();
  sideEffects.sendSms.mockClear();
});

describe('executeLinhTool Test Mode safety', () => {
  it('rejects payload changes after confirmation', async () => {
    const original: PilotActionPayload = { type: 'transfer_call', destinationKey: 'manager' };
    const changed = { type: 'send_sms' as const, to: '+17035550198', body: 'changed', transactional: true, consentRecorded: false };
    const result = await executeLinhTool(changed, contextFor(original, 'payload-change'), deps);
    expect(result).toMatchObject({ ok: false, code: 'confirmation_mismatch' });
    expect(sideEffects.sendSms).not.toHaveBeenCalled();
  });

  it('rejects replay and duplicate idempotency keys', async () => {
    const payload: PilotActionPayload = { type: 'transfer_call', destinationKey: 'manager' };
    const context = contextFor(payload, 'replay-key');
    expect(await executeLinhTool(payload, context, deps)).toMatchObject({ ok: true, simulated: true });
    expect(await executeLinhTool(payload, { ...context, idempotencyKey: 'replay-second' }, deps)).toMatchObject({ ok: false, code: 'confirmation_replayed' });
    expect(await executeLinhTool(payload, contextFor(payload, 'duplicate-key'), deps)).toMatchObject({ ok: true });
    expect(await executeLinhTool(payload, contextFor(payload, 'duplicate-key'), deps)).toMatchObject({ ok: false, code: 'duplicate_request' });
  });

  it('enforces business and location isolation', async () => {
    const payload: PilotActionPayload = { type: 'transfer_call', destinationKey: 'manager' };
    expect(await executeLinhTool(payload, { ...contextFor(payload), businessId: 'other-business' }, deps)).toMatchObject({ ok: false, code: 'invalid_request' });
    expect(await executeLinhTool(payload, { ...contextFor(payload), locationId: 'other-location' }, deps)).toMatchObject({ ok: false, code: 'invalid_request' });
  });

  it('refuses arbitrary transfer destinations', async () => {
    const payload: PilotActionPayload = { type: 'transfer_call', destinationKey: 'attacker-selected' };
    expect(await executeLinhTool(payload, contextFor(payload), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
    expect(sideEffects.transferCall).not.toHaveBeenCalled();
  });

  it('validates SMS phone consent and length while remaining simulated', async () => {
    const noConsent: PilotActionPayload = { type: 'send_sms', to: '+17035550198', body: 'Promo', transactional: false, consentRecorded: false };
    expect(await executeLinhTool(noConsent, contextFor(noConsent), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
    const tooLong: PilotActionPayload = { type: 'send_sms', to: '+17035550198', body: 'x'.repeat(321), transactional: true, consentRecorded: false };
    expect(await executeLinhTool(tooLong, contextFor(tooLong), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
    const valid: PilotActionPayload = { type: 'send_sms', to: '+17035550198', body: 'Your synthetic reservation request was received.', transactional: true, consentRecorded: false };
    expect(await executeLinhTool(valid, contextFor(valid, 'sms-valid'), deps)).toMatchObject({ ok: true, type: 'send_sms', simulated: true });
  });

  it('rejects empty orders and non-positive or fractional quantities', async () => {
    const empty: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [] } };
    expect(await executeLinhTool(empty, contextFor(empty), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
    for (const quantity of [0, -1, 1.5]) {
      const payload: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-pho-tai', quantity, modifierOptionIds: ['mock-size-regular'] }] } };
      expect(await executeLinhTool(payload, contextFor(payload), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
    }
  });

  it('rejects unknown modifiers and missing required modifier groups', async () => {
    const unknown: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-pho-tai', quantity: 1, modifierOptionIds: ['not-owned-by-item'] }] } };
    expect(await executeLinhTool(unknown, contextFor(unknown), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
    const missingRequired: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-pho-tai', quantity: 1, modifierOptionIds: ['mock-no-onion'] }] } };
    expect(await executeLinhTool(missingRequired, contextFor(missingRequired), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
  });

  it('rejects unverified price and accepts a fully valid synthetic order', async () => {
    const unverified: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-unverified-special', quantity: 1 }] } };
    expect(await executeLinhTool(unverified, contextFor(unverified), deps)).toMatchObject({ ok: false, code: 'unverified_price' });
    const valid: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-pho-tai', quantity: 2, modifierOptionIds: ['mock-size-large', 'mock-no-onion'] }] } };
    const result = await executeLinhTool(valid, contextFor(valid, 'valid-order'), deps);
    expect(result).toMatchObject({ ok: true, type: 'create_order', simulated: true, order: { totalCents: 2800 } });
  });

  it('books only a valid future synthetic New York slot with synthetic customer data', async () => {
    const target = new Date(Date.now() + 3 * 24 * 60 * 60_000);
    const slots = await mockBookingAdapter.getAvailability(config.locationId, 'mock-table-reservation', target.toISOString());
    const payload: PilotActionPayload = { type: 'book_appointment', booking: { serviceId: 'mock-table-reservation', customerName: 'Synthetic Customer', customerPhone: '+17035550198', startIso: slots[0].startIso, staffId: 'mock-anyone' } };
    expect(await executeLinhTool(payload, contextFor(payload), deps)).toMatchObject({ ok: true, type: 'book_appointment', simulated: true });
  });

  it('rejects invalid customer input and unavailable booking time', async () => {
    const future = new Date(Date.now() + 4 * 24 * 60 * 60_000);
    const badPhone: PilotActionPayload = { type: 'book_appointment', booking: { serviceId: 'mock-table-reservation', customerName: 'Synthetic Customer', customerPhone: '123', startIso: future.toISOString() } };
    expect(await executeLinhTool(badPhone, contextFor(badPhone), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
    const unavailable: PilotActionPayload = { type: 'book_appointment', booking: { serviceId: 'mock-table-reservation', customerName: 'Synthetic Customer', customerPhone: '+17035550198', startIso: future.toISOString() } };
    expect(await executeLinhTool(unavailable, contextFor(unavailable), deps)).toMatchObject({ ok: false, code: 'invalid_request' });
  });
});
