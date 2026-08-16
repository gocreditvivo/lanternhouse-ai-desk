import { beforeEach, describe, expect, it } from 'vitest';
import { consumePilotConfirmation, issuePilotConfirmation, resetPilotSecurityStateForTests } from '../src/lib/test-mode/security';
import type { PilotActionPayload, PilotDeploymentConfig } from '../src/lib/test-mode/types';

const config: PilotDeploymentConfig = {
  businessId: 'lantern-house-test',
  locationId: 'lantern-house-falls-church',
  timezone: 'America/New_York',
  transferDestinationKeys: ['manager'],
  smsMaxLength: 320,
};

beforeEach(resetPilotSecurityStateForTests);

describe('exact Test Mode action confirmations', () => {
  it('expires and cannot be reused', () => {
    const payload: PilotActionPayload = { type: 'transfer_call', destinationKey: 'manager' };
    const issuedAt = new Date('2026-08-16T12:00:00.000Z');
    const expired = issuePilotConfirmation(payload, config, 1000, issuedAt);
    expect(consumePilotConfirmation(expired.id, payload, config, new Date('2026-08-16T12:00:01.001Z')))
      .toEqual({ ok: false, code: 'confirmation_expired' });

    const fresh = issuePilotConfirmation(payload, config, 60_000, issuedAt);
    expect(consumePilotConfirmation(fresh.id, payload, config, new Date('2026-08-16T12:00:00.500Z'))).toEqual({ ok: true });
    expect(consumePilotConfirmation(fresh.id, payload, config, new Date('2026-08-16T12:00:00.600Z')))
      .toEqual({ ok: false, code: 'confirmation_replayed' });
  });

  it.each([
    [
      'changed order',
      { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-pho-tai', quantity: 1, modifierOptionIds: ['mock-size-regular'] }] } },
      { type: 'create_order', order: { fulfillment: 'pickup', lines: [{ menuItemId: 'mock-pho-tai', quantity: 2, modifierOptionIds: ['mock-size-regular'] }] } },
    ],
    [
      'changed booking',
      { type: 'book_appointment', booking: { serviceId: 'mock-table-reservation', customerName: 'Synthetic Customer', customerPhone: '+17035550198', startIso: '2026-08-20T21:00:00.000Z' } },
      { type: 'book_appointment', booking: { serviceId: 'mock-table-reservation', customerName: 'Synthetic Customer', customerPhone: '+17035550198', startIso: '2026-08-20T22:00:00.000Z' } },
    ],
    [
      'changed transfer',
      { type: 'transfer_call', destinationKey: 'manager' },
      { type: 'transfer_call', destinationKey: 'other' },
    ],
    [
      'changed SMS',
      { type: 'send_sms', to: '+17035550198', body: 'Synthetic confirmation A', transactional: true, consentRecorded: false },
      { type: 'send_sms', to: '+17035550198', body: 'Synthetic confirmation B', transactional: true, consentRecorded: false },
    ],
  ] as Array<[string, PilotActionPayload, PilotActionPayload]>)('rejects %s after confirmation', (_name, original, changed) => {
    const confirmation = issuePilotConfirmation(original, config);
    expect(consumePilotConfirmation(confirmation.id, changed, config)).toEqual({ ok: false, code: 'confirmation_mismatch' });
  });

  it('rejects a confirmation under a different business or location', () => {
    const payload: PilotActionPayload = { type: 'transfer_call', destinationKey: 'manager' };
    const confirmation = issuePilotConfirmation(payload, config);
    expect(consumePilotConfirmation(confirmation.id, payload, { ...config, businessId: 'other-business' }))
      .toEqual({ ok: false, code: 'confirmation_mismatch' });
    expect(consumePilotConfirmation(confirmation.id, payload, { ...config, locationId: 'other-location' }))
      .toEqual({ ok: false, code: 'confirmation_mismatch' });
  });
});
