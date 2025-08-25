import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/server-supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminSupabase();

    // Identify the authenticated user via x-supabase-auth
    const token = req.headers.get('x-supabase-auth') || undefined;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRes = await supabase.auth.getUser(token);
    if (userRes.error || !userRes.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = userRes.data.user.id;

    // Delete in an order that respects FKs (transactions -> accounts -> categories/budgets -> consents -> profile)
    const queries = [
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('accounts').delete().eq('user_id', userId),
      supabase.from('budgets').delete().eq('user_id', userId),
      supabase.from('categories').delete().eq('user_id', userId),
      supabase.from('open_banking_consents').delete().eq('user_id', userId),
      supabase.from('audit_logs').delete().eq('user_id', userId),
      supabase.from('profiles').delete().eq('id', userId),
    ];

    for (const q of queries) {
      const { error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Delete auth user
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Deletion failed' }, { status: 500 });
  }
}

