import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);
  const { data } = await supabase.from('financial_settings').select('*').eq('user_id', user.id).single();
  return NextResponse.json({ settings: data || null });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);
  const body = await req.json();
  const { income_override, expected_salary } = body || {};

  const { data, error } = await supabase
    .from('financial_settings')
    .upsert({ user_id: user.id, income_override: income_override ?? null, expected_salary: expected_salary ?? null })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

