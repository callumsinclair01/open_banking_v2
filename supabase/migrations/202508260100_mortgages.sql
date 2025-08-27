-- Mortgages support for premium feature

DO $$ BEGIN
  CREATE TYPE payment_frequency AS ENUM ('monthly','fortnightly','weekly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.mortgages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  principal numeric(15,2) NOT NULL CHECK (principal > 0),
  interest_rate numeric(8,5) NOT NULL CHECK (interest_rate > 0), -- annual nominal e.g. 0.0695
  term_months integer NOT NULL CHECK (term_months > 0),
  start_date date NOT NULL,
  payment_frequency payment_frequency NOT NULL DEFAULT 'monthly',
  current_balance numeric(15,2), -- optional; if null, assume principal
  extra_payment numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mortgages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner rw mortgages" ON public.mortgages;
CREATE POLICY "owner rw mortgages" ON public.mortgages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_mortgages_updated_at ON public.mortgages;
CREATE TRIGGER touch_mortgages_updated_at BEFORE UPDATE ON public.mortgages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

