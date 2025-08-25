'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, PlusCircle } from 'lucide-react';

export default function AccountsPage() {
  // Placeholder UI; later will fetch accounts from Supabase
  const accounts: Array<{ id: string; name: string; balance: number; bank: string }>= [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <Link href="/app/settings/banks">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Connect Bank
          </Button>
        </Link>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No accounts connected</CardTitle>
            <CardDescription>
              Connect your bank to start tracking balances and transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/settings/banks">
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Connect a bank
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle>{account.name}</CardTitle>
                <CardDescription>{account.bank}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">${account.balance.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
