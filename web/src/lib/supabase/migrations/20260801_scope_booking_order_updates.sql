-- Migration: scope bookings/orders UPDATE to the authenticated owner
-- Date: 2026-08-01
--
-- WHY
-- `allow_anon_update_bookings` and `allow_anon_update_orders` were created
-- directly against the database (they never existed in schema.sql) with
-- USING (true) / WITH CHECK (true). Because RLS policies are permissive and
-- OR'd together, those two made every booking and order row writable by anyone
-- holding the public anon key — no login required. Supabase's security advisor
-- flagged both.
--
-- WHAT THIS DOES
-- Drops the two open policies and replaces them with UPDATE policies scoped to
-- the business owner, matching the ownership predicate already used by every
-- other policy in schema.sql. WITH CHECK repeats the predicate so a row cannot
-- be updated into a business the caller does not own.
--
-- SAFE FOR THE AI CALL PATH
-- The Vapi webhook writes with the service role key, which bypasses RLS
-- entirely. Booking and order creation are unaffected; this only tightens
-- direct client access via the anon key.
--
-- HOW TO APPLY
-- Supabase dashboard -> SQL Editor -> paste and run, or:
--   supabase db execute --file web/src/lib/supabase/migrations/20260801_scope_booking_order_updates.sql
-- Re-running is safe.

BEGIN;

DROP POLICY IF EXISTS "allow_anon_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "allow_anon_update_orders" ON public.orders;

DROP POLICY IF EXISTS "Owners update own bookings" ON public.bookings;
CREATE POLICY "Owners update own bookings" ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE settings->>'owner_id' = auth.uid()::text)
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE settings->>'owner_id' = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Owners update own orders" ON public.orders;
CREATE POLICY "Owners update own orders" ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE settings->>'owner_id' = auth.uid()::text)
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE settings->>'owner_id' = auth.uid()::text)
  );

COMMIT;

-- Verify: this should return the two "Owners update own ..." policies and no
-- policy whose qual or with_check is the literal `true`.
--   SELECT tablename, policyname, roles, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename IN ('bookings', 'orders')
--   ORDER BY tablename, policyname;
