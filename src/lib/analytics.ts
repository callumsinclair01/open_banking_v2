import { Database } from '@/types/database';

type Txn = Database['public']['Tables']['transactions']['Row'];

export interface Totals {
  income: number;
  spending: number;
  net: number;
}

export function computeTotals(transactions: Txn[]): Totals {
  const income = transactions
    .filter(t => t.type === 'credit')
    .reduce((s, t) => s + Number(t.amount), 0);
  const spending = transactions
    .filter(t => t.type === 'debit')
    .reduce((s, t) => s + Number(t.amount), 0);
  return { income, spending, net: income - spending };
}

export interface MonthlyPoint { month: string; income: number; spending: number; }

export function trendByMonth(transactions: Txn[]): MonthlyPoint[] {
  const map = new Map<string, { income: number; spending: number }>();
  for (const t of transactions) {
    const d = new Date(t.transaction_date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const cur = map.get(key) || { income: 0, spending: 0 };
    if (t.type === 'credit') cur.income += Number(t.amount);
    else cur.spending += Number(t.amount);
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, income: v.income, spending: v.spending }));
}

export function topCategories(transactions: Txn[], topN = 5): Array<{ category_id: string; total: number }>{
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!t.category_id) continue;
    const cur = map.get(t.category_id) || 0;
    map.set(t.category_id, cur + Number(t.amount));
  }
  return Array.from(map.entries())
    .map(([category_id, total]) => ({ category_id, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);
}

