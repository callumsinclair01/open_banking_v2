import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/server-supabase';

export async function getUserFromRequest(req: NextRequest) {
  const token = req.headers.get('x-supabase-auth') || undefined;
  const supabase = createServerSupabase(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

