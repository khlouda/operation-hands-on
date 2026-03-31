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
