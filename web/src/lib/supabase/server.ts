import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Server-side Supabase client using the service role key.
 * Use this in server components, API routes, and server actions.
 * Never expose the service role key to the client.
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Server-side Supabase client bound to the request's auth cookies.
 * Runs as the signed-in user, so RLS applies.
 */
export function createAuthServerClient() {
  const cookieStore = cookies();

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies. The middleware refreshes the
          // session on every request, so ignoring this is safe.
        }
      },
    },
  });
}

/**
 * Get the current authenticated user, or null.
 * Uses getUser() rather than getSession() so the token is verified server-side.
 */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await createAuthServerClient().auth.getUser();
  return user;
}
