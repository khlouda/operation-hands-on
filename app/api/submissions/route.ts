export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminCreateSubmission } from '@/lib/firebase/firestore-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await adminCreateSubmission(body)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[submissions/create]', err)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }
}
