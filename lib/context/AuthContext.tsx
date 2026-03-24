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
    // Lazy import so Firebase never blocks the initial page render
    let unsub: (() => void) | undefined

    import('@/lib/firebase/auth').then(({ onAuthChange, getAppUser }) => {
      unsub = onAuthChange(async user => {
        setFirebaseUser(user)
        if (user) {
          try {
            const profile = await getAppUser(user.uid)
            setAppUser(profile)
          } catch {
            // Profile fetch failed — still let the user through
          }
        } else {
          setAppUser(null)
        }
        setLoading(false)
      })
    }).catch(() => {
      // Firebase failed to load entirely — don't block the app
      setLoading(false)
    })

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
