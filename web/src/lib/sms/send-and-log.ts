import { createServerClient } from '@/lib/supabase/server';
import { sendSMS } from './twilio';

export interface SendAndLogParams {
  businessId: string;
  to: string;
  body: string;
  customerId?: string | null;
  bookingId?: string | null;
  orderId?: string | null;
}

export interface SendAndLogResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Send an SMS and record it in `messages` so delivery can be audited.
 *
 * Logging is best-effort: a failed insert is logged and swallowed so that a
 * database problem never turns a delivered confirmation into a failed booking
 * or order response. Failed sends are logged too, with status 'failed'.
 */
export async function sendAndLogSMS(params: SendAndLogParams): Promise<SendAndLogResult> {
  const result = await sendSMS(params.to, params.body);

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('messages').insert({
      business_id: params.businessId,
      customer_id: params.customerId || null,
      booking_id: params.bookingId || null,
      order_id: params.orderId || null,
      direction: 'outbound',
      phone_number: params.to,
      body: params.body,
      status: result.success ? 'sent' : 'failed',
      twilio_message_sid: result.sid || null,
    });
    if (error) {
      console.error('Failed to log outbound SMS:', error);
    }
  } catch (error) {
    console.error('Failed to log outbound SMS:', error);
  }

  return result;
}
