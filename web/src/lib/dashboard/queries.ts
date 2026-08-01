import { cache } from 'react';
import { createAuthServerClient } from '@/lib/supabase/server';
import { embeddedName, normalizeItems, toNumber } from './normalize';
import { dayKeyInTimeZone, recentDayKeys, safeTimeZone, startOfDayUtc } from './zoned-time';
import type {
  BookingRow,
  CallRow,
  CustomerHistory,
  CustomerRow,
  DashboardStats,
  HoursRow,
  LocationRow,
  NotificationSettings,
  OrderRow,
  OwnerBusiness,
  ServiceRow,
  SettingsData,
  VoiceSettings,
} from './types';

/**
 * Every query here runs through the request's auth cookies, so RLS scopes the
 * results to the signed-in owner. The explicit `business_id` filters are
 * belt-and-braces: correctness does not depend on them, but they keep the
 * intent readable and the queries index-friendly.
 */

const CALL_LIST_LIMIT = 200;
const LIST_LIMIT = 200;
const HISTORY_LIMIT = 10;

/**
 * The business owned by the signed-in user, or null when the account has not
 * been linked yet (signup interrupted before `provision-business` ran).
 *
 * Cached per request so the six pages that need it do not each re-query.
 */
export const getOwnerBusiness = cache(async (): Promise<OwnerBusiness | null> => {
  try {
    const supabase = createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, type, language, phone_number, website, timezone, settings')
      .eq('settings->>owner_id', user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Owner business lookup failed:', error);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      language: data.language,
      phone_number: data.phone_number,
      website: data.website,
      timezone: safeTimeZone(data.timezone),
      settings: data.settings || {},
    };
  } catch (e) {
    console.error('Owner business lookup threw:', e);
    return null;
  }
});

export function servesFood(business: OwnerBusiness): boolean {
  return business.type === 'restaurant' || business.type === 'both';
}

function mapCall(row: any): CallRow {
  return {
    id: row.id,
    customer_id: row.customer_id,
    customer_name: embeddedName(row.customers),
    phone_number: row.phone_number,
    language: row.language,
    intent: row.intent,
    summary: row.summary,
    duration_seconds: toNumber(row.duration_seconds),
    status: row.status,
    outcome: row.outcome,
    created_at: row.created_at,
    ended_at: row.ended_at,
  };
}

function mapBooking(row: any): BookingRow {
  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    // Bookings denormalize these at write time, but fall back to the joined
    // rows so a booking created without them still reads correctly.
    service_name: row.service_name || embeddedName(row.services),
    staff_name: row.staff_name,
    location_name: row.location_name || embeddedName(row.locations),
    preferred_date: row.preferred_date,
    preferred_time: row.preferred_time || '00:00:00',
    status: row.status,
    created_by: row.created_by,
    notes: row.notes,
  };
}

function mapOrder(row: any): OrderRow {
  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    order_type: row.order_type,
    items: normalizeItems(row.items),
    subtotal: toNumber(row.subtotal),
    tax: toNumber(row.tax),
    tip: row.tip === null ? null : toNumber(row.tip),
    total: toNumber(row.total),
    status: row.status,
    special_instructions: row.special_instructions,
    created_at: row.created_at,
  };
}

function mapCustomer(row: any): CustomerRow {
  return {
    id: row.id,
    phone_number: row.phone_number,
    name: row.name,
    email: row.email,
    preferred_language: row.preferred_language,
    total_calls: toNumber(row.total_calls),
    total_bookings: toNumber(row.total_bookings),
    total_orders: toNumber(row.total_orders),
    lifetime_value: toNumber(row.lifetime_value),
    created_at: row.created_at,
  };
}

