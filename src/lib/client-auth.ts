import { supabase } from '@/lib/supabase';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { 'x-supabase-auth': token } : {};
}

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
  const headers = await getAuthHeaders();
  const merged: RequestInit = {
    ...init,
    headers: { ...(init?.headers as any), ...headers },
  };
  return fetch(input, merged);
}

