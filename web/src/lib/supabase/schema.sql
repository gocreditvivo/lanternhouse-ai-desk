-- Voice Receptionist AI — Database Schema
-- For Supabase (PostgreSQL)
-- Multi-tenant: businesses table is the root for all data
--
-- This file is the initial schema. Changes made after it was first applied live
-- in ./migrations/, newest last. Apply them in filename order on top of this
-- file when standing up a new environment.

-- ============================================
-- 1. BUSINESSES (tenant root)
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'salon' CHECK (type IN ('salon', 'restaurant', 'both')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'vi', 'both')),
  phone_number TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  website TEXT,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'business')),
  trial_ends_at TIMESTAMPTZ,
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'canceled', 'past_due')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. LOCATIONS (multi-location support)
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. SERVICES / MENU ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_vi TEXT,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  email TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'vi')),
  notes TEXT,
  total_calls INTEGER NOT NULL DEFAULT 0,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  lifetime_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, phone_number)
);

-- ============================================
-- 5. CALLS
-- ============================================
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  vapi_call_id TEXT,
  twilio_call_sid TEXT,
  phone_number TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'vi')),
  intent TEXT CHECK (intent IN ('booking', 'order', 'menu_inquiry', 'catering', 'complaint', 'general', 'manager', 'other')),
  summary TEXT,
  transcript JSONB,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'transferred', 'missed', 'failed')),
  outcome TEXT,
  satisfaction_score INTEGER,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- ============================================
-- 6. BOOKINGS (appointments)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_name TEXT,
  staff_name TEXT,
  location_name TEXT,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled', 'no_show')),
  notes TEXT,
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('ai', 'staff', 'customer_online')),
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  deposit_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 7. ORDERS (restaurant phone orders)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'delivery', 'dine_in')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tip DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'canceled')),
  special_instructions TEXT,
  estimated_ready_time TIMESTAMPTZ,
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('ai', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 8. MESSAGES (SMS log)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  phone_number TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'received')),
  twilio_message_sid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 9. INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('vagaro', 'fresha', 'booksy', 'square', 'google_calendar', 'yelp', 'opentable', 'resy', 'pos', 'custom')),
  access_token TEXT,
  refresh_token TEXT,
  webhook_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, provider)
);

-- ============================================
-- 10. BUSINESS HOURS
-- ============================================
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(location_id, day_of_week)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_calls_business_created ON calls(business_id, created_at DESC);
CREATE INDEX idx_bookings_business_date ON bookings(business_id, preferred_date DESC);
CREATE INDEX idx_orders_business_created ON orders(business_id, created_at DESC);
CREATE INDEX idx_customers_business_phone ON customers(business_id, phone_number);
CREATE INDEX idx_messages_business_created ON messages(business_id, created_at DESC);
CREATE INDEX idx_locations_business ON locations(business_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (users can only access their own business data)
CREATE POLICY "Users access own business" ON businesses
  FOR ALL USING (auth.uid()::text = (settings->>'owner_id') OR auth.role() = 'service_role');

CREATE POLICY "Users access own locations" ON locations
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users access own services" ON services
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users access own customers" ON customers
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users access own calls" ON calls
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users access own bookings" ON bookings
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users access own orders" ON orders
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users access own messages" ON messages
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users access own integrations" ON integrations
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users access own business_hours" ON business_hours
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = (settings->>'owner_id'))
    OR auth.role() = 'service_role'
  );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
