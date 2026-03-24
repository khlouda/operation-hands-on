'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthChange, getAppUser } from '@/lib/firebase/auth'
import type { AppUser } from '@/lib/types'

interface AuthContextValue {
  firebaseUser: User | null
  appUser: AppUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async user => {
      setFirebaseUser(user)
      if (user) {
        const profile = await getAppUser(user.uid)
        setAppUser(profile)
      } else {
        setAppUser(null)
      }
      setLoading(false)
    })
    return unsub
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
