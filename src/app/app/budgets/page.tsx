'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

async function getAuthHeaders() {
  const { getAuthHeaders } = await import('@/lib/client-auth');
  return await getAuthHeaders();
}

async function fetchBudgets() {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/budgets', { headers });
  if (!res.ok) throw new Error('Failed to load budgets');
  return (await res.json()) as { budgets: any[] };
}

async function createBudget(payload: any) {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/budgets', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create budget');
  return (await res.json()).budget;
}

async function fetchFinancialSettings() {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/financial-settings', { headers });
  if (!res.ok) throw new Error('Failed to load settings');
  return (await res.json()) as { settings: { income_override?: number; expected_salary?: number } | null };
}

async function saveFinancialSettings(payload: any) {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/financial-settings', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to save settings');
  return (await res.json()).settings;
}

export default function BudgetsPage() {
  const { loading } = useAuth();
  const qc = useQueryClient();

  const { data: budgetsData } = useQuery({ queryKey: ['budgets'], queryFn: fetchBudgets, enabled: !loading });
  const { data: settingsData } = useQuery({ queryKey: ['financial-settings'], queryFn: fetchFinancialSettings, enabled: !loading });

  const createMutation = useMutation({ mutationFn: createBudget, onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }) });
  const saveSettingsMutation = useMutation({ mutationFn: saveFinancialSettings, onSuccess: () => qc.invalidateQueries({ queryKey: ['financial-settings'] }) });

  const [name, setName] = React.useState('');
  const [amount, setAmount] = React.useState<number>(0);
  const [period, setPeriod] = React.useState('monthly');
  const [scope, setScope] = React.useState<'global'|'bank'|'category'>('global');
  const [bankId, setBankId] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');

  const budgets = budgetsData?.budgets || [];
  const settings = settingsData?.settings || null;

  // Monthly income actual: sum of positive credits for last full month
  // For simplicity we’ll compute in UI by calling analytics summary later; here show override if set
  const incomeOverride = settings?.income_override ?? null;

  // Pay rise simulator
  const [currentSalary, setCurrentSalary] = React.useState<number>(settings?.expected_salary || 0);
  const [newSalary, setNewSalary] = React.useState<number>(settings?.expected_salary || 0);
  const currentMonthly = currentSalary / 12;
  const newMonthly = newSalary / 12;
  const delta = newMonthly - currentMonthly;

  const onCreate = async () => {
    await createMutation.mutateAsync({ name, amount, period, scope, bank_id: bankId || null, category_id: categoryId || null });
    setName(''); setAmount(0); setBankId(''); setCategoryId(''); setScope('global'); setPeriod('monthly');
  };

  const onSaveSettings = async () => {
    await saveSettingsMutation.mutateAsync({ income_override: incomeOverride ?? null, expected_salary: currentSalary || null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
      </div>

      {/* Create Budget */}
      <Card>
        <CardHeader>
          <CardTitle>Create a budget</CardTitle>
          <CardDescription>Global, per bank, or per category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Monthly Budget" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Amount (NZD)</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Period</label>
              <select className="border rounded px-2 py-1 w-full" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Scope</label>
              <select className="border rounded px-2 py-1 w-full" value={scope} onChange={(e) => setScope(e.target.value as any)}>
                <option value="global">Global</option>
                <option value="bank">Per Bank</option>
                <option value="category">Per Category</option>
              </select>
            </div>
            {scope === 'bank' && (
              <div>
                <label className="text-xs text-gray-600">Bank</label>
                <select className="border rounded px-2 py-1 w-full" value={bankId} onChange={(e) => setBankId(e.target.value)}>
                  <option value="">Select bank</option>
                  <option value="ANZ">ANZ</option>
                  <option value="ASB">ASB</option>
                  <option value="BNZ">BNZ</option>
                  <option value="WESTPAC">WESTPAC</option>
                </select>
              </div>
            )}
            {scope === 'category' && (
              <div>
                <label className="text-xs text-gray-600">Category</label>
                <Input value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="Category ID" />
              </div>
            )}
          </div>
          <Button onClick={onCreate} disabled={createMutation.isLoading || !name || !amount}>Create budget</Button>
        </CardContent>
      </Card>

      {/* Income and overrides */}
      <Card>
        <CardHeader>
          <CardTitle>Income and overrides</CardTitle>
          <CardDescription>See your monthly income across banks, and set an override</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-700">Monthly income (override): {incomeOverride != null ? formatCurrency(incomeOverride, 'NZD') : 'Not set'}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Expected salary (annual, NZD)</label>
              <Input type="number" value={currentSalary} onChange={(e) => setCurrentSalary(Number(e.target.value))} />
              <div className="text-xs text-gray-500 mt-1">≈ Monthly: {formatCurrency(currentMonthly || 0, 'NZD')}</div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Income override (monthly, NZD)</label>
              <Input type="number" defaultValue={incomeOverride ?? ''} onBlur={(e) => saveSettingsMutation.mutate({ income_override: Number(e.target.value) || null })} />
            </div>
          </div>
          <Button variant="outline" onClick={onSaveSettings} disabled={saveSettingsMutation.isLoading}>Save</Button>
        </CardContent>
      </Card>

      {/* Pay rise simulator */}
      <Card>
        <CardHeader>
          <CardTitle>Pay rise simulator</CardTitle>
          <CardDescription>Estimate monthly impact of a pay change</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600">Current salary (annual, NZD)</label>
              <Input type="number" value={currentSalary} onChange={(e) => setCurrentSalary(Number(e.target.value))} />
              <div className="text-xs text-gray-500 mt-1">≈ Monthly: {formatCurrency(currentMonthly || 0, 'NZD')}</div>
            </div>
            <div>
              <label className="text-xs text-gray-600">New salary (annual, NZD)</label>
              <Input type="number" value={newSalary} onChange={(e) => setNewSalary(Number(e.target.value))} />
              <div className="text-xs text-gray-500 mt-1">≈ Monthly: {formatCurrency(newMonthly || 0, 'NZD')}</div>
            </div>
            <div className={"flex items-end"}>
              <div className={"text-sm"}>
                <div className={"text-gray-600"}>Monthly change</div>
                <div className={delta >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{delta >= 0 ? '+' : ''}{formatCurrency(delta || 0, 'NZD')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing budgets list */}
      <Card>
        <CardHeader>
          <CardTitle>Your budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-sm text-gray-500">No budgets yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((b) => (
                <Card key={b.id}>
                  <CardHeader>
                    <CardTitle>{b.name}</CardTitle>
                    <CardDescription>{b.period} • {formatCurrency(b.amount, 'NZD')} • {b.scope?.toUpperCase?.()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-gray-500">Scope details: {b.scope === 'bank' ? (b.bank_id || '') : b.scope === 'category' ? (b.category_id || '') : 'Global'}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
