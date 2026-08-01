'use server';

import { revalidatePath } from 'next/cache';
import { createAuthServerClient } from '@/lib/supabase/server';
import { getOwnerBusiness } from '@/lib/dashboard/queries';
import type { MutationResult } from '@/lib/dashboard/mutations';
import type {
  BusinessProfileInput,
  HoursRow,
  LocationInput,
  NotificationSettings,
  ServiceRow,
  VoiceSettings,
} from '@/lib/dashboard/types';

/**
 * Owner-facing writes for the settings page. Everything runs under the
 * request's auth cookies, so the `FOR ALL USING (...)` policies in schema.sql
 * are what authorize each statement — the explicit `business_id` filters are
 * defence in depth, not the security boundary.
 */

const SAVE_FAILED = 'Could not save your changes. Please try again.';
const NO_BUSINESS = 'No business linked to this account.';

function ok(): MutationResult {
  revalidatePath('/dashboard/settings');
  return { error: null };
}

export async function saveBusinessProfile(input: BusinessProfileInput): Promise<MutationResult> {
  const business = await getOwnerBusiness();
  if (!business) return { error: NO_BUSINESS };

  const name = input.name.trim();
  if (!name) return { error: 'Business name cannot be empty.' };

  const supabase = createAuthServerClient();
  const { error } = await supabase
    .from('businesses')
    .update({
      name,
      type: input.type,
      language: input.language,
      phone_number: input.phone_number.trim() || null,
      website: input.website.trim() || null,
      timezone: input.timezone,
    })
    .eq('id', business.id);

  if (error) {
    console.error('Saving business profile failed:', error);
    return { error: SAVE_FAILED };
  }
  return ok();
}

/**
 * Merges into `businesses.settings` rather than replacing it, and re-asserts
 * `owner_id` from the authenticated session. A bug in the merge must never be
 * able to drop that key — every RLS policy keys off it, so losing it would
 * lock the owner out of their own tenant with no way back in from the UI.
 */
async function patchSettings(patch: Record<string, unknown>): Promise<MutationResult> {
  const business = await getOwnerBusiness();
  if (!business) return { error: NO_BUSINESS };

  const supabase = createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NO_BUSINESS };

  const { error } = await supabase
    .from('businesses')
    .update({ settings: { ...business.settings, ...patch, owner_id: user.id } })
    .eq('id', business.id);

  if (error) {
    console.error('Saving business settings failed:', error);
    return { error: SAVE_FAILED };
  }
  return ok();
}

export async function saveVoiceSettings(voice: VoiceSettings): Promise<MutationResult> {
  return patchSettings({ voice });
}

export async function saveNotificationSettings(
  notifications: NotificationSettings
): Promise<MutationResult> {
  return patchSettings({ notifications });
}

export async function addLocation(input: LocationInput): Promise<MutationResult> {
  const business = await getOwnerBusiness();
  if (!business) return { error: NO_BUSINESS };

  const name = input.name.trim();
  if (!name) return { error: 'Location name cannot be empty.' };

  const supabase = createAuthServerClient();
  const { error } = await supabase.from('locations').insert({
    business_id: business.id,
    name,
    phone_number: input.phone_number?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    zip_code: input.zip_code?.trim() || null,
  });

  if (error) {
    console.error('Adding location failed:', error);
    return { error: SAVE_FAILED };
  }
  return ok();
}

/**
 * Soft delete. Hard-deleting cascades to that location's services and hours,
 * and the AI reads those live during a call.
 */
export async function removeLocation(id: string): Promise<MutationResult> {
  const business = await getOwnerBusiness();
  if (!business) return { error: NO_BUSINESS };

  const supabase = createAuthServerClient();
  const { error } = await supabase
    .from('locations')
    .update({ is_active: false })
    .eq('id', id)
    .eq('business_id', business.id);

  if (error) {
    console.error('Removing location failed:', error);
    return { error: SAVE_FAILED };
  }
  return ok();
}

/**
 * Updates rows that already exist and inserts the missing days. Deleting the
 * whole set first would leave a window where the AI answers a call and reads
 * no hours at all.
 */
export async function saveHours(locationId: string | null, rows: HoursRow[]): Promise<MutationResult> {
  const business = await getOwnerBusiness();
  if (!business) return { error: NO_BUSINESS };

  const supabase = createAuthServerClient();

  const updates = rows.filter((row) => row.id);
  const inserts = rows.filter((row) => !row.id);

  const results = await Promise.all([
    ...updates.map((row) =>
      supabase
        .from('business_hours')
        .update({
          open_time: row.is_closed ? null : row.open_time,
          close_time: row.is_closed ? null : row.close_time,
          is_closed: row.is_closed,
        })
        .eq('id', row.id as string)
        .eq('business_id', business.id)
    ),
    inserts.length
      ? supabase.from('business_hours').insert(
          inserts.map((row) => ({
            business_id: business.id,
            location_id: locationId,
            day_of_week: row.day_of_week,
            open_time: row.is_closed ? null : row.open_time,
            close_time: row.is_closed ? null : row.close_time,
            is_closed: row.is_closed,
          }))
        )
      : Promise.resolve({ error: null } as any),
  ]);

  const failed = results.find((result) => result.error);
  if (failed) {
    console.error('Saving business hours failed:', failed.error);
    return { error: SAVE_FAILED };
  }
  return ok();
}

export async function saveServices(services: ServiceRow[]): Promise<MutationResult> {
  const business = await getOwnerBusiness();
  if (!business) return { error: NO_BUSINESS };

  if (services.some((service) => !service.name.trim())) {
    return { error: 'Every service needs a name.' };
  }

  const supabase = createAuthServerClient();

  const { data: existing, error: existingError } = await supabase
    .from('services')
    .select('id')
    .eq('business_id', business.id)
    .eq('is_active', true);

  if (existingError) {
    console.error('Loading services for save failed:', existingError);
    return { error: SAVE_FAILED };
  }

  const kept = new Set(services.map((service) => service.id).filter(Boolean));
  const removed = (existing || []).map((row) => row.id).filter((id) => !kept.has(id));

  const toUpdate = services.filter((service) => service.id);
  const toInsert = services.filter((service) => !service.id);

  const results = await Promise.all([
    ...toUpdate.map((service, index) =>
      supabase
        .from('services')
        .update({
          name: service.name.trim(),
          name_vi: service.name_vi?.trim() || null,
          price: service.price,
          duration_minutes: service.duration_minutes,
          sort_order: index,
        })
        .eq('id', service.id)
        .eq('business_id', business.id)
    ),
    toInsert.length
      ? supabase.from('services').insert(
          toInsert.map((service, index) => ({
            business_id: business.id,
            name: service.name.trim(),
            name_vi: service.name_vi?.trim() || null,
            price: service.price,
            duration_minutes: service.duration_minutes,
            category: service.category,
            sort_order: toUpdate.length + index,
          }))
        )
      : Promise.resolve({ error: null } as any),
    removed.length
      ? supabase
          .from('services')
          .update({ is_active: false })
          .in('id', removed)
          .eq('business_id', business.id)
      : Promise.resolve({ error: null } as any),
  ]);

  const failed = results.find((result) => result.error);
  if (failed) {
    console.error('Saving services failed:', failed.error);
    return { error: SAVE_FAILED };
  }
  return ok();
}
