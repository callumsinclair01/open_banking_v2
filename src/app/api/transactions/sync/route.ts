import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';
import openBankingService from '@/services/openBanking';
import { decryptAccessToken } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);

  // Load active consents
  const { data: consents, error: cErr } = await supabase
    .from('open_banking_consents')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  let inserted = 0;

  for (const consent of consents || []) {
    const accessToken = decryptAccessToken(consent.access_token);

    // Fetch accounts from provider
    // In a production integration, we would store provider account IDs mapped to ours
    try {
      const accounts = await openBankingService.getAccounts(accessToken);
      for (const acct of accounts) {
        // Ensure account exists in our DB and get internal account UUID
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('bank_account_id', acct.accountId)
          .single();

        let accountId = existingAccount?.id as string | undefined;
        if (!accountId) {
          const { data: insertedAccount, error: accErr } = await supabase
            .from('accounts')
            .insert({
              user_id: user.id,
              bank_account_id: acct.accountId,
              bank_id: consent.bank_id as any,
              account_type: (acct.accountType as any) || 'transactional',
              account_name: acct.accountName,
              account_number: JSON.stringify({ ciphertext: 'NA', iv: '', tag: '' }),
              current_balance: acct.currentBalance,
              available_balance: acct.availableBalance ?? null,
              currency: acct.currency || 'NZD',
              is_active: true,
            })
            .select('id')
            .single();
          if (accErr) throw accErr;
          accountId = insertedAccount!.id;
        }

        const txns = await openBankingService.getTransactions(accessToken, acct.accountId);
        for (const t of txns) {
          const { error } = await supabase
            .from('transactions')
            .upsert({
              user_id: user.id,
              account_id: accountId!,
              bank_transaction_id: t.transactionId,
              amount: t.amount,
              currency: t.currency,
              description: t.description,
              reference: t.reference || null,
              transaction_date: t.transactionDate,
              value_date: t.valueDate || null,
              type: t.type,
              status: t.status,
              merchant_name: t.merchantName || null,
              merchant_category: t.merchantCategory || null,
            }, { onConflict: 'user_id,bank_transaction_id' });
          if (error) throw error;
          inserted++;
        }
      }
    } catch (e: any) {
      console.error('Sync error:', e?.message || e);
      return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, inserted });
}

