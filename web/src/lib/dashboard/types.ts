/**
 * Row shapes the dashboard renders. Kept free of server imports so client
 * components can import them without pulling `next/headers` into the bundle.
 *
 * These are deliberately narrower than the table types in `@/types/database`:
 * they are what the queries in `./queries` actually select, after numeric and
 * JSONB columns have been normalized.
 */

export interface OwnerBusiness {
  id: string;
  name: string;
  type: 'salon' | 'restaurant' | 'both';
  language: 'en' | 'vi' | 'both';
  phone_number: string | null;
  website: string | null;
  timezone: string;
  settings: Record<string, any>;
}

export interface CallRow {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
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

export interface OrderItemRow {
  name: string;
  qty: number;
  modifiers?: string;
}

export type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'completed' | 'canceled';

export interface OrderRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  items: OrderItemRow[];
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

export interface CustomerHistory {
  calls: Array<{ id: string; created_at: string; intent: string | null; status: string; duration_seconds: number }>;
  bookings: Array<{ id: string; preferred_date: string; preferred_time: string; service_name: string | null; status: string }>;
  orders: Array<{ id: string; created_at: string; total: number; status: string; order_type: string }>;
}

export interface DashboardStats {
  callsToday: number;
  bookingsToday: number;
  missedCalls: number;
  newCustomers: number;
  recentCalls: CallRow[];
  upcomingBookings: BookingRow[];
  recentOrders: OrderRow[];
  callVolume: Array<{ day: string; count: number }>;
}

export interface LocationRow {
  id: string;
  name: string;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export interface HoursRow {
  id: string | null;
  location_id: string | null;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface ServiceRow {
  id: string;
  name: string;
  name_vi: string | null;
  price: number;
  duration_minutes: number | null;
  category: string | null;
}

export interface VoiceSettings {
  ai_name: string;
  voice: string;
  model: string;
  greeting_en: string;
  greeting_vi: string;
  manager_phone: string;
  after_hours: boolean;
}

export interface NotificationSettings {
  new_booking_sms: boolean;
  new_order_sms: boolean;
  missed_call_sms: boolean;
  manager_transfer_sms: boolean;
  daily_summary_sms: boolean;
  weekly_report_email: boolean;
  service_down_alert: boolean;
}

export interface BusinessProfileInput {
  name: string;
  type: 'salon' | 'restaurant' | 'both';
  language: 'en' | 'vi' | 'both';
  phone_number: string;
  website: string;
  timezone: string;
}

export type LocationInput = Omit<LocationRow, 'id'>;

export interface SettingsData {
  business: OwnerBusiness;
  locations: LocationRow[];
  hours: HoursRow[];
  services: ServiceRow[];
  voice: VoiceSettings;
  notifications: NotificationSettings;
}
