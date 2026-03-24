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
import { createUser, getUser } from './firestore'
import type { AppUser, UserRole, SubjectSlug } from '@/lib/types'

function auth() {
  if (!app) throw new Error('Firebase not configured')
  return getAuth(app)
}

// Set a simple cookie so Next.js middleware can check auth state
function setAuthCookie(token: string) {
  document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}
function clearAuthCookie() {
  document.cookie = 'auth-token=; path=/; max-age=0'
}

export async function register({
  email,
  password,
  displayName,
  role,
  avatarColor,
  subjectInterests,
}: {
  email: string
  password: string
  displayName: string
  role: UserRole
  avatarColor: string
  subjectInterests: SubjectSlug[]
}): Promise<AppUser> {
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

  await createUser(user)
  const token = await credential.user.getIdToken()
  setAuthCookie(token)
  return user
}

export async function login(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth(), email, password)
  const token = await credential.user.getIdToken()
  setAuthCookie(token)
  return credential.user
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
