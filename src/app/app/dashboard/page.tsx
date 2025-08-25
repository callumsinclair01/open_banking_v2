'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PlusCircle,
  Building2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// Mock data - in a real app, this would come from your API
const mockData = {
  totalBalance: 15420.50,
  monthlyIncome: 4500.00,
  monthlyExpenses: 3200.75,
  accounts: [
    { id: '1', name: 'ANZ Everyday', balance: 2420.50, type: 'transactional' },
    { id: '2', name: 'ASB Savings', balance: 13000.00, type: 'savings' },
  ],
  recentTransactions: [
    { id: '1', description: 'Countdown Supermarket', amount: -85.50, date: '2024-01-15', category: 'Groceries' },
    { id: '2', description: 'Salary Payment', amount: 2250.00, date: '2024-01-15', category: 'Income' },
    { id: '3', description: 'Spark Mobile', amount: -45.00, date: '2024-01-14', category: 'Utilities' },
    { id: '4', description: 'Coffee Supreme', amount: -6.50, date: '2024-01-14', category: 'Food & Drink' },
  ],
  budgets: [
    { id: '1', name: 'Groceries', spent: 320, budget: 400, percentage: 80 },
    { id: '2', name: 'Entertainment', spent: 150, budget: 200, percentage: 75 },
    { id: '3', name: 'Transport', spent: 180, budget: 150, percentage: 120 },
  ],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const netIncome = mockData.monthlyIncome - mockData.monthlyExpenses;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600">Here's your financial overview for today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/app/settings/subscription">
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
            <div className="text-2xl font-bold">{formatCurrency(mockData.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Across {mockData.accounts.length} accounts
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
              {formatCurrency(mockData.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(mockData.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              -5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
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
              {mockData.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.amount > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/app/transactions">
                <Button variant="outline" className="w-full">
                  View All Transactions
                </Button>
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
              {mockData.budgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{budget.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                      </span>
                      {budget.percentage > 100 && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        budget.percentage > 100 
                          ? 'bg-red-500' 
                          : budget.percentage > 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{budget.percentage}% used</span>
                    <span>{formatCurrency(budget.budget - budget.spent)} remaining</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/app/budgets">
                <Button variant="outline" className="w-full">
                  Manage Budgets
                </Button>
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
