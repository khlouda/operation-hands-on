import { adminDb } from './admin'
import type { Scenario, Session, AppUser } from '@/lib/types'

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function adminCreateUser(user: AppUser): Promise<void> {
  await adminDb().collection('users').doc(user.uid).set(user)
}

export async function adminGetUser(uid: string): Promise<AppUser | null> {
  const snap = await adminDb().collection('users').doc(uid).get()
  return snap.exists ? (snap.data() as AppUser) : null
}

// ─── SCENARIOS ────────────────────────────────────────────────────────────────

export async function adminCreateScenario(scenario: Omit<Scenario, 'id'>): Promise<string> {
  const ref = await adminDb().collection('scenarios').add(scenario)
  await ref.update({ id: ref.id })
  return ref.id
}

export async function adminGetScenario(id: string): Promise<Scenario | null> {
  const snap = await adminDb().collection('scenarios').doc(id).get()
  return snap.exists ? (snap.data() as Scenario) : null
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

export async function adminCreateSession(session: Omit<Session, 'id'>): Promise<string> {
  const ref = await adminDb().collection('sessions').add(session)
  await ref.update({ id: ref.id })
  return ref.id
}

export async function adminGetSession(id: string): Promise<Session | null> {
  const snap = await adminDb().collection('sessions').doc(id).get()
  return snap.exists ? (snap.data() as Session) : null
}

export async function adminGetSessionByCode(accessCode: string): Promise<Session | null> {
  const snap = await adminDb().collection('sessions').where('accessCode', '==', accessCode).limit(1).get()
  if (snap.empty) return null
  return snap.docs[0].data() as Session
}

export async function adminUpdateSession(id: string, data: Partial<Session>): Promise<void> {
  await adminDb().collection('sessions').doc(id).update(data)
}

export async function adminCreateSubmission(submission: object): Promise<void> {
  await adminDb().collection('submissions').add(submission)
}

export async function adminGetSubmissionsByUser(userId: string): Promise<import('@/lib/types').Submission[]> {
  const snap = await adminDb()
    .collection('submissions')
    .where('userId', '==', userId)
    .orderBy('submittedAt', 'desc')
    .limit(200)
    .get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as import('@/lib/types').Submission))
}

export async function adminGetUniqueStudentCountForSessions(sessionIds: string[]): Promise<number> {
  if (sessionIds.length === 0) return 0
  // Firestore 'in' supports up to 30 values; chunk if needed
  const chunks: string[][] = []
  for (let i = 0; i < sessionIds.length; i += 30) chunks.push(sessionIds.slice(i, i + 30))
  const userIds = new Set<string>()
  for (const chunk of chunks) {
    const snap = await adminDb().collection('submissions').where('sessionId', 'in', chunk).get()
    snap.docs.forEach(d => { const uid = d.data().userId; if (uid) userIds.add(uid) })
  }
  return userIds.size
}

export async function adminGetSessionsByInstructor(instructorId: string): Promise<Session[]> {
  const snap = await adminDb()
    .collection('sessions')
    .where('instructorId', '==', instructorId)
    .orderBy('__name__', 'desc')
    .limit(20)
    .get()
  return snap.docs.map(d => d.data() as Session)
}

export async function adminGetScenariosByInstructor(instructorId: string): Promise<Scenario[]> {
  const snap = await adminDb()
    .collection('scenarios')
    .where('createdBy', '==', instructorId)
    .orderBy('__name__', 'desc')
    .limit(20)
    .get()
  return snap.docs.map(d => d.data() as Scenario)
}
