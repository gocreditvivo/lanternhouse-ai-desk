import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/sms/twilio';

/**
 * Vapi Webhook Handler
 * 
 * Receives function-call events from Vapi when the AI assistant
 * triggers a function like book_appointment, create_order, etc.
 * 
 * Configure this URL in your Vapi assistant's webhook settings:
 * https://your-domain.com/api/vapi/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, message, call } = body;

    // Vapi sends different event types
    // - function-call: AI triggered a function
    // - end-of-call-report: call ended, includes summary and transcript
    // - call-start: call started

    if (type === 'function-call') {
      const { tool, parameters } = message;

      switch (tool) {
        case 'book_appointment': {
          const supabase = createServerClient();
          
          // Get business_id from call metadata
          const businessId = call?.metadata?.business_id;
          if (!businessId) {
            return NextResponse.json({ error: 'No business_id in call metadata' }, { status: 400 });
          }

          // Find or create customer
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('business_id', businessId)
            .eq('phone_number', parameters.phone)
            .single();

          let customerId = customer?.id;

          if (!customerId) {
            const { data: newCustomer } = await supabase
              .from('customers')
              .insert({
                business_id: businessId,
                phone_number: parameters.phone,
                name: parameters.customer_name,
                preferred_language: call?.metadata?.language || 'en',
              })
              .select('id')
              .single();
            customerId = newCustomer?.id;
          }

          // Create booking
          await supabase.from('bookings').insert({
            business_id: businessId,
            customer_id: customerId,
            call_id: call?.id,
            customer_name: parameters.customer_name,
            customer_phone: parameters.phone,
            service_name: parameters.service,
            staff_name: parameters.staff_preference || null,
            preferred_date: parameters.date,
            preferred_time: parameters.time,
            status: 'pending',
            created_by: 'ai',
          });

          // Send SMS confirmation
          const smsMessage = `Hi ${parameters.customer_name}! Your appointment for ${parameters.service} on ${parameters.date} at ${parameters.time} has been received. We'll confirm shortly. - ${call?.metadata?.business_name || 'Voice Receptionist AI'}`;
          await sendSMS(parameters.phone, smsMessage);

          return NextResponse.json({ success: true, message: 'Appointment booked' });
        }

        case 'create_order': {
          const supabase = createServerClient();
          const businessId = call?.metadata?.business_id;
          if (!businessId) {
            return NextResponse.json({ error: 'No business_id' }, { status: 400 });
          }

          // Find or create customer
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('business_id', businessId)
            .eq('phone_number', parameters.phone)
            .single();

          let customerId = customer?.id;
          if (!customerId) {
            const { data: newCustomer } = await supabase
              .from('customers')
              .insert({
                business_id: businessId,
                phone_number: parameters.phone,
                name: parameters.customer_name,
              })
              .select('id')
              .single();
            customerId = newCustomer?.id;
          }

          // Create order
          await supabase.from('orders').insert({
            business_id: businessId,
            customer_id: customerId,
            call_id: call?.id,
            order_type: parameters.order_type,
            customer_name: parameters.customer_name,
            customer_phone: parameters.phone,
            items: parameters.items,
            status: 'pending',
            special_instructions: parameters.special_instructions || null,
            created_by: 'ai',
          });

          // Send SMS confirmation
          const itemCount = parameters.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
          const smsMessage = `Hi ${parameters.customer_name}! Your ${parameters.order_type} order for ${itemCount} item(s) has been received. We'll confirm shortly. - ${call?.metadata?.business_name || 'Voice Receptionist AI'}`;
          await sendSMS(parameters.phone, smsMessage);

          return NextResponse.json({ success: true, message: 'Order created' });
        }

        case 'transfer_call': {
          // Return transfer instructions to Vapi
          return NextResponse.json({
            transferTo: parameters.target_phone_number,
          });
        }

        case 'send_sms': {
          await sendSMS(parameters.phone_number, parameters.message);
          return NextResponse.json({ success: true });
        }

        case 'log_call': {
          const supabase = createServerClient();
          const businessId = call?.metadata?.business_id;
          if (!businessId) {
            return NextResponse.json({ error: 'No business_id' }, { status: 400 });
          }

          await supabase
            .from('calls')
            .update({
              summary: parameters.summary,
              intent: parameters.intent,
              outcome: parameters.outcome,
              status: 'completed',
              ended_at: new Date().toISOString(),
            })
            .eq('vapi_call_id', call?.id);

          return NextResponse.json({ success: true });
        }

        default:
          return NextResponse.json({ error: `Unknown function: ${tool}` }, { status: 400 });
      }
    }

    if (type === 'end-of-call-report') {
      // Store the call transcript and summary
      const supabase = createServerClient();
      const businessId = call?.metadata?.business_id;
      
      if (businessId && call?.id) {
        await supabase
          .from('calls')
          .update({
            transcript: message?.transcript || null,
            summary: message?.summary || null,
            duration_seconds: message?.durationSeconds || 0,
            status: 'completed',
            ended_at: new Date().toISOString(),
            recording_url: message?.recordingUrl || null,
          })
          .eq('vapi_call_id', call.id);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Vapi webhook error:', error);
    return NextResponse.json({ error: 'Internal error', message: error.message }, { status: 500 });
  }
}
