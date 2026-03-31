export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminCreateUser } from '@/lib/firebase/firestore-admin'
import type { AppUser } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const user: AppUser = await req.json()
    await adminCreateUser(user)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[users/create]', err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
