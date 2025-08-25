import { NextRequest, NextResponse } from 'next/server';
import StripeService from '@/services/stripe';
import { getUserFromRequest } from '@/lib/server-auth';
import { createAdminSupabase } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminSupabase();
  const { data: profile, error } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (error || !profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer linked' }, { status: 400 });
  }

  const portal = await StripeService.createPortalSession(
    profile.stripe_customer_id,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings`
  );

  return NextResponse.json({ url: portal.url });
}

