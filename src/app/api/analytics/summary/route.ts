import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';
import { computeTotals, trendByMonth, topCategories } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);

  const [{ data: profile }, { data: txns, error }] = await Promise.all([
    supabase.from('profiles').select('subscription_tier').eq('id', user.id).single(),
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', new Date(Date.now() - 365*24*3600*1000).toISOString()),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const transactions = txns || [];
  const totals = computeTotals(transactions as any);
  const trend = trendByMonth(transactions as any);
  const top = topCategories(transactions as any, 5);

  const isPremium = (profile?.subscription_tier || 'free') === 'premium';

  return NextResponse.json({
    isPremium,
    totals,
    trend,
    topCategories: top,
  });
}

