import { createAuthServerClient } from '@/lib/supabase/server';
import { getOwnerBusiness } from './queries';

/**
 * Status changes made by the owner from the dashboard.
 *
 * These run under the request's auth cookies, not the service-role key, so the
 * `Owners update own {bookings,orders}` policies added in
 * `migrations/20260801_scope_booking_order_updates.sql` are what actually
 * authorize the write. A bug here cannot reach another tenant's rows.
 */

export type MutationResult = { error: string } | { error: null };

const OK: MutationResult = { error: null };

export async function setRowStatus(
  table: 'bookings' | 'orders',
  id: string,
  status: string
): Promise<MutationResult> {
  const business = await getOwnerBusiness();
  if (!business) return { error: 'No business linked to this account.' };

  const supabase = createAuthServerClient();
  const { data, error } = await supabase
    .from(table)
    .update({ status })
    .eq('id', id)
    .eq('business_id', business.id)
    .select('id');

  if (error) {
    console.error(`Updating ${table}.status failed:`, error);
    return { error: 'Could not save that change. Please try again.' };
  }
  if (!data || data.length === 0) {
    // RLS filtered the row out rather than erroring. Almost always means the
    // UPDATE-policy migration has not been applied yet.
    return { error: 'That change was not saved — the database rejected the update.' };
  }
  return OK;
}
