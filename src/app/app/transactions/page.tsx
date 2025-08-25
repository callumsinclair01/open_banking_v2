'use client';

import React from 'react';
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

async function fetchTransactions(token?: string, params?: Record<string, string>) {
  const qs = new URLSearchParams(params || {}).toString();
  const res = await fetch(`/api/transactions${qs ? `?${qs}` : ''}`, {
    headers: token ? { 'x-supabase-auth': token } : undefined,
  });
  if (!res.ok) throw new Error('Failed to load transactions');
  return (await res.json()) as { transactions: Txn[]; pagination?: { page: number; limit: number; total: number } };
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

  const [page, setPage] = React.useState(1);
  const [type, setType] = React.useState<string>('');
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');

  const params: Record<string, string> = {};
  if (page) params.page = String(page);
  if (type) params.type = type;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => fetchTransactions(undefined, params),
    enabled: !loading,
    keepPreviousData: true,
  });

  const mutation = useMutation({
    mutationFn: () => syncTransactions(),
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

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="text-xs text-gray-600">Type</label>
          <select className="border rounded px-2 py-1 ml-2" value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
            <option value="">All</option>
            <option value="credit">Incoming</option>
            <option value="debit">Outgoing</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">From</label>
          <input type="date" className="border rounded px-2 py-1 ml-2" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
        </div>
        <div>
          <label className="text-xs text-gray-600">To</label>
          <input type="date" className="border rounded px-2 py-1 ml-2" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
        </div>
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

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <div className="text-xs text-gray-500">
                Page {data?.pagination?.page || page} • {data?.pagination?.total || 0} total
              </div>
              <Button variant="outline" disabled={(data?.transactions.length || 0) < (data?.pagination?.limit || 50)} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

