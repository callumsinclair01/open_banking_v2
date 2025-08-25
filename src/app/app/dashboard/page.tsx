'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PlusCircle,
  Building2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

function firstDayOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    enabled: !!user,
    queryFn: async () => {
      const [accountsRes, incomeRes, expenseRes, recentRes, budgetsRes] = await Promise.all([
        supabase.from('accounts').select('current_balance').eq('user_id', user!.id),
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user!.id)
          .eq('type', 'credit')
          .gte('transaction_date', firstDayOfMonthISO()),
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user!.id)
          .eq('type', 'debit')
          .gte('transaction_date', firstDayOfMonthISO()),
        supabase
          .from('transactions')
          .select('id, description, amount, transaction_date, type')
          .eq('user_id', user!.id)
          .order('transaction_date', { ascending: false })
          .limit(4),
        supabase.from('budgets').select('id, name, amount, period, category_id').eq('user_id', user!.id),
      ]);

      const totalBalance = (accountsRes.data || []).reduce((s, a) => s + Number(a.current_balance), 0);
      const monthlyIncome = (incomeRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const monthlyExpenses = (expenseRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const recentTransactions = recentRes.data || [];

      // Compute budget progress for current month (sum of debit txns per category)
      const budgets = (budgetsRes.data || []) as Array<{ id: string; name: string; amount: number; category_id: string }>;
      let budgetsWithSpent: Array<{ id: string; name: string; spent: number; budget: number; percentage: number }> = [];
      if (budgets.length) {
        const { data: catDebits } = await supabase
          .from('transactions')
          .select('category_id, amount')
          .eq('user_id', user!.id)
          .eq('type', 'debit')
          .gte('transaction_date', firstDayOfMonthISO());
        const map = new Map<string, number>();
        (catDebits || []).forEach((t) => {
          if (!t.category_id) return;
          map.set(t.category_id, (map.get(t.category_id) || 0) + Number(t.amount));
        });
        budgetsWithSpent = budgets.map((b) => {
          const spent = map.get(b.category_id) || 0;
          const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
          return { id: b.id, name: b.name, spent, budget: b.amount, percentage };
        });
      }

      return { totalBalance, monthlyIncome, monthlyExpenses, recentTransactions, budgets: budgetsWithSpent };
    },
  });

  const netIncome = (data?.monthlyIncome || 0) - (data?.monthlyExpenses || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600">Here's your financial overview for today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/app/settings?upgrade=1">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
              <PlusCircle className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
          <Link href="/app/settings/banks">
            <Button>
              <Building2 className="h-4 w-4 mr-2" />
              Connect Bank
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '—' : formatCurrency(data!.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              {/* Could show accounts count with another query */}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? '—' : formatCurrency(data!.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? '—' : formatCurrency(data!.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {isLoading ? '—' : formatCurrency(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.recentTransactions || []).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                      {transaction.type === 'credit' ? '+' : ''}{formatCurrency(Math.abs(Number(transaction.amount)))}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {(!data || data.recentTransactions.length === 0) && <div className="text-sm text-gray-500">No transactions yet.</div>}
            </div>
            <div className="mt-4">
              <Link href="/app/transactions">
                <Button variant="outline" className="w-full">View All Transactions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>How you're tracking against your budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.budgets || []).map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{budget.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                      </span>
                      {budget.percentage > 100 && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${budget.percentage > 100 ? 'bg-red-500' : budget.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{budget.percentage}% used</span>
                    <span>{formatCurrency(budget.budget - budget.spent)} remaining</span>
                  </div>
                </div>
              ))}
              {(!data || data.budgets.length === 0) && <div className="text-sm text-gray-500">No budgets created yet.</div>}
            </div>
            <div className="mt-4">
              <Link href="/app/budgets">
                <Button variant="outline" className="w-full">Manage Budgets</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/app/settings/banks">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Building2 className="h-6 w-6" />
                <span>Connect Bank</span>
              </Button>
            </Link>
            <Link href="/app/budgets">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <PlusCircle className="h-6 w-6" />
                <span>Create Budget</span>
              </Button>
            </Link>
            <Link href="/app/analytics">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <TrendingUp className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
