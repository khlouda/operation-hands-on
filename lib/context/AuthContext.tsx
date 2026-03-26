'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import type { AppUser } from '@/lib/types'

interface AuthContextValue {
  firebaseUser: User | null
  appUser: AppUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  loading: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let unsub: (() => void) | undefined

    import('@/lib/firebase/auth').then(({ onAuthChange, getAppUser }) => {
      unsub = onAuthChange(async user => {
        setFirebaseUser(user)

        if (user) {
          try {
            // Try Firestore profile, but fall back to basic Firebase Auth data
            const profile = await Promise.race([
              getAppUser(user.uid),
              new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
            ])

            if (profile) {
              setAppUser(profile)
            } else {
              // Firestore slow/unavailable — build minimal profile from Auth + localStorage
              const storedRole = (typeof window !== 'undefined' && localStorage.getItem('userRole')) as import('@/lib/types').UserRole | null
              setAppUser({
                uid: user.uid,
                email: user.email ?? '',
                displayName: user.displayName ?? 'User',
                role: storedRole ?? 'student',
                avatarColor: '#3b82f6',
                university: 'ECPI University',
                subjectInterests: [],
                createdAt: Date.now(),
              })
            }
          } catch {
            setAppUser(null)
          }
        } else {
          setAppUser(null)
        }

        setLoading(false)
      })
    }).catch(() => setLoading(false))

    return () => unsub?.()
  }, [])

  return (
    <AuthContext.Provider value={{ firebaseUser, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
