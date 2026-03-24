import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore'
import { app } from './config'
import type { Scenario, Session, Team, Submission, AppUser } from '@/lib/types'

// Use memory cache to avoid IndexedDB hang on first browser connection
let _db: ReturnType<typeof getFirestore> | null = null

function db() {
  if (!app) throw new Error('Firebase not configured — add environment variables')
  if (!_db) {
    try {
      _db = initializeFirestore(app, { localCache: memoryLocalCache() })
    } catch {
      _db = getFirestore(app)
    }
  }
  return _db
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db(), 'users', uid))
  return snap.exists() ? (snap.data() as AppUser) : null
}

export async function createUser(user: AppUser): Promise<void> {
  await setDoc(doc(db(), 'users', user.uid), user)
}

export async function updateUser(uid: string, data: Partial<AppUser>): Promise<void> {
  await updateDoc(doc(db(), 'users', uid), data)
}

// ─── SCENARIOS ───────────────────────────────────────────────────────────────

export async function createScenario(scenario: Omit<Scenario, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'scenarios'), scenario)
  await updateDoc(ref, { id: ref.id })
  return ref.id
}

export async function getScenario(id: string): Promise<Scenario | null> {
  const snap = await getDoc(doc(db(), 'scenarios', id))
  return snap.exists() ? (snap.data() as Scenario) : null
}

export async function getScenariosByInstructor(instructorId: string): Promise<Scenario[]> {
  const q = query(
    collection(db(), 'scenarios'),
    where('createdBy', '==', instructorId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Scenario)
}

export async function getPublishedScenarios(subjectId?: string): Promise<Scenario[]> {
  const base = collection(db(), 'scenarios')
  const constraints = subjectId
    ? [where('subjectId', '==', subjectId), where('status', '==', 'published'), orderBy('timesUsed', 'desc'), limit(50)]
    : [where('status', '==', 'published'), orderBy('timesUsed', 'desc'), limit(50)]
  const snap = await getDocs(query(base, ...constraints))
  return snap.docs.map(d => d.data() as Scenario)
}

export async function updateScenario(id: string, data: Partial<Scenario>): Promise<void> {
  await updateDoc(doc(db(), 'scenarios', id), { ...data, updatedAt: Date.now() })
}

// ─── SESSIONS ────────────────────────────────────────────────────────────────

export async function createSession(session: Omit<Session, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'sessions'), session)
  await updateDoc(ref, { id: ref.id })
  return ref.id
}

export async function getSession(id: string): Promise<Session | null> {
  const snap = await getDoc(doc(db(), 'sessions', id))
  return snap.exists() ? (snap.data() as Session) : null
}

export async function getSessionByCode(accessCode: string): Promise<Session | null> {
  const q = query(collection(db(), 'sessions'), where('accessCode', '==', accessCode), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data() as Session
}

export async function updateSession(id: string, data: Partial<Session>): Promise<void> {
  await updateDoc(doc(db(), 'sessions', id), data)
}

export async function getActiveSessionsByInstructor(instructorId: string): Promise<Session[]> {
  const q = query(
    collection(db(), 'sessions'),
    where('instructorId', '==', instructorId),
    where('status', 'in', ['waiting', 'active', 'paused']),
    orderBy('startedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Session)
}

// ─── TEAMS ───────────────────────────────────────────────────────────────────

export async function createTeam(team: Omit<Team, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'teams'), team)
  await updateDoc(ref, { id: ref.id })
  return ref.id
}

export async function getTeamsBySession(sessionId: string): Promise<Team[]> {
  const q = query(collection(db(), 'teams'), where('sessionId', '==', sessionId))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Team)
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<void> {
  await updateDoc(doc(db(), 'teams', id), data)
}

// ─── SUBMISSIONS ─────────────────────────────────────────────────────────────

export async function createSubmission(submission: Omit<Submission, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db(), 'submissions'), submission)
  return ref.id
}

export async function getSubmissionsByTeam(sessionId: string, teamId: string): Promise<Submission[]> {
  const q = query(
    collection(db(), 'submissions'),
    where('sessionId', '==', sessionId),
    where('teamId', '==', teamId),
    orderBy('submittedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Submission)
}
