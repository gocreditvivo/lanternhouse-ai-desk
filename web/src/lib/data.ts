'use client';

// Direct Supabase REST API client — no localStorage dependency
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const BUSINESS_ID = process.env.NEXT_PUBLIC_BUSINESS_ID || 'a1b2c3d4-0000-0000-0000-000000000001';

async function supabaseFetch(table: string, params: Record<string, string> = {}): Promise<any[]> {
  try {
    const query = new URLSearchParams({
      apikey: SUPABASE_ANON_KEY,
      ...params,
    });
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query.toString()}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`Supabase fetch error (${table}):`, res.status);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.error(`Fetch failed (${table}):`, e);
    return [];
  }
}

async function supabaseCount(table: string, filters: Record<string, string> = {}): Promise<number> {
  try {
    const params = {
      apikey: SUPABASE_ANON_KEY,
      ...filters,
    };
    const query = new URLSearchParams(params);
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query.toString()}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact',
        'Range': '0-0',
      },
    });
    if (!res.ok) return 0;
    const range = res.headers.get('content-range');
    if (range) {
      const parts = range.split('/');
      return parseInt(parts[1]) || 0;
    }
    return 0;
  } catch (e) {
    console.error(`Count failed (${table}):`, e);
    return 0;
  }
}

// Types
export interface CallRow {
  id: string;
  customer_id: string | null;
  phone_number: string;
  language: string;
  intent: string | null;
  summary: string | null;
  duration_seconds: number;
  status: string;
  outcome: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface BookingRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_name: string | null;
  staff_name: string | null;
  location_name: string | null;
  preferred_date: string;
  preferred_time: string;
  status: string;
  created_by: string;
  notes: string | null;
}

export interface OrderRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  items: Array<{ name: string; qty: number; modifiers?: string }>;
  subtotal: number;
  tax: number;
  tip: number | null;
  total: number;
  status: string;
  special_instructions: string | null;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  phone_number: string;
  name: string | null;
  email: string | null;
  preferred_language: string;
  total_calls: number;
  total_bookings: number;
  total_orders: number;
  lifetime_value: number;
  created_at: string;
}

export async function fetchCalls(): Promise<CallRow[]> {
  return supabaseFetch('calls', {
    select: '*',
    business_id: `eq.${BUSINESS_ID}`,
    order: 'created_at.desc',
    limit: '50',
  });
}

export async function fetchBookings(): Promise<BookingRow[]> {
  return supabaseFetch('bookings', {
    select: '*',
    business_id: `eq.${BUSINESS_ID}`,
    order: 'preferred_date.asc',
    limit: '50',
  });
}

export async function fetchOrders(): Promise<OrderRow[]> {
  return supabaseFetch('orders', {
    select: '*',
    business_id: `eq.${BUSINESS_ID}`,
    order: 'created_at.desc',
    limit: '50',
  });
}

export async function fetchCustomers(): Promise<CustomerRow[]> {
  return supabaseFetch('customers', {
    select: '*',
    business_id: `eq.${BUSINESS_ID}`,
    order: 'created_at.desc',
    limit: '100',
  });
}

export async function fetchDashboardStats() {
  const today = new Date().toISOString().split('T')[0];

  const [callsToday, bookingsToday, missedCalls, recentCalls] = await Promise.all([
    supabaseCount('calls', { business_id: `eq.${BUSINESS_ID}`, created_at: `gte.${today}` }),
    supabaseCount('bookings', { business_id: `eq.${BUSINESS_ID}`, preferred_date: `eq.${today}` }),
    supabaseCount('calls', { business_id: `eq.${BUSINESS_ID}`, status: 'eq.missed', created_at: `gte.${today}` }),
    supabaseFetch('calls', {
      select: '*',
      business_id: `eq.${BUSINESS_ID}`,
      order: 'created_at.desc',
      limit: '5',
    }),
  ]);

  return {
    callsToday,
    bookingsToday,
    missedCalls,
    newCustomers: 0,
    recentCalls,
  };
}
