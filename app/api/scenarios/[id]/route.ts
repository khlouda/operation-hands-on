export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminGetScenario } from '@/lib/firebase/firestore-admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const scenario = await adminGetScenario(id)
    if (!scenario) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(scenario)
  } catch (err) {
    console.error('[scenarios/get]', err)
    return NextResponse.json({ error: 'Failed to get scenario' }, { status: 500 })
  }
}
