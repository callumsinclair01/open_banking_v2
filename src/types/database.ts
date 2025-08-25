export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          subscription_id: string | null
          subscription_status: string | null
          subscription_tier: 'free' | 'premium'
          subscription_ends_at: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: 'free' | 'premium'
          subscription_ends_at?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: 'free' | 'premium'
          subscription_ends_at?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      open_banking_consents: {
        Row: {
          id: string
          user_id: string
          bank_id: 'ANZ' | 'ASB' | 'BNZ' | 'Westpac' | 'Kiwibank'
          consent_id: string
          access_token: string
          refresh_token: string | null
          token_expires_at: string
          permissions: string[]
          status: 'active' | 'expired' | 'revoked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_id: 'ANZ' | 'ASB' | 'BNZ' | 'Westpac' | 'Kiwibank'
          consent_id: string
          access_token: string
          refresh_token?: string | null
          token_expires_at: string
          permissions?: string[]
          status?: 'active' | 'expired' | 'revoked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_id?: 'ANZ' | 'ASB' | 'BNZ' | 'Westpac' | 'Kiwibank'
          consent_id?: string
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string
          permissions?: string[]
          status?: 'active' | 'expired' | 'revoked'
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          bank_account_id: string
          bank_id: 'ANZ' | 'ASB' | 'BNZ' | 'Westpac' | 'Kiwibank'
          account_type: 'transactional' | 'savings' | 'credit_card' | 'lending'
          account_name: string
          account_number: string
          current_balance: number
          available_balance: number | null
          currency: string
          is_active: boolean
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_account_id: string
          bank_id: 'ANZ' | 'ASB' | 'BNZ' | 'Westpac' | 'Kiwibank'
          account_type: 'transactional' | 'savings' | 'credit_card' | 'lending'
          account_name: string
          account_number: string
          current_balance?: number
          available_balance?: number | null
          currency?: string
          is_active?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_account_id?: string
          bank_id?: 'ANZ' | 'ASB' | 'BNZ' | 'Westpac' | 'Kiwibank'
          account_type?: 'transactional' | 'savings' | 'credit_card' | 'lending'
          account_name?: string
          account_number?: string
          current_balance?: number
          available_balance?: number | null
          currency?: string
          is_active?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          bank_transaction_id: string
          amount: number
          currency: string
          description: string
          reference: string | null
          transaction_date: string
          value_date: string | null
          category_id: string | null
          type: 'debit' | 'credit'
          status: 'pending' | 'completed' | 'failed'
          merchant_name: string | null
          merchant_category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          bank_transaction_id: string
          amount: number
          currency?: string
          description: string
          reference?: string | null
          transaction_date: string
          value_date?: string | null
          category_id?: string | null
          type: 'debit' | 'credit'
          status?: 'pending' | 'completed' | 'failed'
          merchant_name?: string | null
          merchant_category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          bank_transaction_id?: string
          amount?: number
          currency?: string
          description?: string
          reference?: string | null
          transaction_date?: string
          value_date?: string | null
          category_id?: string | null
          type?: 'debit' | 'credit'
          status?: 'pending' | 'completed' | 'failed'
          merchant_name?: string | null
          merchant_category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string | null
          parent_id: string | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string | null
          parent_id?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string | null
          parent_id?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          name: string
          amount: number
          period: 'monthly' | 'weekly' | 'yearly'
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          name: string
          amount: number
          period: 'monthly' | 'weekly' | 'yearly'
          start_date: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          name?: string
          amount?: number
          period?: 'monthly' | 'weekly' | 'yearly'
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource: string | null
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_balance: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
      get_monthly_spending: {
        Args: {
          user_uuid: string
          month_start: string
        }
        Returns: number
      }
      get_monthly_income: {
        Args: {
          user_uuid: string
          month_start: string
        }
        Returns: number
      }
    }
    Enums: {
      subscription_tier: 'free' | 'premium'
      account_type: 'transactional' | 'savings' | 'credit_card' | 'lending'
      transaction_type: 'debit' | 'credit'
      transaction_status: 'pending' | 'completed' | 'failed'
      consent_status: 'active' | 'expired' | 'revoked'
      bank_provider: 'ANZ' | 'ASB' | 'BNZ' | 'Westpac' | 'Kiwibank'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
