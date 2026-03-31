export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminGetSession, adminUpdateSession } from '@/lib/firebase/firestore-admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await adminGetSession(id)
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(session)
  } catch (err) {
    console.error('[sessions/get]', err)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    await adminUpdateSession(id, data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sessions/update]', err)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
