import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getAuth } from 'firebase/auth'
import { app } from './config'
import { getUser } from './firestore'
import type { AppUser, UserRole, SubjectSlug } from '@/lib/types'

function auth() {
  if (!app) throw new Error('Firebase not configured')
  return getAuth(app)
}

function setAuthCookie(token: string) {
  document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function clearAuthCookie() {
  document.cookie = 'auth-token=; path=/; max-age=0'
}

export async function register(
  { email, password, displayName, role, avatarColor, subjectInterests }: {
    email: string
    password: string
    displayName: string
    role: UserRole
    avatarColor: string
    subjectInterests: SubjectSlug[]
  },
  onProgress?: (msg: string) => void
): Promise<AppUser> {
  onProgress?.('Creating account…')
  const credential = await createUserWithEmailAndPassword(auth(), email, password)
  await updateProfile(credential.user, { displayName })

  const user: AppUser = {
    uid: credential.user.uid,
    email,
    displayName,
    role,
    avatarColor,
    university: 'ECPI University',
    subjectInterests,
    createdAt: Date.now(),
  }

  // Save profile — await so it's definitely in Firestore before redirect
  onProgress?.('Finishing up…')
  await fetch('/api/users/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).catch(err => console.warn('Profile save failed:', err))

  // Store role in localStorage so we can redirect correctly without Firestore
  localStorage.setItem('userRole', role)
  localStorage.setItem('displayName', displayName)
  const token = await credential.user.getIdToken()
  setAuthCookie(token)
  return user
}

export async function login(email: string, password: string): Promise<{ user: User; role: import('@/lib/types').UserRole }> {
  const credential = await signInWithEmailAndPassword(auth(), email, password)
  const token = await credential.user.getIdToken()
  setAuthCookie(token)

  // Fetch Firestore profile to get the correct role
  let role: import('@/lib/types').UserRole = (localStorage.getItem('userRole') as import('@/lib/types').UserRole) ?? 'student'
  try {
    const profile = await Promise.race([
      getUser(credential.user.uid),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 4000)),
    ])
    if (profile?.role) {
      role = profile.role
      localStorage.setItem('userRole', role)
    }
  } catch { /* keep localStorage fallback */ }

  return { user: credential.user, role }
}

export async function logout(): Promise<void> {
  await signOut(auth())
  clearAuthCookie()
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth(), callback)
}

export async function getAppUser(uid: string): Promise<AppUser | null> {
  return getUser(uid)
}
