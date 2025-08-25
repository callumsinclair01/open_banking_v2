'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { BarChart2, Lock } from 'lucide-react';

interface Summary {
  isPremium: boolean;
  totals: { income: number; spending: number; net: number };
  trend: Array<{ month: string; income: number; spending: number }>;
  topCategories: Array<{ category_id: string; total: number }>;
}

async function fetchSummary() {
  const res = await fetch('/api/analytics/summary');
  if (!res.ok) throw new Error('Failed to load analytics');
  return (await res.json()) as Summary;
}

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['analytics-summary'], queryFn: fetchSummary });

  if (isLoading) return <p>Loading analytics...</p>;
  if (isError || !data) return <p>Failed to load analytics</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Income</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">{formatCurrency(data.totals.income)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Spending</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">{formatCurrency(data.totals.spending)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Net</CardTitle></CardHeader>
          <CardContent className={`text-2xl font-bold ${data.totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.totals.net)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trend (last 12 months)</CardTitle>
          <CardDescription>Income vs Spending by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-gray-500">
            <BarChart2 className="h-6 w-6 mr-2" />
            Placeholder chart — integrate Recharts later
          </div>
        </CardContent>
      </Card>

      {!data.isPremium && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Premium Insights</CardTitle>
            <CardDescription>Upgrade to Premium to unlock advanced analytics like merchant trends, forecasting, and export.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Merchant-level breakdowns</li>
              <li>Cashflow forecasting</li>
              <li>Export to CSV</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

