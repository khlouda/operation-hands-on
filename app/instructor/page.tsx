'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { SUBJECTS } from '@/constants/subjects'
import type { Session, Scenario } from '@/lib/types'

export default function InstructorDashboard() {
  const { appUser } = useAuth()
  const router = useRouter()
  const firstName = appUser?.displayName?.split(' ')[0] ?? 'Instructor'

  const [sessions, setSessions] = useState<Session[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingScenarios, setLoadingScenarios] = useState(true)
  const [studentCount, setStudentCount] = useState<number | null>(null)

  useEffect(() => {
    if (!appUser?.uid) return
    const uid = appUser.uid

    fetch(`/api/sessions/by-instructor?instructorId=${uid}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Session[]) => {
        setSessions(data)
        // Fetch unique student count for all sessions
        if (data.length > 0) {
          fetch('/api/sessions/students-count', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionIds: data.map(s => s.id) }),
          })
            .then(r => r.ok ? r.json() : { count: 0 })
            .then(({ count }) => setStudentCount(count))
            .catch(() => setStudentCount(0))
        } else {
          setStudentCount(0)
        }
      })
      .catch(() => { setSessions([]); setStudentCount(0) })
      .finally(() => setLoadingSessions(false))

    fetch(`/api/scenarios/by-instructor?instructorId=${uid}`)
      .then(r => r.ok ? r.json() : [])
      .then(setScenarios)
      .catch(() => setScenarios([]))
      .finally(() => setLoadingScenarios(false))
  }, [appUser?.uid])

  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'waiting')

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {firstName}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Create AI-generated scenarios and launch live competitive sessions for your students.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Scenarios Created', value: loadingScenarios ? '…' : String(scenarios.length), icon: '📋', sub: scenarios.length === 0 ? 'Get started below' : `${scenarios.length} scenario${scenarios.length !== 1 ? 's' : ''}` },
          { label: 'Sessions Launched', value: loadingSessions ? '…' : String(sessions.length), icon: '🚀', sub: sessions.length === 0 ? 'No sessions yet' : `${activeSessions.length} active` },
          { label: 'Students Trained', value: studentCount === null ? '…' : String(studentCount), icon: '🎓', sub: studentCount === null ? 'Loading…' : studentCount === 0 ? 'No submissions yet' : `unique student${studentCount !== 1 ? 's' : ''} across all sessions` },
          { label: 'Active Sessions', value: loadingSessions ? '…' : String(activeSessions.length), icon: '📡', sub: activeSessions.length === 0 ? 'None running' : `${activeSessions.length} live right now` },
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

      {/* Create CTA */}
      <Link
        href="/instructor/create"
        className="flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all group"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          ✨
        </div>
        <div>
          <p className="text-lg font-semibold text-white">Create New Scenario</p>
          <p className="text-blue-100 text-sm mt-0.5">
            Pick a subject → answer 5 questions → AI builds a complete immersive exercise in 30 seconds
          </p>
        </div>
        <div className="ml-auto text-white/60 group-hover:translate-x-1 transition-transform text-xl flex-shrink-0">
          →
        </div>
      </Link>

      {/* Scenario Library + Sessions side by side */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Scenario Library */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white">Scenario Library</h2>
            <Link href="/instructor/create" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              + Create
            </Link>
          </div>
          {loadingScenarios ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl mb-3">📋</div>
              <p className="text-sm font-medium text-slate-300 mb-1">No scenarios yet</p>
              <p className="text-xs text-slate-500 max-w-xs">Your AI-generated scenarios will appear here.</p>
              <Link href="/instructor/create" className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors">
                Create First Scenario
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {scenarios.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{s.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{s.difficulty} · {s.tasks?.length ?? 0} tasks</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {s.status ?? 'draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white">Recent Sessions</h2>
            <span className="text-xs text-slate-600">Live & completed</span>
          </div>
          {loadingSessions ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl mb-3">🚀</div>
              <p className="text-sm font-medium text-slate-300 mb-1">No sessions launched</p>
              <p className="text-xs text-slate-500 max-w-xs">Once you create a scenario and launch a session, it will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/session/${s.id}/monitor`)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-slate-700 px-2 py-0.5 rounded">
                        {s.accessCode}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        s.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                        s.status === 'paused' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{s.mode} · {s.timeLimit}min</p>
                  </div>
                  <span className="text-slate-600 text-xs">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Subjects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-slate-500">
            Browse by Subject
          </h2>
          <span className="text-xs text-slate-600">Click any subject to start creating</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map(subject => (
            <Link
              key={subject.id}
              href={`/instructor/create?subject=${subject.slug}`}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-500 hover:bg-slate-800 transition-all group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: subject.color + '20', border: `1px solid ${subject.color}40` }}
              >
                {subject.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">
                  {subject.name}
                </p>
                <p className="text-xs text-slate-500">{subject.topics.length} topics</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
