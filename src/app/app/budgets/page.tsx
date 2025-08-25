'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function BudgetsPage() {
  const budgets: Array<{ id: string; name: string; amount: number; period: string; spent: number }>= [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <Link href="#">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Budget
          </Button>
        </Link>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No budgets yet</CardTitle>
            <CardDescription>
              Create budgets to track your spending across categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create your first budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <CardTitle>{budget.name}</CardTitle>
                <CardDescription>{budget.period} • ${budget.amount.toFixed(2)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      budget.spent / budget.amount > 1
                        ? 'bg-red-500'
                        : budget.spent / budget.amount > 0.8
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
