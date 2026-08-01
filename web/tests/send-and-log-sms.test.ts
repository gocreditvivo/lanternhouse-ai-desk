import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendSMS = vi.fn();
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));

vi.mock('@/lib/sms/twilio', () => ({ sendSMS }));
vi.mock('@/lib/supabase/server', () => ({ createServerClient: () => ({ from }) }));

const { sendAndLogSMS } = await import('@/lib/sms/send-and-log');

const params = {
  businessId: 'biz-1',
  customerId: 'cust-1',
  bookingId: 'booking-1',
  to: '+15551230000',
  body: 'Your table is booked.',
};

describe('sendAndLogSMS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs a delivered message as sent, with the Twilio sid', async () => {
    sendSMS.mockResolvedValue({ success: true, sid: 'SM123' });

    const result = await sendAndLogSMS(params);

    expect(result).toEqual({ success: true, sid: 'SM123' });
    expect(from).toHaveBeenCalledWith('messages');
    expect(insert).toHaveBeenCalledWith({
      business_id: 'biz-1',
      customer_id: 'cust-1',
      booking_id: 'booking-1',
      order_id: null,
      direction: 'outbound',
      phone_number: '+15551230000',
      body: 'Your table is booked.',
      status: 'sent',
      twilio_message_sid: 'SM123',
    });
  });

  it('logs a failed send as failed rather than skipping the row', async () => {
    sendSMS.mockResolvedValue({ success: false, error: 'Twilio not configured' });

    const result = await sendAndLogSMS(params);

    expect(result.success).toBe(false);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', twilio_message_sid: null })
    );
  });

  it('still reports success when the message log write fails', async () => {
    sendSMS.mockResolvedValue({ success: true, sid: 'SM456' });
    insert.mockResolvedValue({ error: { message: 'permission denied' } });

    await expect(sendAndLogSMS(params)).resolves.toEqual({ success: true, sid: 'SM456' });
  });

  it('does not throw when the database client itself blows up', async () => {
    sendSMS.mockResolvedValue({ success: true, sid: 'SM789' });
    insert.mockRejectedValue(new Error('connection refused'));

    await expect(sendAndLogSMS(params)).resolves.toEqual({ success: true, sid: 'SM789' });
  });
});
