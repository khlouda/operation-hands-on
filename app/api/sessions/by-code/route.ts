export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminGetSessionByCode } from '@/lib/firebase/firestore-admin'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    const session = await adminGetSessionByCode(code.toUpperCase().trim())
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(session)
  } catch (err) {
    console.error('[sessions/by-code]', err)
    return NextResponse.json({ error: 'Failed to find session' }, { status: 500 })
  }
}
