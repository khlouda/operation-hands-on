export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminCreateSession } from '@/lib/firebase/firestore-admin'
import type { SessionSettings } from '@/lib/types'

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(req: NextRequest) {
  try {
    const { scenarioId, instructorId, mode, timeLimit, teamSize } = await req.json()

    if (!scenarioId || !instructorId) {
      return NextResponse.json({ error: 'Missing scenarioId or instructorId' }, { status: 400 })
    }

    const settings: SessionSettings = {
      showLeaderboard: true,
      allowHints: true,
      hintPenalty: 25,
      wrongAnswerPenalty: 10,
      firstBloodBonus: 50,
      timeBonus: true,
    }

    const accessCode = generateAccessCode()

    const sessionId = await adminCreateSession({
      scenarioId,
      instructorId,
      mode: mode ?? 'competitive',
      status: 'waiting',
      timeLimit: timeLimit ?? 60,
      teamIds: [],
      settings,
      accessCode,
    })

    return NextResponse.json({ sessionId, accessCode })
  } catch (err) {
    console.error('[sessions/create]', err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
