import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  anonymousGreeting,
  lookupCallerContext,
  personalizedGreeting,
  withTimeout,
  type CallerContext,
} from '@/lib/supabase/customer-context';
import { getBusinessContext, type BusinessContext } from '@/lib/supabase/business-context';
import { sendSMS } from '@/lib/sms/twilio';

/**
 * Vapi Webhook Handler
 *
 * Receives events from Vapi:
 * - assistant-request: call connecting — we return the assistant + dynamic overrides
 * - function-call / tool-calls: AI triggered a function like book_appointment
 * - end-of-call-report: call ended, includes summary and transcript
 *
 * Configure this URL as the assistant's Server URL in Vapi:
 * https://your-domain.com/api/vapi/webhook
 */

const CALLER_LOOKUP_TIMEOUT_MS = 1500;

function resolveBusinessId(call: any): string {
  return call?.metadata?.business_id || process.env.DEFAULT_BUSINESS_ID || '';
}

function resolveLocationId(call: any): string {
  return call?.metadata?.location_id || process.env.DEFAULT_LOCATION_ID || '';
}

function resolveCallerPhone(call: any): string {
  return call?.customer?.number || call?.from || '';
}

function parseParameters(raw: unknown): Record<string, any> {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return (raw as Record<string, any>) || {};
}

/** Vapi has shipped several payload shapes for tool calls; accept all of them. */
function readFunctionCall(envelope: any): { name: string; parameters: Record<string, any> } | null {
  if (envelope?.tool) return { name: envelope.tool, parameters: parseParameters(envelope.parameters) };
  if (envelope?.functionCall) {
    return {
      name: envelope.functionCall.name,
      parameters: parseParameters(envelope.functionCall.parameters ?? envelope.functionCall.arguments),
    };
  }
  const toolCall = envelope?.toolCalls?.[0] ?? envelope?.toolCallList?.[0];
  if (toolCall?.function?.name) {
    return { name: toolCall.function.name, parameters: parseParameters(toolCall.function.arguments) };
  }
  return null;
}

/** bookings.call_id / orders.call_id reference calls.id, not Vapi's call id. */
async function resolveCallRowId(supabase: any, vapiCallId: string | undefined): Promise<string | null> {
  if (!vapiCallId) return null;
  const { data } = await supabase.from('calls').select('id').eq('vapi_call_id', vapiCallId).maybeSingle();
  return data?.id || null;
}

