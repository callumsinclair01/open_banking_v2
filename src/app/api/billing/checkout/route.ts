import { NextRequest, NextResponse } from 'next/server';
import StripeService from '@/services/stripe';
import { getUserFromRequest } from '@/lib/server-auth';
import { createAdminSupabase } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminSupabase();
  const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

  let customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await StripeService.createCustomer(user.email!, user.user_metadata?.full_name);
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const price = await StripeService.createPremiumPrice();
  const session = await StripeService.createCheckoutSession(
    customerId!,
    price.id,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings?success=1`,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings?canceled=1`
  );

  return NextResponse.json({ url: session.url });
}

