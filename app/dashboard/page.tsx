'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { logout } from '@/lib/firebase/auth'
import { getSessionByCode } from '@/lib/firebase/firestore'
import { SUBJECTS } from '@/constants/subjects'

export default function StudentDashboard() {
  const { appUser, loading } = useAuth()
  const router = useRouter()

  // If not loading and still no user, send to login
  if (!loading && !appUser) {
    router.push('/login')
    return null
  }
  const [accessCode, setAccessCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    setJoining(true)

    try {
      const session = await getSessionByCode(accessCode.toUpperCase().trim())
      if (!session) {
        setJoinError('Session not found. Check your access code.')
        return
      }
      if (session.status === 'ended') {
        setJoinError('This session has already ended.')
        return
      }
      router.push(`/session/${session.id}/lobby`)
    } catch {
      setJoinError('Something went wrong. Try again.')
    } finally {
      setJoining(false)
    }
  }

  if (!appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 h-14 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-sm font-bold text-white">
          Operation <span className="text-blue-400">Hands-On</span>
        </span>
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: appUser.avatarColor }}
          >
            {appUser.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-slate-300">{appUser.displayName}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {appUser.displayName.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">Ready for your next challenge?</p>
        </div>

        {/* Join session — the main action */}
        <div className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/30 mb-10">
          <h2 className="text-lg font-semibold text-white mb-1">Join a Session</h2>
          <p className="text-slate-400 text-sm mb-5">
            Enter the 6-character access code your instructor gave you
          </p>
          <form onSubmit={handleJoinSession} className="flex gap-3">
            <input
              type="text"
              required
              maxLength={6}
              value={accessCode}
              onChange={e => setAccessCode(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono tracking-widest uppercase transition-colors"
              placeholder="ABC123"
            />
            <button
              type="submit"
              disabled={joining || accessCode.length < 6}
              className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {joining ? 'Joining…' : 'Join →'}
            </button>
          </form>
          {joinError && (
            <p className="text-red-400 text-sm mt-3">{joinError}</p>
          )}
        </div>

        {/* Subject interests */}
        {appUser.subjectInterests.length > 0 && (
          <div>
            <h2 className="text-xs font-medium tracking-wider uppercase text-slate-500 mb-4">
              Your Subjects
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUBJECTS
                .filter(s => appUser.subjectInterests.includes(s.slug))
                .map(subject => (
                  <div
                    key={subject.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <span className="text-2xl">{subject.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{subject.name}</p>
                      <p className="text-xs text-slate-500">{subject.topics.length} topics</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {appUser.subjectInterests.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-sm">No active sessions yet.</p>
            <p className="text-sm">Enter an access code above to join one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
