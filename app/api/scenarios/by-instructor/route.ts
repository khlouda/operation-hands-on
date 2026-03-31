export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminGetScenariosByInstructor } from '@/lib/firebase/firestore-admin'

export async function GET(req: NextRequest) {
  const instructorId = req.nextUrl.searchParams.get('instructorId')
  if (!instructorId) return NextResponse.json({ error: 'Missing instructorId' }, { status: 400 })
  try {
    const scenarios = await adminGetScenariosByInstructor(instructorId)
    return NextResponse.json(scenarios)
  } catch (err) {
    console.error('[scenarios/by-instructor]', err)
    return NextResponse.json({ error: 'Failed to get scenarios' }, { status: 500 })
  }
}
