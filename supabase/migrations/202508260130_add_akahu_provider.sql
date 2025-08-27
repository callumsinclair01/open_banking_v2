-- Add AKAHU to bank_provider enum
DO $$ BEGIN
  ALTER TYPE public.bank_provider ADD VALUE IF NOT EXISTS 'AKAHU';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

