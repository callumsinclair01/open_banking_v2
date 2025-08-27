import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import openBankingService from '@/services/openBanking';
import { generateSecureRandom } from '@/lib/encryption';
import { canPerformAction } from '@/lib/utils';
import { BankProvider } from '@/types';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';

const connectSchema = z.object({
  bankId: z.enum(['ANZ', 'ASB', 'BNZ', 'Westpac', 'Kiwibank', 'AKAHU']),
  permissions: z.array(z.string()).default(['account_info']),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { bankId, permissions } = connectSchema.parse(body);

    const supabase = createServerSupabase(request.headers.get('x-supabase-auth') || undefined);

    // Get subscription tier and existing consents
    const [{ data: profile }, { data: existingConsents }] = await Promise.all([
      supabase.from('profiles').select('subscription_tier').eq('id', user.id).single(),
      supabase.from('open_banking_consents').select('status, bank_id').eq('user_id', user.id),
    ]);

    const currentConnections = (existingConsents || []).filter(c => c.status === 'active').length;
    const tier = (profile?.subscription_tier || 'free') as any;

    if (!canPerformAction(tier, 'maxBankConnections', currentConnections)) {
      return NextResponse.json(
        {
          error: 'Bank connection limit reached. Upgrade to Premium to connect more banks.',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const already = (existingConsents || []).find(c => c.bank_id === bankId && c.status === 'active');
    if (already) {
      return NextResponse.json({ error: 'Bank already connected' }, { status: 400 });
    }

    // Generate state parameter for OAuth flow
    const state = generateSecureRandom(32);

    // Persist state for callback verification
    await supabase.from('open_banking_oauth_state').insert({
      state,
      user_id: user.id,
      bank_id: bankId,
      permissions,
    });

    const authUrl = openBankingService.generateAuthUrl(
      bankId as BankProvider,
      state,
      permissions
    );

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'open_banking_connect_initiated',
      resource: 'bank_connection',
      details: { bankId, permissions, state },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ success: true, authUrl, state });
  } catch (error) {
    console.error('Open Banking connect error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
