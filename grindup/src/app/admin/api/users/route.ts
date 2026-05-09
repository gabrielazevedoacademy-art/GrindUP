import { NextResponse } from 'next/server'
import { verifyAdmin } from '../_auth'
import { createAdminSupabase } from '@/lib/supabase-admin'

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminSupabase()

  const [authRes, profilesRes] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
  ])

  const authUsers = authRes.data?.users ?? []
  const profiles  = profilesRes.data ?? []

  const users = profiles.map(p => ({
    ...p,
    email:      authUsers.find(u => u.id === p.id)?.email ?? '',
    auth_created_at: authUsers.find(u => u.id === p.id)?.created_at ?? p.created_at,
  }))

  return NextResponse.json({ users })
}