async function recordCallStart(
  businessId: string,
  callerPhone: string,
  vapiCallId: string,
  context: CallerContext | null
): Promise<void> {
  const supabase = createServerClient();
  await supabase.from('calls').insert({
    business_id: businessId,
    customer_id: context?.customerId || null,
    vapi_call_id: vapiCallId,
    phone_number: callerPhone,
    language: context?.preferredLanguage || 'en',
    status: 'in_progress',
  });
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.VAPI_WEBHOOK_SECRET || '';
    if (expectedSecret && req.headers.get('x-vapi-secret') !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const envelope = body?.message ?? body;
    const type = envelope?.type ?? body?.type;
    const call = envelope?.call ?? body?.call;

    // Caller recognition: personalize the greeting before the assistant speaks.
    // Any miss or failure falls through to the normal anonymous greeting.
    if (type === 'assistant-request') {
      const businessName = process.env.BUSINESS_NAME || 'Lantern House';
      const businessId = resolveBusinessId(call);
      const locationId = resolveLocationId(call);
      const callerPhone = resolveCallerPhone(call);

      // Caller history and business/menu/hours facts are independent lookups —
      // run them in parallel so one slow query doesn't delay the other.
      const [context, businessInfo] = await Promise.all([
        businessId && callerPhone
          ? withTimeout(lookupCallerContext(businessId, callerPhone), CALLER_LOOKUP_TIMEOUT_MS, null)
          : Promise.resolve(null as CallerContext | null),
        businessId
          ? withTimeout(getBusinessContext(businessId, locationId || null), CALLER_LOOKUP_TIMEOUT_MS, null)
          : Promise.resolve(null as BusinessContext | null),
      ]);

      if (businessId && call?.id) {
        await withTimeout(
          recordCallStart(businessId, callerPhone, call.id, context).catch((error) => {
            console.error('Failed to record call start:', error);
          }),
          CALLER_LOOKUP_TIMEOUT_MS,
          undefined
        );
      }

      const assistantOverrides = {
        firstMessage: context ? personalizedGreeting(context, businessName) : anonymousGreeting(businessName),
        variableValues: {
          business_name: businessInfo?.businessName || businessName,
          customer_name: context?.name || '',
          is_returning_customer: context ? 'true' : 'false',
          last_order: context?.lastOrderSummary || '',
          last_booking: context?.lastBookingSummary || '',
          total_orders: String(context?.totalOrders ?? 0),
          business_type: businessInfo?.businessType || '',
          locations_list: businessInfo?.locationsList || 'Location details not available.',
          business_hours: businessInfo?.businessHours || 'Hours not loaded — do not guess; take a message.',
          business_phone: businessInfo?.businessPhone || '',
          services_menu:
            businessInfo?.servicesMenu || 'Menu not loaded — do not invent dishes or prices; take a message or transfer.',
          manager_phone: businessInfo?.managerPhone || '',
        },
      };

      const assistantId = process.env.VAPI_ASSISTANT_ID || '';
      return NextResponse.json(assistantId ? { assistantId, assistantOverrides } : { assistantOverrides });
    }

    if (type === 'function-call' || type === 'tool-calls') {
      const functionCall = readFunctionCall(envelope);
      if (!functionCall) {
        return NextResponse.json({ error: 'No function call in payload' }, { status: 400 });
      }
      const { name: tool, parameters } = functionCall;

      switch (tool) {
        case 'book_appointment': {
          const supabase = createServerClient();

          const businessId = resolveBusinessId(call);
          if (!businessId) {
            return NextResponse.json({ error: 'No business_id in call metadata' }, { status: 400 });
          }

          // Find or create customer
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('business_id', businessId)
            .eq('phone_number', parameters.phone)
            .maybeSingle();

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
          const { error: bookingError } = await supabase.from('bookings').insert({
            business_id: businessId,
            customer_id: customerId,
            call_id: await resolveCallRowId(supabase, call?.id),
            customer_name: parameters.customer_name,
            customer_phone: parameters.phone,
            service_name: parameters.service,
            staff_name: parameters.staff_preference || null,
            preferred_date: parameters.date,
            preferred_time: parameters.time,
            status: 'pending',
            created_by: 'ai',
          });

          if (bookingError) {
            console.error('Booking insert failed:', bookingError);
            return NextResponse.json({ error: 'Could not save the booking' }, { status: 500 });
          }

          // Send SMS confirmation
          const smsMessage = `Hi ${parameters.customer_name}! Your appointment for ${parameters.service} on ${parameters.date} at ${parameters.time} has been received. We'll confirm shortly. - ${call?.metadata?.business_name || process.env.BUSINESS_NAME || 'Lantern House'}`;
          await sendSMS(parameters.phone, smsMessage);

          return NextResponse.json({ success: true, message: 'Appointment booked' });
        }

        case 'create_order': {
          const supabase = createServerClient();
          const businessId = resolveBusinessId(call);
          if (!businessId) {
            return NextResponse.json({ error: 'No business_id' }, { status: 400 });
          }

          // Find or create customer
          const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('business_id', businessId)
            .eq('phone_number', parameters.phone)
            .maybeSingle();

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
          const items = Array.isArray(parameters.items) ? parameters.items : [];
          const { error: orderError } = await supabase.from('orders').insert({
            business_id: businessId,
            customer_id: customerId,
            call_id: await resolveCallRowId(supabase, call?.id),
            order_type: parameters.order_type,
            customer_name: parameters.customer_name,
            customer_phone: parameters.phone,
            items,
            status: 'pending',
            special_instructions: parameters.special_instructions || null,
            created_by: 'ai',
          });

          if (orderError) {
            console.error('Order insert failed:', orderError);
            return NextResponse.json({ error: 'Could not save the order' }, { status: 500 });
          }

          // Send SMS confirmation
          const itemCount = items.reduce((sum: number, item: any) => sum + (Number(item?.quantity) || 1), 0);
          const smsMessage = `Hi ${parameters.customer_name}! Your ${parameters.order_type} order for ${itemCount} item(s) has been received. We'll confirm shortly. - ${call?.metadata?.business_name || process.env.BUSINESS_NAME || 'Lantern House'}`;
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

      if (call?.id) {
        await supabase
          .from('calls')
          .update({
            transcript: envelope?.transcript || null,
            summary: envelope?.summary || null,
            duration_seconds: Math.round(Number(envelope?.durationSeconds) || 0),
            status: 'completed',
            ended_at: new Date().toISOString(),
            recording_url: envelope?.recordingUrl || null,
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
