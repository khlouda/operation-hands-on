'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { logout } from '@/lib/firebase/auth'
import { SUBJECTS } from '@/constants/subjects'

interface StudentStats {
  sessionsCompleted: number
  bestScore: number | null
  totalCorrect: number
}

export default function StudentDashboard() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const [accessCode, setAccessCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [stats, setStats] = useState<StudentStats | null>(null)

  useEffect(() => {
    if (!loading && !appUser) router.push('/login')
    if (appUser?.role === 'instructor') router.push('/instructor')
  }, [appUser, loading, router])

  useEffect(() => {
    if (!appUser?.uid) return
    fetch(`/api/submissions?userId=${appUser.uid}`)
      .then(r => r.ok ? r.json() : [])
      .then((submissions: { sessionId: string; isCorrect: boolean; pointsAwarded: number }[]) => {
        const correct = submissions.filter(s => s.isCorrect)
        // Group by session to find completed sessions (at least 1 correct) and best score
        const scoreBySession: Record<string, number> = {}
        for (const s of correct) {
          scoreBySession[s.sessionId] = (scoreBySession[s.sessionId] ?? 0) + s.pointsAwarded
        }
        const sessionScores = Object.values(scoreBySession)
        setStats({
          sessionsCompleted: sessionScores.length,
          bestScore: sessionScores.length > 0 ? Math.max(...sessionScores) : null,
          totalCorrect: correct.length,
        })
      })
      .catch(() => {})
  }, [appUser?.uid])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    setJoining(true)
    try {
      const res = await fetch(`/api/sessions/by-code?code=${encodeURIComponent(accessCode.toUpperCase().trim())}`)
      if (!res.ok) { setJoinError('Session not found. Check your access code.'); return }
      const session = await res.json()
      if (session.status === 'ended') { setJoinError('This session has already ended.'); return }
      router.push(`/session/${session.id}/lobby`)
    } catch {
      setJoinError('Something went wrong. Try again.')
    } finally {
      setJoining(false)
    }
  }

  if (loading || !appUser) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  const mySubjects = SUBJECTS.filter(s => appUser.subjectInterests.includes(s.slug))
  const firstName = appUser.displayName.split(' ')[0]

  return (
    <div className="min-h-screen bg-[#0f1117]">

      {/* Nav */}
      <nav className="border-b border-slate-800 sticky top-0 z-50 bg-[#0f1117]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-bold text-white tracking-tight">
            Operation <span className="text-blue-400">Hands-On</span>
          </span>
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: appUser.avatarColor }}
            >
              {appUser.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block">{appUser.displayName}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}</h1>
          <p className="text-slate-400 mt-1 text-sm">Ready for your next challenge?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Sessions Completed',
              value: stats === null ? '…' : String(stats.sessionsCompleted),
              icon: '🎯',
              sub: stats === null ? 'Loading…' : stats.sessionsCompleted === 0 ? 'Join one below' : `${stats.sessionsCompleted} session${stats.sessionsCompleted !== 1 ? 's' : ''}`,
            },
            {
              label: 'Best Score',
              value: stats === null ? '…' : stats.bestScore !== null ? String(stats.bestScore) : '—',
              icon: '🏆',
              sub: stats === null ? 'Loading…' : stats.bestScore !== null ? 'pts in a single session' : 'No sessions yet',
            },
            {
              label: 'Tasks Solved',
              value: stats === null ? '…' : String(stats.totalCorrect),
              icon: '✅',
              sub: stats === null ? 'Loading…' : stats.totalCorrect === 0 ? 'Complete your first task' : `correct answer${stats.totalCorrect !== 1 ? 's' : ''} submitted`,
            },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                <span className="text-lg">{stat.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Join Session */}
        <div className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/30">
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
          {joinError && <p className="text-red-400 text-sm mt-3">{joinError}</p>}
        </div>

        {/* Active sessions placeholder */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white">Active Sessions</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-xl mb-3">🔒</div>
            <p className="text-sm text-slate-400">No active sessions assigned to you</p>
            <p className="text-xs text-slate-600 mt-1">Your instructor will give you an access code when a session is ready</p>
          </div>
        </div>

        {/* Subjects */}
        {mySubjects.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">Your Subjects</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mySubjects.map(subject => (
                <div
                  key={subject.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: subject.color + '20', border: `1px solid ${subject.color}40` }}
                  >
                    {subject.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{subject.name}</p>
                    <p className="text-xs text-slate-500">{subject.topics.length} topics</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mySubjects.length === 0 && (
          <div className="text-center py-10 text-slate-600">
            <div className="text-3xl mb-3">🎯</div>
            <p className="text-sm">Enter an access code above to join a session.</p>
          </div>
        )}

      </div>
    </div>
  )
}
