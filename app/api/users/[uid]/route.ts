export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminGetUser } from '@/lib/firebase/firestore-admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params
    const user = await adminGetUser(uid)
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    console.error('[users/get]', err)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}
