import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const type = searchParams.get('type'); // 'credit' | 'debit' | undefined
  const accountId = searchParams.get('accountId');

  let query = supabase.from('transactions').select('*', { count: 'exact' }).eq('user_id', user.id);
  if (fromDate) query = query.gte('transaction_date', fromDate);
  if (toDate) query = query.lte('transaction_date', toDate);
  if (type === 'credit' || type === 'debit') query = query.eq('type', type);
  if (accountId) query = query.eq('account_id', accountId);

  query = query.order('transaction_date', { ascending: false }).range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transactions: data || [], pagination: { page, limit, total: count || 0 } });
}

