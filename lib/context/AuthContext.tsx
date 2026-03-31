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

    import('@/lib/firebase/auth').then(({ onAuthChange }) => {
      unsub = onAuthChange(async user => {
        setFirebaseUser(user)

        if (user) {
          try {
            const res = await fetch(`/api/users/${user.uid}`)
            if (res.ok) {
              const profile = await res.json()
              setAppUser(profile)
              localStorage.setItem('userRole', profile.role)
            } else {
              setAppUser(null)
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
