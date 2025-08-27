'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Link2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSubscriptionLimits } from '@/lib/utils';

const BANKS = ['AKAHU', 'ANZ', 'ASB', 'BNZ', 'Westpac', 'Kiwibank'] as const;

type Consent = {
  bank_id: typeof BANKS[number];
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  updated_at: string;
  permissions: string[];
  consent_id: string;
};

type Profile = { subscription_tier: 'free' | 'premium' };

export default function BanksSettingsPage() {
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[number]>('ANZ');
  const [connecting, setConnecting] = useState(false);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['banks-settings'],
    queryFn: async () => {
      const [{ data: profile }, { data: consents }] = await Promise.all([
        supabase.from('profiles').select('subscription_tier').single(),
        supabase.from('open_banking_consents').select('bank_id,status,created_at,updated_at,permissions,consent_id'),
      ]);
      return { profile: (profile as Profile) || { subscription_tier: 'free' }, consents: (consents as Consent[]) || [] };
    },
  });

  const limits = useMemo(() => getSubscriptionLimits(data?.profile.subscription_tier || 'free'), [data]);
  const activeCount = (data?.consents || []).filter(c => c.status === 'active').length;
  const atLimit = activeCount >= (limits.maxBankConnections as number);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/open-banking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankId: selectedBank, permissions: ['account_info'] }),
      });
      if (!res.ok) throw new Error('Failed to initiate connect');
      const json = await res.json();
      if (json.authUrl) {
        window.location.href = json.authUrl as string;
      }
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    // refetch when returning from OAuth
    if (typeof window !== 'undefined' && window.location.search.includes('success')) {
      refetch();
    }
  }, [refetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Banks</h1>
        <div className="text-sm text-gray-600">{activeCount}/{limits.maxBankConnections} connected</div>
      </div>

      {atLimit && data?.profile.subscription_tier === 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Upgrade to connect more banks</CardTitle>
            <CardDescription>Free plan allows 1 bank. Upgrade to Premium to connect up to {limits.maxBankConnections} banks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/app/settings?upgrade=1">Upgrade to Premium</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connect a bank</CardTitle>
          <CardDescription>Securely connect your bank using Open Banking NZ</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <select
              className="border rounded px-2 py-1"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value as any)}
              disabled={atLimit}
            >
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleConnect} disabled={connecting || atLimit}>
            <Link2 className={`h-4 w-4 mr-2 ${connecting ? 'animate-spin' : ''}`} />
            Connect
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected banks</CardTitle>
          <CardDescription>Manage your existing connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.consents || []).map((c) => (
              <div key={`${c.bank_id}-${c.consent_id}`} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{c.bank_id}</div>
                  <div className="text-xs text-gray-500">{new Date(c.updated_at).toLocaleString()}</div>
                </div>
                <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
              </div>
            ))}
            {(!data?.consents || data.consents.length === 0) && (
              <div className="text-sm text-gray-600">No banks connected yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

