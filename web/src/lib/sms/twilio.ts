/**
 * Twilio SMS Service
 * 
 * Uses the existing Twilio account to send SMS messages.
 * Reuses the same Twilio credentials from voice-gateway/.env.example
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

/** Sends without touching the database. Prefer sendAndLogSMS so the send is auditable. */
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not configured. SMS not sent.');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Use fetch to call Twilio REST API directly (no SDK dependency needed)
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: body,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twilio SMS error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send SMS' };
    }

    const data = await response.json();
    return { success: true, sid: data.sid };
  } catch (error: any) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a booking reminder SMS.
 * Called by the cron job before appointments.
 */
export async function sendBookingReminder(phone: string, customerName: string, serviceName: string, date: string, time: string, businessName: string): Promise<void> {
  const message = `Hi ${customerName}! Reminder: your ${serviceName} appointment is on ${date} at ${time} at ${businessName}. Reply C to confirm or R to reschedule.`;
  await sendSMS(phone, message);
}

/**
 * Send an order ready notification.
 */
export async function sendOrderReadyNotification(phone: string, customerName: string, businessName: string): Promise<void> {
  const message = `Hi ${customerName}! Your order from ${businessName} is ready for pickup. See you soon!`;
  await sendSMS(phone, message);
}
