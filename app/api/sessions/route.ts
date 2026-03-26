export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/firebase/firestore'
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

    const tempSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    createSession({
      scenarioId,
      instructorId,
      mode: mode ?? 'competitive',
      status: 'waiting',
      timeLimit: timeLimit ?? 60,
      teamIds: [],
      settings,
      accessCode,
    }).then(id => {
      console.log('[sessions/create] Firestore saved, id:', id)
    }).catch(err => {
      console.error('[sessions/create] Firestore save failed (non-fatal):', err)
    })

    return NextResponse.json({ sessionId: tempSessionId, accessCode })
  } catch (err) {
    console.error('[sessions/create]', err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
