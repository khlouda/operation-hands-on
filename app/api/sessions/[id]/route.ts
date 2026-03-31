export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminGetSession } from '@/lib/firebase/firestore-admin'

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
