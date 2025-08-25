import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Create a Supabase client for server route handlers using the user's access token.
 * Reads the access token from the `x-supabase-auth` header.
 */
export function createServerSupabase(accessToken?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return createClient<Database>(url, anon, { global: { headers } });
}

/**
 * Create an admin supabase client using the service role key.
 * Only use on the server in trusted routes.
 */
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing on server');
  return createClient<Database>(url, service);
}

