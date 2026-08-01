import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * There is no database in CI, so this guards the migration text itself: the
 * open `USING (true)` policies must stay dropped and the replacements must stay
 * scoped to the owner. It is a regression guard against someone reintroducing
 * the permissive form, not a substitute for verifying pg_policies after apply.
 */

const MIGRATION = readFileSync(
  path.resolve(__dirname, '../src/lib/supabase/migrations/20260801_scope_booking_order_updates.sql'),
  'utf8'
);

const OWNER_PREDICATE = "business_id IN (SELECT id FROM businesses WHERE settings->>'owner_id' = auth.uid()::text)";

describe('bookings/orders UPDATE policy migration', () => {
  it('drops both anon-writable policies', () => {
    expect(MIGRATION).toContain('DROP POLICY IF EXISTS "allow_anon_update_bookings" ON public.bookings;');
    expect(MIGRATION).toContain('DROP POLICY IF EXISTS "allow_anon_update_orders" ON public.orders;');
  });

  it('never grants an unconditional predicate', () => {
    const statements = MIGRATION.replace(/--.*$/gm, '');
    expect(statements).not.toMatch(/USING\s*\(\s*true\s*\)/i);
    expect(statements).not.toMatch(/WITH CHECK\s*\(\s*true\s*\)/i);
  });

  it('scopes both replacement policies to the authenticated owner', () => {
    for (const table of ['bookings', 'orders']) {
      const policy = MIGRATION.slice(MIGRATION.indexOf(`CREATE POLICY "Owners update own ${table}"`));
      const body = policy.slice(0, policy.indexOf(';'));

      expect(body).toContain('FOR UPDATE');
      expect(body).toContain('TO authenticated');
      // Both USING and WITH CHECK, so a row cannot be moved to another tenant.
      expect(body.split(OWNER_PREDICATE)).toHaveLength(3);
    }
  });
});
