'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#16a34a" name="Income" />
                <Bar dataKey="spending" fill="#dc2626" name="Spending" />
              </BarChart>
      <div className="flex justify-end">
        {data.isPremium ? (
          <a className="text-sm underline" href={`/api/analytics/export?from=${encodeURIComponent(new Date(Date.now()-365*24*3600*1000).toISOString())}&to=${encodeURIComponent(new Date().toISOString())}`}>Download CSV</a>
        ) : (
          <div className="text-sm text-gray-500">Upgrade to Premium to export CSV</div>
        )}
      </div>

            </ResponsiveContainer>
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

