import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);
  const { data, error } = await supabase.from('mortgages').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mortgages: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);
  const body = await req.json();
  const { name, principal, interest_rate, term_months, start_date, payment_frequency, extra_payment } = body || {};
  if (!name || !principal || !interest_rate || !term_months || !start_date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const { data, error } = await supabase.from('mortgages').insert({
    user_id: user.id,
    name,
    principal,
    interest_rate,
    term_months,
    start_date,
    payment_frequency: payment_frequency || 'monthly',
    extra_payment: extra_payment || 0,
  }).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mortgage: data });
}

