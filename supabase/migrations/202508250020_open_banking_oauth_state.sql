-- Store OAuth state mapping for Open Banking connect flows
CREATE TABLE IF NOT EXISTS public.open_banking_oauth_state (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_id bank_provider NOT NULL,
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.open_banking_oauth_state ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write
DROP POLICY IF EXISTS "service can manage oauth state" ON public.open_banking_oauth_state;
CREATE POLICY "service can manage oauth state" ON public.open_banking_oauth_state
  FOR ALL TO service_role USING (true) WITH CHECK (true);

