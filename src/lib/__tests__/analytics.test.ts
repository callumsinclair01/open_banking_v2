import { computeTotals, trendByMonth, topCategories } from '@/lib/analytics';

const base = (overrides: any = {}) => ({
  id: '1', user_id: 'u', account_id: 'a', bank_transaction_id: 'bt',
  amount: 10, currency: 'NZD', description: 'd', reference: null,
  transaction_date: '2025-01-15T00:00:00Z', value_date: null,
  category_id: null, type: 'debit', status: 'completed',
  merchant_name: null, merchant_category: null, created_at: '2025-01-15', updated_at: '2025-01-15',
  ...overrides,
});

describe('analytics utils', () => {
  it('computes totals', () => {
    const txns = [base({ type: 'credit', amount: 100 }), base({ type: 'debit', amount: 40 })] as any;
    expect(computeTotals(txns)).toEqual({ income: 100, spending: 40, net: 60 });
  });

  it('computes trend by month', () => {
    const txns = [
      base({ transaction_date: '2025-01-03T00:00:00Z', type: 'debit', amount: 10 }),
      base({ transaction_date: '2025-01-10T00:00:00Z', type: 'credit', amount: 30 }),
      base({ transaction_date: '2025-02-10T00:00:00Z', type: 'debit', amount: 20 }),
    ] as any;
    expect(trendByMonth(txns)).toEqual([
      { month: '2025-01', income: 30, spending: 10 },
      { month: '2025-02', income: 0, spending: 20 },
    ]);
  });

  it('finds top categories', () => {
    const txns = [
      base({ category_id: 'c1', amount: 50 }),
      base({ category_id: 'c1', amount: 25 }),
      base({ category_id: 'c2', amount: 30 }),
    ] as any;
    expect(topCategories(txns, 1)).toEqual([{ category_id: 'c1', total: 75 }]);
  });
});

