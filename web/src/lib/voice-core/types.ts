import type { BookingRequest, BookingResult } from '@/lib/booking/types';
import type { PosOrderDraft, PosOrderResult } from '@/lib/pos/types';

export type LinhLanguage = 'en' | 'vi' | 'mixed';

export type LinhIntent =
  | 'menu_question'
  | 'hours_question'
  | 'create_order'
  | 'book_appointment'
  | 'transfer_call'
  | 'send_sms'
  | 'unknown';

export type LinhCallContext = {
  businessId: string;
  locationId?: string;
  callerPhone?: string;
  language: LinhLanguage;
  confirmationId?: string;
  idempotencyKey?: string;
};

export type LinhOrderRequest = {
  type: 'create_order';
  order: PosOrderDraft;
};

export type LinhBookingRequest = {
  type: 'book_appointment';
  booking: BookingRequest;
};

export type LinhTransferRequest = {
  type: 'transfer_call';
  destinationKey: string;
};

export type LinhSmsRequest = {
  type: 'send_sms';
  to: string;
  body: string;
  transactional: boolean;
  consentRecorded: boolean;
};

export type LinhToolRequest = LinhOrderRequest | LinhBookingRequest | LinhTransferRequest | LinhSmsRequest;

export type LinhToolResult =
  | { ok: true; type: 'create_order'; order: PosOrderResult; simulated: true }
  | { ok: true; type: 'book_appointment'; booking: BookingResult; simulated: true }
  | { ok: true; type: 'transfer_call' | 'send_sms'; simulated: true }
  | {
      ok: false;
      code:
        | 'missing_confirmation'
        | 'confirmation_expired'
        | 'confirmation_mismatch'
        | 'confirmation_replayed'
        | 'duplicate_request'
        | 'unsupported_capability'
        | 'unverified_price'
        | 'availability_unverified'
        | 'invalid_request'
        | 'provider_error';
      message: string;
      escalationRequired?: boolean;
    };

export interface LinhSideEffects {
  transferCall(targetPhone: string): Promise<void>;
  sendSms(to: string, body: string): Promise<void>;
}
