import type { BookingRequest } from '@/lib/booking/types';
import type { PosOrderDraft } from '@/lib/pos/types';

export type PilotActionType = 'create_order' | 'book_appointment' | 'transfer_call' | 'send_sms';

export type PilotConfirmation = {
  id: string;
  actionType: PilotActionType;
  businessId: string;
  locationId: string;
  payloadHash: string;
  expiresAt: string;
  usedAt?: string;
};

export type PilotDeploymentConfig = {
  businessId: string;
  locationId: string;
  timezone: string;
  transferDestinations: Record<string, string>;
  smsMaxLength: number;
};

export type PilotActionPayload =
  | { type: 'create_order'; order: PosOrderDraft }
  | { type: 'book_appointment'; booking: BookingRequest }
  | { type: 'transfer_call'; destinationKey: string }
  | { type: 'send_sms'; to: string; body: string; transactional: boolean; consentRecorded: boolean };

export type PilotAuditRecord = {
  id: string;
  scenarioId: string;
  source: 'synthetic_test_mode';
  verificationState: 'verified_synthetic' | 'blocked_unverified' | 'failed';
  action?: PilotActionType;
  result: 'passed' | 'blocked' | 'failed';
  failureReason?: string;
  humanEscalationRequired: boolean;
  timestamp: string;
};