export async function getDashboardStats(business: OwnerBusiness): Promise<DashboardStats> {
  const supabase = createAuthServerClient();
  const now = new Date();
  const todayKey = dayKeyInTimeZone(now, business.timezone);
  const todayStart = startOfDayUtc(todayKey, business.timezone).toISOString();
  const weekKeys = recentDayKeys(7, business.timezone, now);
  const weekStart = startOfDayUtc(weekKeys[0], business.timezone).toISOString();

  const countToday = (table: string, extra?: (q: any) => any) => {
    let query = supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', todayStart);
    if (extra) query = extra(query);
    return query;
  };

  const [callsToday, missedCalls, newCustomers, bookingsToday, recentCalls, upcoming, weekCalls, recentOrders] =
    await Promise.all([
      countToday('calls'),
      countToday('calls', (q) => q.eq('status', 'missed')),
      countToday('customers'),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('preferred_date', todayKey),
      supabase
        .from('calls')
        .select('id, customer_id, phone_number, language, intent, summary, duration_seconds, status, outcome, created_at, ended_at, customers(name)')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('bookings')
        .select('*, services(name), locations(name)')
        .eq('business_id', business.id)
        .gte('preferred_date', todayKey)
        .not('status', 'in', '(canceled,no_show)')
        .order('preferred_date', { ascending: true })
        .order('preferred_time', { ascending: true })
        .limit(5),
      supabase
        .from('calls')
        .select('created_at')
        .eq('business_id', business.id)
        .gte('created_at', weekStart),
      servesFood(business)
        ? supabase
            .from('orders')
            .select('*')
            .eq('business_id', business.id)
            .order('created_at', { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

  const perDay = new Map(weekKeys.map((key) => [key, 0]));
  for (const row of weekCalls.data || []) {
    const key = dayKeyInTimeZone(new Date(row.created_at), business.timezone);
    if (perDay.has(key)) perDay.set(key, (perDay.get(key) || 0) + 1);
  }

  return {
    callsToday: callsToday.count || 0,
    bookingsToday: bookingsToday.count || 0,
    missedCalls: missedCalls.count || 0,
    newCustomers: newCustomers.count || 0,
    recentCalls: (recentCalls.data || []).map(mapCall),
    upcomingBookings: (upcoming.data || []).map(mapBooking),
    recentOrders: (recentOrders.data || []).map(mapOrder),
    callVolume: weekKeys.map((key) => ({ day: key, count: perDay.get(key) || 0 })),
  };
}

export async function getCalls(business: OwnerBusiness): Promise<CallRow[]> {
  const supabase = createAuthServerClient();
  const { data, error } = await supabase
    .from('calls')
    .select('id, customer_id, phone_number, language, intent, summary, duration_seconds, status, outcome, created_at, ended_at, customers(name)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(CALL_LIST_LIMIT);

  if (error) console.error('Calls query failed:', error);
  return (data || []).map(mapCall);
}

export async function getBookings(business: OwnerBusiness): Promise<BookingRow[]> {
  const supabase = createAuthServerClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, services(name), locations(name)')
    .eq('business_id', business.id)
    .order('preferred_date', { ascending: false })
    .order('preferred_time', { ascending: true })
    .limit(LIST_LIMIT);

  if (error) console.error('Bookings query failed:', error);
  return (data || []).map(mapBooking);
}

export async function getOrders(business: OwnerBusiness): Promise<OrderRow[]> {
  const supabase = createAuthServerClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  if (error) console.error('Orders query failed:', error);
  return (data || []).map(mapOrder);
}

export async function getCustomers(business: OwnerBusiness): Promise<CustomerRow[]> {
  const supabase = createAuthServerClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, phone_number, name, email, preferred_language, total_calls, total_bookings, total_orders, lifetime_value, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) console.error('Customers query failed:', error);
  return (data || []).map(mapCustomer);
}

/**
 * Drill-down for the customer drawer. Bookings and orders have no
 * `customer_id`, so they are matched on the phone number the AI captured.
 */
export async function getCustomerHistory(
  business: OwnerBusiness,
  customerId: string
): Promise<CustomerHistory | null> {
  const supabase = createAuthServerClient();

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, phone_number')
    .eq('id', customerId)
    .eq('business_id', business.id)
    .maybeSingle();

  if (customerError) {
    console.error('Customer lookup failed:', customerError);
    return null;
  }
  if (!customer) return null;

  const [calls, bookings, orders] = await Promise.all([
    supabase
      .from('calls')
      .select('id, created_at, intent, status, duration_seconds')
      .eq('business_id', business.id)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase
      .from('bookings')
      .select('id, preferred_date, preferred_time, service_name, status, services(name)')
      .eq('business_id', business.id)
      .eq('customer_phone', customer.phone_number)
      .order('preferred_date', { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase
      .from('orders')
      .select('id, created_at, total, status, order_type')
      .eq('business_id', business.id)
      .eq('customer_phone', customer.phone_number)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT),
  ]);

  if (calls.error) console.error('Customer calls query failed:', calls.error);
  if (bookings.error) console.error('Customer bookings query failed:', bookings.error);
  if (orders.error) console.error('Customer orders query failed:', orders.error);

  return {
    calls: (calls.data || []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      intent: row.intent,
      status: row.status,
      duration_seconds: toNumber(row.duration_seconds),
    })),
    bookings: (bookings.data || []).map((row: any) => ({
      id: row.id,
      preferred_date: row.preferred_date,
      preferred_time: row.preferred_time || '00:00:00',
      service_name: row.service_name || embeddedName(row.services),
      status: row.status,
    })),
    orders: (orders.data || []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      total: toNumber(row.total),
      status: row.status,
      order_type: row.order_type,
    })),
  };
}

const DEFAULT_VOICE: VoiceSettings = {
  ai_name: 'Linh',
  voice: 'Adam (Warm, Professional)',
  model: 'GPT-4o Mini (Fast, affordable)',
  greeting_en: '',
  greeting_vi: '',
  manager_phone: '',
  after_hours: true,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  new_booking_sms: true,
  new_order_sms: true,
  missed_call_sms: true,
  manager_transfer_sms: true,
  daily_summary_sms: false,
  weekly_report_email: true,
  service_down_alert: true,
};

function mergeDefaults<T extends Record<string, any>>(defaults: T, stored: unknown): T {
  if (!stored || typeof stored !== 'object') return { ...defaults };
  const merged = { ...defaults } as Record<string, any>;
  for (const key of Object.keys(defaults)) {
    const value = (stored as Record<string, any>)[key];
    if (value !== undefined && value !== null) merged[key] = value;
  }
  return merged as T;
}

export async function getSettingsData(business: OwnerBusiness): Promise<SettingsData> {
  const supabase = createAuthServerClient();

  const [locations, hours, services] = await Promise.all([
    supabase
      .from('locations')
      .select('id, name, phone_number, address, city, state, zip_code')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('business_hours')
      .select('id, location_id, day_of_week, open_time, close_time, is_closed')
      .eq('business_id', business.id),
    supabase
      .from('services')
      .select('id, name, name_vi, price, duration_minutes, category, sort_order')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ]);

  if (locations.error) console.error('Locations query failed:', locations.error);
  if (hours.error) console.error('Hours query failed:', hours.error);
  if (services.error) console.error('Services query failed:', services.error);

  return {
    business,
    locations: (locations.data || []) as LocationRow[],
    hours: (hours.data || []).map(
      (row: any): HoursRow => ({
        id: row.id,
        location_id: row.location_id,
        day_of_week: row.day_of_week,
        open_time: (row.open_time || '09:00:00').slice(0, 5),
        close_time: (row.close_time || '17:00:00').slice(0, 5),
        is_closed: Boolean(row.is_closed),
      })
    ),
    services: (services.data || []).map(
      (row: any): ServiceRow => ({
        id: row.id,
        name: row.name,
        name_vi: row.name_vi,
        price: toNumber(row.price),
        duration_minutes: row.duration_minutes === null ? null : toNumber(row.duration_minutes),
        category: row.category,
      })
    ),
    voice: mergeDefaults(DEFAULT_VOICE, business.settings.voice),
    notifications: mergeDefaults(DEFAULT_NOTIFICATIONS, business.settings.notifications),
  };
}
