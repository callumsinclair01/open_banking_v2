import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);

  const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
  const isPremium = (profile?.subscription_tier || 'free') === 'premium';
  if (!isPremium) return NextResponse.json({ error: 'Premium required' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || new Date(Date.now() - 365*24*3600*1000).toISOString();
  const to = searchParams.get('to') || new Date().toISOString();

  const { data: txns, error } = await supabase
    .from('transactions')
    .select('transaction_date,description,amount,type,currency,category_id')
    .eq('user_id', user.id)
    .gte('transaction_date', from)
    .lte('transaction_date', to)
    .order('transaction_date', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ['date','description','amount','type','currency','category_id'];
  const rows = (txns || []).map(t => [
    new Date(t.transaction_date as string).toISOString(),
    escapeCsv(String(t.description || '')),
    String(t.amount),
    t.type,
    t.currency || 'NZD',
    t.category_id || '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=analytics_${new Date().toISOString().slice(0,10)}.csv`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

