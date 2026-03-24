export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/firebase/firestore'
import type { AppUser } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const user: AppUser = await req.json()
    await createUser(user)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[users/create]', err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
