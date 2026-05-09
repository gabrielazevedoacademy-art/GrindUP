import { NextResponse } from 'next/server'
import { verifyAdmin } from '../_auth'
import { createAdminSupabase } from '@/lib/supabase-admin'

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plans: data })
}
