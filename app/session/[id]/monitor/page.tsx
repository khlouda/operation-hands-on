'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSession, getScenario, updateSession } from '@/lib/firebase/firestore'
import type { Session, Scenario } from '@/lib/types'

export default function SessionMonitor() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const s = await getSession(id)
        if (!s) return
        setSession(s)
        const sc = await getScenario(s.scenarioId)
        setScenario(sc)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleStart = async () => {
    if (!session) return
    setStarting(true)
    try {
      await updateSession(id, { status: 'active', startedAt: Date.now() })
      setSession(prev => prev ? { ...prev, status: 'active', startedAt: Date.now() } : null)
    } finally {
      setStarting(false)
    }
  }

  const handleEnd = async () => {
    if (!confirm('End this session? Students will no longer be able to submit answers.')) return
    await updateSession(id, { status: 'ended', endedAt: Date.now() })
    router.push('/instructor')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !scenario) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center text-slate-400">
        Session not found.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      {/* Top bar */}
      <div className="border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white">
            Operation <span className="text-blue-400">Hands-On</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-sm text-slate-300 font-medium">{scenario.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            session.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
            session.status === 'active' ? 'bg-green-500/20 text-green-400' :
            session.status === 'paused' ? 'bg-orange-500/20 text-orange-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {session.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-xs text-slate-500">Code:</span>
            <span className="font-mono font-bold text-white tracking-widest text-sm">{session.accessCode}</span>
          </div>
          <button
            onClick={() => router.push('/instructor')}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Session controls */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* Control panel */}
          <div className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-5">Session Controls</h2>

            {session.status === 'waiting' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-sm text-yellow-300 font-medium mb-1">Session is waiting</p>
                  <p className="text-xs text-slate-400">
                    Share the access code <span className="font-mono font-bold text-white">{session.accessCode}</span> with your students.
                    When everyone is in the lobby, start the session.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleStart}
                    disabled={starting}
                    className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
                  >
                    {starting ? 'Starting…' : '▶ Start Session'}
                  </button>
                  <button
                    onClick={() => router.push(`/session/${id}/lobby`)}
                    className="px-4 py-3 text-sm text-slate-400 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    View Lobby
                  </button>
                </div>
              </div>
            )}

            {session.status === 'active' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <p className="text-sm text-green-300 font-medium mb-1">Session is live</p>
                  <p className="text-xs text-slate-400">
                    Students are working on the scenario. Monitor their progress below.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => { await updateSession(id, { status: 'paused' }); setSession(p => p ? {...p, status: 'paused'} : null) }}
                    className="px-5 py-2.5 text-sm font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors"
                  >
                    ⏸ Pause
                  </button>
                  <button
                    onClick={handleEnd}
                    className="px-5 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    ⏹ End Session
                  </button>
                </div>
              </div>
            )}

            {session.status === 'paused' && (
              <div className="flex gap-3">
                <button
                  onClick={async () => { await updateSession(id, { status: 'active' }); setSession(p => p ? {...p, status: 'active'} : null) }}
                  className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                >
                  ▶ Resume
                </button>
                <button onClick={handleEnd} className="px-5 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
                  ⏹ End Session
                </button>
              </div>
            )}
          </div>

          {/* Scenario summary */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Scenario</h2>
            <p className="text-sm font-semibold text-white mb-3">{scenario.title}</p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Difficulty</span>
                <span className="text-white capitalize">{scenario.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasks</span>
                <span className="text-white">{scenario.tasks?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Limit</span>
                <span className="text-white">{session.timeLimit} min</span>
              </div>
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="text-white capitalize">{session.mode}</span>
              </div>
              <div className="flex justify-between">
                <span>Inject Events</span>
                <span className="text-white">{scenario.injectEvents?.length ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Teams (empty state — will populate as teams join) */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Teams</h2>
            <span className="text-xs text-slate-500">0 teams joined</span>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl mb-3">👥</div>
            <p className="text-sm text-slate-400 mb-1">No teams have joined yet</p>
            <p className="text-xs text-slate-600">
              Students join by entering code <span className="font-mono font-bold text-slate-400">{session.accessCode}</span> on their dashboard
            </p>
          </div>
        </div>

        {/* Task list */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white">Tasks</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {scenario.tasks?.map((task, i) => (
              <div key={task.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.hints?.length ?? 0} hints · {task.type}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-yellow-400">{task.points} pts</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
