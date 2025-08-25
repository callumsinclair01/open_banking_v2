import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server-auth';
import { createServerSupabase } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type, message } = body || {};
  if (!type || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const supabase = createServerSupabase(req.headers.get('x-supabase-auth') || undefined);
  const { error } = await supabase.from('feedback').insert({ user_id: user.id, type, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

