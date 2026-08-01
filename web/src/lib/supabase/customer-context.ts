import { createServerClient } from './server';

export interface CallerContext {
  customerId: string;
  name: string | null;
  preferredLanguage: 'en' | 'vi';
  totalOrders: number;
  totalBookings: number;
  lastOrderSummary: string | null;
  lastBookingSummary: string | null;
}

/**
 * Callers arrive as E.164 from Twilio/Vapi, but rows written by staff or by earlier
 * calls may be stored unformatted, so match against every plausible spelling.
 */
export function phoneNumberVariants(rawPhone: string): string[] {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return [];
  const last10 = digits.slice(-10);
  return Array.from(
    new Set([rawPhone, `+${digits}`, digits, `+1${last10}`, `1${last10}`, last10].filter(Boolean))
  );
}

function summarizeOrderItems(items: unknown): string | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  const parts = items
    .slice(0, 3)
    .map((item: any) => {
      const name = typeof item?.name === 'string' ? item.name.trim() : '';
      if (!name) return null;
      const quantity = Number(item?.quantity) || 1;
      return quantity > 1 ? `${quantity} ${name}` : name;
    })
    .filter(Boolean) as string[];
  if (parts.length === 0) return null;
  return parts.join(', ') + (items.length > 3 ? ', and a few other items' : '');
}

export async function lookupCallerContext(
  businessId: string,
  callerPhone: string
): Promise<CallerContext | null> {
  const variants = phoneNumberVariants(callerPhone);
  if (!businessId || variants.length === 0) return null;

  const supabase = createServerClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, name, preferred_language, total_orders, total_bookings')
    .eq('business_id', businessId)
    .in('phone_number', variants)
    .limit(1)
    .maybeSingle();

  if (error || !customer) return null;

  const [{ data: lastOrder }, { data: lastBooking }] = await Promise.all([
    supabase
      .from('orders')
      .select('items, order_type')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('bookings')
      .select('service_name, preferred_date, preferred_time')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const lastBookingSummary = lastBooking
    ? [lastBooking.service_name, lastBooking.preferred_date].filter(Boolean).join(' on ') || null
    : null;

  return {
    customerId: customer.id,
    name: customer.name || null,
    preferredLanguage: customer.preferred_language === 'vi' ? 'vi' : 'en',
    totalOrders: customer.total_orders || 0,
    totalBookings: customer.total_bookings || 0,
    lastOrderSummary: lastOrder ? summarizeOrderItems(lastOrder.items) : null,
    lastBookingSummary,
  };
}

export function anonymousGreeting(businessName: string): string {
  return `Thank you for calling ${businessName}. This is Linh, an AI assistant. This call may be recorded for quality. How can I help you today?`;
}

export function personalizedGreeting(context: CallerContext, businessName: string): string {
  if (!context.name) return anonymousGreeting(businessName);

  const opening = `Welcome back, ${context.name}! This is Linh, the AI assistant at ${businessName}. This call may be recorded for quality.`;
  if (context.lastOrderSummary) {
    return `${opening} Would you like your usual — ${context.lastOrderSummary} — or something different today?`;
  }
  return `${opening} How can I help you today?`;
}

/**
 * A slow or failing lookup must never hold up the greeting, so cap it and
 * degrade to the anonymous path.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } catch (error) {
    console.error('Caller context lookup failed:', error);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
