-- Ensure profiles table and robust signup trigger exist and use fully-qualified names

-- 1) Ensure extension and enum type exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Ensure table exists in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_id TEXT,
  subscription_status TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) RLS and policies (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4) Ensure categories table exists for default categories insertion
DO $$ BEGIN
  PERFORM 1 FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'categories' AND c.relkind = 'r';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'categories table is required but not found';
  END IF;
END $$;

-- 5) Create/replace trigger function with fully-qualified references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile record; ignore if already there
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default categories for the user (idempotent)
  INSERT INTO public.categories (user_id, name, color, is_system)
  VALUES
    (NEW.id, 'Groceries',   '#22c55e', TRUE),
    (NEW.id, 'Transport',   '#3b82f6', TRUE),
    (NEW.id, 'Entertainment','#a855f7', TRUE),
    (NEW.id, 'Utilities',   '#f59e0b', TRUE),
    (NEW.id, 'Healthcare',  '#ef4444', TRUE)
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN NEW;
END
$$;

-- 6) (Re)create trigger on auth.users to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7) Keep updated_at fresh on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

