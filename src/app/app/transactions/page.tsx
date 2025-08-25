'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Txn {
  id: string;
  amount: number;
  currency: string;
  description: string;
  reference: string | null;
  transaction_date: string;
  type: 'debit' | 'credit';
}

async function fetchTransactions(token?: string) {
  const res = await fetch('/api/transactions', {
    headers: token ? { 'x-supabase-auth': token } : undefined,
  });
  if (!res.ok) throw new Error('Failed to load transactions');
  return (await res.json()) as { transactions: Txn[] };
}

async function syncTransactions(token?: string) {
  const res = await fetch('/api/transactions/sync', {
    method: 'POST',
    headers: token ? { 'x-supabase-auth': token } : undefined,
  });
  if (!res.ok) throw new Error('Failed to sync transactions');
}

export default function TransactionsPage() {
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    enabled: !loading,
  });

  const mutation = useMutation({
    mutationFn: syncTransactions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isLoading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${mutation.isLoading ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : isError ? (
        <p>Failed to load transactions</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All activity</CardTitle>
            <CardDescription>Incoming and outgoing transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data!.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {t.type === 'credit' ? (
                      <ArrowDownCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{t.description}</div>
                      <div className="text-xs text-gray-500">{formatDate(t.transaction_date)}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${t.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(t.amount), t.currency)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

