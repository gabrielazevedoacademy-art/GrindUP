import { NextResponse } from 'next/server'
import { verifyAdmin } from '../../_auth'
import { createAdminSupabase } from '@/lib/supabase-admin'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = createAdminSupabase()

  const updates: Record<string, unknown> = {}
  if (body.plan      !== undefined) updates.plan      = body.plan
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
