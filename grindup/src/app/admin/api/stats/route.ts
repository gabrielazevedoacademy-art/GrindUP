import { NextResponse } from 'next/server'
import { verifyAdmin } from '../_auth'
import { createAdminSupabase } from '@/lib/supabase-admin'

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminSupabase()
  const today = new Date().toISOString().slice(0, 10)

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('plan, is_active, last_activity_date, created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = profiles ?? []
  const total       = all.length
  const freeCount   = all.filter(p => p.plan === 'free').length
  const paidCount   = all.filter(p => ['pro', 'elite'].includes(p.plan)).length
  const activeToday = all.filter(p => p.last_activity_date === today).length

  // Recent 10 users (need email from auth)
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const { data: recentProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, plan, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const recent = (recentProfiles ?? []).map(p => ({
    ...p,
    email: authUsers.find(u => u.id === p.id)?.email ?? '',
  }))

  return NextResponse.json({ total, freeCount, paidCount, activeToday, recent })
}
