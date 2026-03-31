export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminGetSessionsByInstructor } from '@/lib/firebase/firestore-admin'

export async function GET(req: NextRequest) {
  const instructorId = req.nextUrl.searchParams.get('instructorId')
  if (!instructorId) return NextResponse.json({ error: 'Missing instructorId' }, { status: 400 })
  try {
    const sessions = await adminGetSessionsByInstructor(instructorId)
    return NextResponse.json(sessions)
  } catch (err) {
    console.error('[sessions/by-instructor]', err)
    return NextResponse.json({ error: 'Failed to get sessions' }, { status: 500 })
  }
}
