export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminGetUniqueStudentCountForSessions } from '@/lib/firebase/firestore-admin'

export async function POST(req: NextRequest) {
  try {
    const { sessionIds } = await req.json()
    if (!Array.isArray(sessionIds)) return NextResponse.json({ error: 'sessionIds must be an array' }, { status: 400 })
    const count = await adminGetUniqueStudentCountForSessions(sessionIds)
    return NextResponse.json({ count })
  } catch (err) {
    console.error('[students-count]', err)
    return NextResponse.json({ error: 'Failed to count students' }, { status: 500 })
  }
}
