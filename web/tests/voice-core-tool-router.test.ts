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

const sideEffects = {
  transferCall: vi.fn(async () => undefined),
  sendSms: vi.fn(async () => undefined),
};

const deps = { pos: mockPosAdapter, booking: mockBookingAdapter, sideEffects, config };

function contextFor(payload: PilotActionPayload, idempotencyKey = 'idem-1') {
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
    const context = contextFor(original);
    const result = await executeLinhTool(changed, context, deps);
    expect(result).toMatchObject({ ok: false, code: 'confirmation_mismatch' });
    expect(sideEffects.sendSms).not.toHaveBeenCalled();
  });

  it('rejects replay of a consumed confirmation and duplicate idempotency key', async () => {
    const payload: PilotActionPayload = { type: 'transfer_call', destinationKey: 'manager' };
    const context = contextFor(payload, 'replay-key');
    const first = await executeLinhTool(payload, context, deps);
    expect(first).toMatchObject({ ok: true, simulated: true });
    const second = await executeLinhTool(payload, { ...context, idempotencyKey: 'new-key' }, deps);
    expect(second).toMatchObject({ ok: false, code: 'confirmation_replayed' });
    const thirdContext = contextFor(payload, 'duplicate-key');
    await executeLinhTool(payload, thirdContext, deps);
    const fourthContext = contextFor(payload, 'duplicate-key');
    const duplicate = await executeLinhTool(payload, fourthContext, deps);
    expect(duplicate).toMatchObject({ ok: false, code: 'duplicate_request' });
  });

  it('enforces business and location isolation', async () => {
    const payload: PilotActionPayload = { type: 'transfer_call', destinationKey: 'manager' };
    const context = contextFor(payload);
    const wrongBusiness = await executeLinhTool(payload, { ...context, businessId: 'other-business' }, deps);
    expect(wrongBusiness).toMatchObject({ ok: false, code: 'invalid_request' });
    const wrongLocation = await executeLinhTool(payload, { ...context, locationId: 'other-location', idempotencyKey: 'idem-2' }, deps);
    expect(wrongLocation).toMatchObject({ ok: false, code: 'invalid_request' });
  });

  it('refuses arbitrary transfer destinations', async () => {
    const payload: PilotActionPayload = { type: 'transfer_call', destinationKey: 'attacker-selected' };
    const result = await executeLinhTool(payload, contextFor(payload), deps);
    expect(result).toMatchObject({ ok: false, code: 'invalid_request' });
    expect(sideEffects.transferCall).not.toHaveBeenCalled();
  });

  it('validates SMS phone consent and length while remaining simulated', async () => {
    const noConsent: PilotActionPayload = { type: 'send_sms', to: '+17035550198', body: 'Promo', transactional: false, consentRecorded: false };
    expect(await executeLinhTool(noConsent, contextFor(noConsent), deps)).toMatchObject({ ok: false, code: 'invalid_request' });

    const valid: PilotActionPayload = { type: 'send_sms', to: '+17035550198', body: 'Your synthetic reservation request was received.', transactional: true, consentRecorded: false };
    const sent = await executeLinhTool(valid, contextFor(valid, 'sms-valid'), deps);
    expect(sent).toMatchObject({ ok: true, type: 'send_sms', simulated: true });
    expect(sideEffects.sendSms).toHaveBeenCalledWith('+17035550198', valid.body);
  });

  it('rejects empty orders invalid quantity missing required modifier and unverified price', async () => {
    const empty: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [] } };
    expect(await executeLinhTool(empty, contextFor(empty), deps)).toMatchObject({ ok: false, code: 'invalid_request' });

    const badQty: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-pho-tai', quantity: 0 }] } };
    expect(await executeLinhTool(badQty, contextFor(badQty, 'qty'), deps)).toMatchObject({ ok: false, code: 'invalid_request' });

    const missingModifier: PilotActionPayload = { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-pho-tai', quantity: 1 }] } };
    expect(await executeLinhTool(missingModifier, contextFor(missingModifier, 'modifier'), deps)).toMatchObject({ ok: false, code: 'unverified_price' });
  });

  it('books only a valid future synthetic New York slot with synthetic customer data', async () => {
    const start = new Date(Date.now() + 3 * 24 * 60 * 60_000);
    const slots = await mockBookingAdapter.getAvailability(config.locationId, 'mock-table-reservation', start.toISOString());
    const payload: PilotActionPayload = {
      type: 'book_appointment',
      booking: {
        serviceId: 'mock-table-reservation',
        customerName: 'Synthetic Customer',
        customerPhone: '+17035550198',
        startIso: slots[0].startIso,
        staffId: 'mock-anyone',
      },
    };
    const result = await executeLinhTool(payload, contextFor(payload), deps);
    expect(result).toMatchObject({ ok: true, type: 'book_appointment', simulated: true });
  });
});
