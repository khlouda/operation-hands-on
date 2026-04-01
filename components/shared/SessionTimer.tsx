'use client'

import { useEffect, useState, useRef } from 'react'
import { ref, onValue, off, set, getDatabase } from 'firebase/database'
import { app } from '@/lib/firebase/config'

interface Props {
  sessionId: string
  initialSeconds: number   // timeLimit * 60
  isInstructor?: boolean   // instructor drives the countdown and syncs it
  onExpire?: () => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function SessionTimer({ sessionId, initialSeconds, isInstructor, onExpire }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const localRef = useRef(initialSeconds)

  function db() {
    try { return app ? getDatabase(app) : null } catch { return null }
  }

  // Students: subscribe to RTDB timer
  useEffect(() => {
    if (isInstructor) return
    const database = db()
    if (!database) return
    const r = ref(database, `sessions/${sessionId}/timeRemaining`)
    onValue(r, snap => {
      if (typeof snap.val() === 'number') {
        setSeconds(snap.val())
        localRef.current = snap.val()
      }
    })
    const statusRef = ref(database, `sessions/${sessionId}/timerPaused`)
    onValue(statusRef, snap => setPaused(!!snap.val()))
    return () => { off(r); off(statusRef) }
  }, [sessionId, isInstructor])

  // Instructor: run the countdown and sync every 10s
  useEffect(() => {
    if (!isInstructor) return
    const database = db()

    intervalRef.current = setInterval(() => {
      if (paused) return
      localRef.current = Math.max(0, localRef.current - 1)
      setSeconds(localRef.current)

      // Sync to RTDB every 10 seconds or when at 0
      if (localRef.current % 10 === 0 || localRef.current === 0) {
        if (database) set(ref(database, `sessions/${sessionId}/timeRemaining`), localRef.current).catch(() => {})
      }

      if (localRef.current === 0) {
        clearInterval(intervalRef.current!)
        onExpire?.()
      }
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [sessionId, isInstructor, paused, onExpire])

  const pct = seconds / initialSeconds
  const urgent = pct <= 0.1
  const warning = pct <= 0.25

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
      urgent ? 'bg-red-500/10 border-red-500/30' :
      warning ? 'bg-orange-500/10 border-orange-500/30' :
      'bg-slate-800 border-slate-700'
    }`}>
      <span className={`text-xs ${urgent ? 'animate-pulse' : ''}`}>
        {urgent ? '🚨' : warning ? '⚠️' : '⏱'}
      </span>
      <span className={`font-mono font-bold text-sm tabular-nums ${
        urgent ? 'text-red-400' : warning ? 'text-orange-400' : 'text-white'
      }`}>
        {fmt(seconds)}
      </span>
    </div>
  )
}
