import { User, Account, Transaction, Category, Budget } from '@prisma/client';

// Extend the default session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      subscriptionTier: string;
    };
  }
}

// Open Banking types
export interface OpenBankingAccount {
  accountId: string;
  accountType: 'transactional' | 'savings' | 'credit_card' | 'lending';
  accountName: string;
  accountNumber: string;
  currentBalance: number;
  availableBalance?: number;
  currency: string;
}

export interface OpenBankingTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  transactionDate: string;
  valueDate?: string;
  type: 'debit' | 'credit';
  status: 'pending' | 'completed' | 'failed';
  merchantName?: string;
  merchantCategory?: string;
}

export interface OpenBankingConsent {
  consentId: string;
  status: 'active' | 'expired' | 'revoked';
  permissions: string[];
  expiresAt: string;
}

// Bank provider types
export type BankProvider = 'ANZ' | 'ASB' | 'BNZ' | 'Westpac' | 'Kiwibank' | 'AKAHU';

export interface BankConnection {
  id: string;
  bankId: BankProvider;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: Date;
  accounts: OpenBankingAccount[];
}

// Subscription types
export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionLimits {
  maxBankConnections: number;
  maxCategories: number;
  maxBudgets: number;
  advancedReports: boolean;
  exportData: boolean;
}

// Dashboard types
export interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentTransactions: Transaction[];
  topCategories: Array<{
    category: Category;
    amount: number;
    percentage: number;
  }>;
  budgetProgress: Array<{
    budget: Budget;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInForm {
  email: string;
  password: string;
}

export interface CategoryForm {
  name: string;
  color: string;
  icon?: string;
  parentId?: string;
}

export interface BudgetForm {
  name: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate?: Date;
}
