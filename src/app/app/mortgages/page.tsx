'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

async function getAuthHeaders() {
  const { getAuthHeaders } = await import('@/lib/client-auth');
  return await getAuthHeaders();
}

async function fetchMortgages() {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/mortgages', { headers });
  if (!res.ok) throw new Error('Failed to load');
  return (await res.json()) as { mortgages: any[] };
}

async function createMortgage(payload: any) {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/mortgages', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create');
  return (await res.json()).mortgage;
}

async function simulate(payload: any) {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/mortgages/simulate', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  //if (!res.ok) throw new Error('Premium required');
  return (await res.json()) as { schedule: any[]; totalInterest: number; monthsToPayoff: number };
}

export default function MortgagesPage() {
  const { loading } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['mortgages'], queryFn: fetchMortgages, enabled: !loading });
  const createMutation = useMutation({ mutationFn: createMortgage, onSuccess: () => qc.invalidateQueries({ queryKey: ['mortgages'] }) });

  const [name, setName] = React.useState('Home Loan');
  const [principal, setPrincipal] = React.useState<number>(500000);
  const [rate, setRate] = React.useState<number>(0.0695);
  const [termMonths, setTermMonths] = React.useState<number>(360);
  const [startDate, setStartDate] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [frequency, setFrequency] = React.useState<'monthly'|'fortnightly'|'weekly'>('monthly');
  const [extra, setExtra] = React.useState<number>(0);

  const [sim, setSim] = React.useState<{schedule:any[]; totalInterest:number; monthsToPayoff:number} | null>(null);

  const onCreate = async () => {
    await createMutation.mutateAsync({ name, principal, interest_rate: rate, term_months: termMonths, start_date: startDate, payment_frequency: frequency, extra_payment: extra });
    setName('Home Loan');
  };

  const onSimulate = async () => {
    const result = await simulate({ principal, annualRate: rate, termMonths, startDate, frequency, extraPayment: extra });
    setSim(result);
  };

  const payoffYears = sim ? (sim.monthsToPayoff / 12) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mortgages (Premium)</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create mortgage</CardTitle>
          <CardDescription>Track your home loan and test strategies</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Principal (NZD)</label>
            <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Interest rate (annual)</label>
            <Input type="number" step="0.0001" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Term (months)</label>
            <Input type="number" value={termMonths} onChange={(e) => setTermMonths(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Frequency</label>
            <select className="border rounded px-2 py-1 w-full" value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
              <option value="monthly">Monthly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Extra per period (NZD)</label>
            <Input type="number" value={extra} onChange={(e) => setExtra(Number(e.target.value))} />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <Button onClick={onCreate} disabled={createMutation.isLoading}>Save mortgage</Button>
            <Button variant="outline" onClick={onSimulate}>Simulate payoff</Button>
          </div>
        </CardContent>
      </Card>

      {sim && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>
              Total interest: {formatCurrency(sim.totalInterest, 'NZD')} • Payoff time: {sim.monthsToPayoff} months (~{payoffYears.toFixed(1)} years)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">Showing first 12 periods:</div>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">{JSON.stringify(sim.schedule.slice(0, 12), null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

