import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';
import { amortizationSchedule, Frequency } from '@/lib/mortgage';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);

  // Premium gate
  const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
  const isPremium = (profile?.subscription_tier || 'free') === 'premium';
  if (!isPremium) return NextResponse.json({ error: 'Premium required' }, { status: 403 });

  const body = await req.json();
  const { principal, annualRate, termMonths, startDate, frequency, extraPayment } = body || {};
  if (!principal || !annualRate || !termMonths || !startDate || !frequency) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const result = amortizationSchedule({ principal, annualRate, termMonths, startDate, frequency: frequency as Frequency, extraPayment: extraPayment || 0 });
  return NextResponse.json(result);
}

