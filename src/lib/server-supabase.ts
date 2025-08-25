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

