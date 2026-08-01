import { createServerClient } from './server';

export interface BusinessContext {
  businessName: string;
  businessType: string;
  locationsList: string;
  businessHours: string;
  businessPhone: string;
  servicesMenu: string;
  managerPhone: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// day_of_week convention used in business_hours: 0=Sun .. 6=Sat. Walk Mon..Sun
// for a natural "Mon-Thu, Fri-Sat, Sun" read-out instead of starting on Sunday.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface HoursRow {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  location_id: string | null;
}

interface ServiceRow {
  name: string;
  name_vi: string | null;
  price: number | string;
  category: string | null;
  location_id: string | null;
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${period}` : `${hour12}:${String(m).padStart(2, '0')}${period}`;
}

/** Collapses consecutive days with identical open/close into a single range, e.g. "Mon-Thu: 11am-8pm". */
export function formatHours(rows: HoursRow[]): string {
  if (!rows.length) {
    return 'Hours not loaded for this location — do not guess; tell the caller you will confirm and take a message.';
  }
  const byDay = new Map(rows.map((r) => [r.day_of_week, r]));
  const labelFor = (day: number) => {
    const row = byDay.get(day);
    if (!row) return null; // no data for this day — treat as unknown, not closed
    return row.is_closed ? 'Closed' : `${formatTime(row.open_time)}-${formatTime(row.close_time)}`;
  };

  const parts: string[] = [];
  let groupStartIdx = 0;
  let groupLabel = labelFor(WEEK_ORDER[0]);

  for (let idx = 1; idx <= WEEK_ORDER.length; idx++) {
    const label = idx < WEEK_ORDER.length ? labelFor(WEEK_ORDER[idx]) : null;
    if (idx === WEEK_ORDER.length || label !== groupLabel) {
      const startDay = DAY_NAMES[WEEK_ORDER[groupStartIdx]];
      const endDay = DAY_NAMES[WEEK_ORDER[idx - 1]];
      const range = startDay === endDay ? startDay : `${startDay}-${endDay}`;
      parts.push(`${range}: ${groupLabel ?? 'not confirmed'}`);
      groupStartIdx = idx;
      groupLabel = label;
    }
  }
  return parts.join(', ');
}

/** Groups active menu/service rows by category into a compact readable list. */
export function formatMenu(rows: ServiceRow[]): string {
  if (!rows.length) {
    return 'Menu not loaded for this location — do not invent dishes or prices; take a message or transfer instead.';
  }
  const byCategory = new Map<string, string[]>();
  for (const row of rows) {
    const cat = row.category || 'Menu';
    const price = Number(row.price) || 0;
    const label = row.name_vi
      ? `${row.name} (${row.name_vi}) $${price.toFixed(2)}`
      : `${row.name} $${price.toFixed(2)}`;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(label);
  }
  return Array.from(byCategory.entries())
    .map(([cat, items]) => `${cat}: ${items.join(', ')}`)
    .join(' | ');
}

/**
 * Fetches everything Linh needs to know about the business for a given call —
 * type, address(es), hours, phone, and the real active menu/services — and
 * formats it into the plain-text template variables the system prompt expects.
 *
 * When locationId is provided, hours and menu are scoped to that location
 * (falling back to location-less/global rows if a location has none of its
 * own). This keeps a multi-location business like Lantern House from mixing
 * one location's menu or hours into another's.
 */
export async function getBusinessContext(
  businessId: string,
  locationId?: string | null
): Promise<BusinessContext | null> {
  if (!businessId) return null;
  const supabase = createServerClient();

  const [{ data: business }, { data: locations }, { data: hours }, { data: services }] = await Promise.all([
    supabase.from('businesses').select('name, type, phone_number').eq('id', businessId).maybeSingle(),
    supabase
      .from('locations')
      .select('id, name, address, city, state, zip_code')
      .eq('business_id', businessId)
      .eq('is_active', true),
    supabase
      .from('business_hours')
      .select('day_of_week, open_time, close_time, is_closed, location_id')
      .eq('business_id', businessId),
    supabase
      .from('services')
      .select('name, name_vi, price, category, location_id, sort_order')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const scopedHours = locationId
    ? ((hours as HoursRow[] | null) || []).filter((h) => h.location_id === locationId)
    : (hours as HoursRow[] | null) || [];
  const hoursFallback = scopedHours.length ? scopedHours : (hours as HoursRow[] | null) || [];

  const scopedServices = locationId
    ? ((services as ServiceRow[] | null) || []).filter((s) => !s.location_id || s.location_id === locationId)
    : (services as ServiceRow[] | null) || [];

  const locationsList =
    (locations || [])
      .map((l) => {
        const addressParts = [l.address, l.city, l.state ? `${l.state}${l.zip_code ? ' ' + l.zip_code : ''}` : l.zip_code]
          .filter(Boolean)
          .join(', ');
        return addressParts ? `${l.name} (${addressParts})` : l.name;
      })
      .join('; ') || 'Location details not available.';

  return {
    businessName: business?.name || '',
    businessType: business?.type || '',
    locationsList,
    businessHours: formatHours(locationId ? hoursFallback : (hours as HoursRow[] | null) || []),
    businessPhone: business?.phone_number || '',
    servicesMenu: formatMenu(scopedServices),
    managerPhone: process.env.MANAGER_PHONE || process.env.TWILIO_MANAGER_PHONE || '',
  };
}
