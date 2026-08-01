/**
 * Database types matching the Supabase schema.
 * These are auto-generated types that match the tables in schema.sql.
 */

export type BusinessType = 'salon' | 'restaurant' | 'both';
export type Language = 'en' | 'vi' | 'both';
export type Plan = 'starter' | 'professional' | 'business';
export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'past_due';
export type CallStatus = 'in_progress' | 'completed' | 'transferred' | 'missed' | 'failed';
export type CallIntent = 'booking' | 'order' | 'menu_inquiry' | 'catering' | 'complaint' | 'general' | 'manager' | 'other';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'canceled' | 'no_show';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'canceled';
export type OrderType = 'pickup' | 'delivery' | 'dine_in';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
export type IntegrationProvider = 'vagaro' | 'fresha' | 'booksy' | 'square' | 'google_calendar' | 'yelp' | 'opentable' | 'resy' | 'pos' | 'custom';

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  language: Language;
  phone_number: string | null;
  timezone: string;
  website: string | null;
  plan: Plan;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  business_id: string;
  name: string;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  location_id: string | null;
  name: string;
  name_vi: string | null;
  description: string | null;
  price: number;
  duration_minutes: number | null;
  category: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  phone_number: string;
  name: string | null;
  email: string | null;
  preferred_language: 'en' | 'vi';
  notes: string | null;
  total_calls: number;
  total_bookings: number;
  total_orders: number;
  lifetime_value: number;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  business_id: string;
  location_id: string | null;
  customer_id: string | null;
  vapi_call_id: string | null;
  twilio_call_sid: string | null;
  phone_number: string;
  language: 'en' | 'vi';
  intent: CallIntent | null;
  summary: string | null;
  transcript: Record<string, any> | null;
  duration_seconds: number;
  status: CallStatus;
  outcome: string | null;
  satisfaction_score: number | null;
  recording_url: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface Booking {
  id: string;
  business_id: string;
  location_id: string | null;
  customer_id: string | null;
  call_id: string | null;
  service_id: string | null;
  customer_name: string;
  customer_phone: string;
  service_name: string | null;
  staff_name: string | null;
  location_name: string | null;
  preferred_date: string;
  preferred_time: string;
  status: BookingStatus;
  notes: string | null;
  created_by: 'ai' | 'staff' | 'customer_online';
  reminder_sent: boolean;
  deposit_amount: number;
  deposit_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  modifiers?: string;
  price?: number;
}

export interface Order {
  id: string;
  business_id: string;
  location_id: string | null;
  customer_id: string | null;
  call_id: string | null;
  order_type: OrderType;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number | null;
  total: number;
  status: OrderStatus;
  special_instructions: string | null;
  estimated_ready_time: string | null;
  created_by: 'ai' | 'staff';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  business_id: string;
  customer_id: string | null;
  booking_id: string | null;
  order_id: string | null;
  direction: MessageDirection;
  phone_number: string;
  body: string;
  status: MessageStatus;
  twilio_message_sid: string | null;
  created_at: string;
}

export interface Integration {
  id: string;
  business_id: string;
  provider: IntegrationProvider;
  access_token: string | null;
  refresh_token: string | null;
  webhook_url: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  id: string;
  business_id: string;
  location_id: string | null;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}
