import { NextRequest, NextResponse } from 'next/server';
import openBankingService from '@/services/openBanking';
import { encryptAccessToken } from '@/lib/encryption';
import { createAdminSupabase } from '@/lib/server-supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Open Banking OAuth error:', error);
      return NextResponse.redirect(new URL(`/app/settings/banks?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/app/settings/banks?error=missing_parameters', request.url));
    }

    const supabase = createAdminSupabase();
    const { data: stateRow } = await supabase
      .from('open_banking_oauth_state')
      .select('user_id, bank_id, permissions')
      .eq('state', state)
      .single();

    if (!stateRow) {
      return NextResponse.redirect(new URL('/app/settings/banks?error=invalid_state', request.url));
    }


    // Exchange code for tokens with provider
    const tokens = await openBankingService.exchangeCodeForTokens(stateRow.bank_id as any, code);
    const encryptedAccess = encryptAccessToken(tokens.access_token);
    const encryptedRefresh = tokens.refresh_token ? encryptAccessToken(tokens.refresh_token) : null;

    // Store consent
    const { error: upErr } = await supabase.from('open_banking_consents').upsert({
      user_id: stateRow.user_id,
      bank_id: stateRow.bank_id,
      consent_id: tokens.consent_id,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      permissions: stateRow.permissions,
      status: 'active',
    }, { onConflict: 'user_id,bank_id' });
    if (upErr) {
      console.error('Consent upsert failed', upErr.message);
      return NextResponse.redirect(new URL('/app/settings/banks?error=consent_store_failed', request.url));
    }

    // Clean up state
    await supabase.from('open_banking_oauth_state').delete().eq('state', state);

    // Redirect success
    return NextResponse.redirect(new URL('/app/settings/banks?success=1', request.url));
  } catch (e) {
    console.error('Open Banking callback error:', e);
    return NextResponse.redirect(new URL('/app/settings/banks?error=callback_failed', request.url));
  }
}
