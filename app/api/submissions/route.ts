export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminCreateSubmission, adminGetSubmissionsByUser } from '@/lib/firebase/firestore-admin'

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

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  try {
    const submissions = await adminGetSubmissionsByUser(userId)
    return NextResponse.json(submissions)
  } catch (err) {
    console.error('[submissions/by-user]', err)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}
