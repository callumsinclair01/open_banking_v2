import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ budgets: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);

  const body = await req.json();
  const { name, amount, period, scope, bank_id, category_id, start_date } = body || {};
  if (!name || !amount || !period || !scope) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data, error } = await supabase
    .from('budgets')
    .insert({ user_id: user.id, name, amount, period, scope, bank_id: bank_id || null, category_id: category_id || null, start_date: start_date || new Date().toISOString() })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ budget: data });
}

