'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { getSession, getScenario } from '@/lib/firebase/firestore'
import type { Session, Scenario } from '@/lib/types'

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: 'text-green-400 bg-green-500/10',
  intermediate: 'text-yellow-400 bg-yellow-500/10',
  advanced: 'text-orange-400 bg-orange-500/10',
  expert: 'text-red-400 bg-red-500/10',
}

export default function LobbyPage() {
  const { id } = useParams<{ id: string }>()
  const { appUser } = useAuth()
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const s = await getSession(id)
        if (!s) { router.push('/dashboard'); return }
        setSession(s)
        if (s.scenarioId) {
          const sc = await getScenario(s.scenarioId)
          setScenario(sc)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !scenario) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center text-slate-400">
        Session not found.
      </div>
    )
  }

  const isInstructor = appUser?.role === 'instructor'

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 h-14 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="text-sm font-bold text-white tracking-tight">
          Operation <span className="text-blue-400">Hands-On</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Access Code:</span>
          <span className="font-mono text-sm font-bold text-white tracking-widest bg-slate-800 px-3 py-1 rounded-lg">
            {session.accessCode}
          </span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* Status badge */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-medium text-yellow-400">
                {session.status === 'waiting' ? 'Waiting for instructor to start' : 'Session in progress'}
              </span>
            </div>
          </div>

          {/* Scenario card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden mb-6">
            <div className="px-6 pt-6 pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_COLOR[scenario.difficulty]}`}>
                  {scenario.difficulty}
                </span>
                <span className="text-xs text-slate-500">{scenario.estimatedTime} min</span>
                <span className="text-xs text-slate-500 capitalize">{session.mode}</span>
              </div>
              <h1 className="text-2xl font-bold text-white">{scenario.title}</h1>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider text-xs">Mission Briefing</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                {scenario.briefing ?? scenario.story?.slice(0, 300) + '…'}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 border-t border-slate-700/50">
              {[
                { label: 'Tasks', value: scenario.tasks?.length ?? 0 },
                { label: 'Time Limit', value: `${session.timeLimit}m` },
                { label: 'Mode', value: session.mode },
              ].map(stat => (
                <div key={stat.label} className="px-6 py-4 text-center">
                  <p className="text-lg font-bold text-white capitalize">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {isInstructor ? (
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/session/${id}/monitor`)}
                className="flex-1 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors"
              >
                Open Monitor & Start Session →
              </button>
            </div>
          ) : (
            <div className="text-center">
              {!ready ? (
                <button
                  onClick={() => setReady(true)}
                  className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors text-lg"
                >
                  I&apos;m Ready ✓
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <span className="text-xl">✓</span>
                    <span className="font-semibold">You&apos;re ready!</span>
                  </div>
                  <p className="text-sm text-slate-500">Waiting for instructor to start the session…</p>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
