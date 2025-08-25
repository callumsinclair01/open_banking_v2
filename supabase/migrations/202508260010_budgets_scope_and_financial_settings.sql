-- Extend budgets to support global/bank/category scopes and add financial settings for income overrides

-- 1) Types
DO $$ BEGIN
  CREATE TYPE budget_scope AS ENUM ('global','bank','category');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Alter budgets
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS scope budget_scope DEFAULT 'category' NOT NULL;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS bank_id bank_provider;

-- Only allow bank_id when scope='bank'; and category_id when scope='category'
DO $$ BEGIN
  ALTER TABLE public.budgets
    ADD CONSTRAINT budgets_scope_bank_chk CHECK (
      (scope = 'bank' AND bank_id IS NOT NULL) OR (scope <> 'bank')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.budgets
    ADD CONSTRAINT budgets_scope_category_chk CHECK (
      (scope = 'category' AND category_id IS NOT NULL) OR (scope <> 'category')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Financial settings per user (income override etc.)
CREATE TABLE IF NOT EXISTS public.financial_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  income_override numeric(15,2), -- optional monthly income override
  expected_salary numeric(15,2), -- annual
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner rw" ON public.financial_settings;
CREATE POLICY "owner rw" ON public.financial_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_financial_settings_updated_at ON public.financial_settings;
CREATE TRIGGER update_financial_settings_updated_at BEFORE UPDATE ON public.financial_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

