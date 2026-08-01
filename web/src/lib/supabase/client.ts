'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Browser Supabase client for authentication.
 *
 * Sessions are persisted as cookies (not localStorage) so that middleware and
 * server components can read them. Dashboard reads run server-side against
 * those same cookies (see /lib/dashboard/queries.ts), so RLS applies.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
