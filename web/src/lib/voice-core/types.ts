import type { BookingRequest, BookingResult } from '@/lib/booking/types';
import type { PosOrderDraft, PosOrderResult } from '@/lib/pos/types';

export type LinhLanguage = 'en' | 'vi';

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
  callerConfirmedAction?: boolean;
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
  targetPhone: string;
};

export type LinhSmsRequest = {
  type: 'send_sms';
  to: string;
  body: string;
};

export type LinhToolRequest = LinhOrderRequest | LinhBookingRequest | LinhTransferRequest | LinhSmsRequest;

export type LinhToolResult =
  | {
      ok: true;
      type: 'create_order';
      order: PosOrderResult;
    }
  | {
      ok: true;
      type: 'book_appointment';
      booking: BookingResult;
    }
  | {
      ok: true;
      type: 'transfer_call' | 'send_sms';
    }
  | {
      ok: false;
      code:
        | 'missing_confirmation'
        | 'unsupported_capability'
        | 'unverified_price'
        | 'invalid_request'
        | 'provider_error';
      message: string;
    };

export interface LinhSideEffects {
  transferCall(targetPhone: string): Promise<void>;
  sendSms(to: string, body: string): Promise<void>;
}
