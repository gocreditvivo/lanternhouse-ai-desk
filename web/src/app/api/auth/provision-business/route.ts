import { NextResponse } from 'next/server';
import { createServerClient, getCurrentUser } from '@/lib/supabase/server';

/**
 * Links the signed-in user to a `businesses` row by writing `settings.owner_id`.
 *
 * Every RLS policy keys off `businesses.settings->>'owner_id'`, so until this
 * runs a freshly signed-up owner sees zero rows. It is idempotent and takes no
 * request body — the business details come from the user's auth metadata, so a
 * caller cannot claim ownership of a business by forging a user id.
 *
 * Called after signup and again after login, so an account created before this
 * route existed still gets linked on its next sign-in.
 */

const BUSINESS_TYPES = ['salon', 'restaurant', 'both'] as const;
const LANGUAGES = ['en', 'vi', 'both'] as const;

function pick<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return allowed.includes(value as T[number]) ? (value as T[number]) : fallback;
}

/** The signup form offers "Beauty Spa"; the businesses.type check constraint does not. */
function businessType(value: unknown): (typeof BUSINESS_TYPES)[number] {
  return pick(value === 'spa' ? 'salon' : value, BUSINESS_TYPES, 'restaurant');
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data: owned, error: ownedError } = await supabase
    .from('businesses')
    .select('id')
    .eq('settings->>owner_id', user.id)
    .maybeSingle();

  if (ownedError) {
    console.error('Owner lookup failed:', ownedError);
    return NextResponse.json({ error: 'Could not look up your business' }, { status: 500 });
  }
  if (owned) {
    return NextResponse.json({ businessId: owned.id, action: 'existing' });
  }

  // The pilot business was seeded before auth existed. The first owner to sign
  // up claims it instead of creating a duplicate tenant alongside real data.
  const defaultBusinessId = process.env.DEFAULT_BUSINESS_ID || '';
  if (defaultBusinessId) {
    const { data: seeded } = await supabase
      .from('businesses')
      .select('id, settings')
      .eq('id', defaultBusinessId)
      .maybeSingle();

    if (seeded && !seeded.settings?.owner_id) {
      const { error: claimError } = await supabase
        .from('businesses')
        .update({ settings: { ...(seeded.settings || {}), owner_id: user.id } })
        .eq('id', seeded.id);

      if (claimError) {
        console.error('Claiming the seeded business failed:', claimError);
        return NextResponse.json({ error: 'Could not link your account' }, { status: 500 });
      }
      return NextResponse.json({ businessId: seeded.id, action: 'claimed' });
    }
  }

  const metadata = user.user_metadata || {};
  const { data: created, error: createError } = await supabase
    .from('businesses')
    .insert({
      name: metadata.business_name || metadata.full_name || user.email || 'My Business',
      type: businessType(metadata.business_type),
      language: pick(metadata.business_language, LANGUAGES, 'both'),
      phone_number: metadata.business_phone || null,
      settings: { owner_id: user.id },
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Business creation failed:', createError);
    return NextResponse.json({ error: 'Could not create your business' }, { status: 500 });
  }

  return NextResponse.json({ businessId: created.id, action: 'created' });
}
