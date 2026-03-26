'use client'

import { useEffect, useState, useRef } from 'react'
import { ref, onValue, off, getDatabase } from 'firebase/database'
import { app } from '@/lib/firebase/config'

interface FiredInject {
  id: string
  title: string
  content: string
  scoreImpact: number
  firedAt: number
}

interface Props {
  sessionId: string
}

export default function InjectEventCard({ sessionId }: Props) {
  const [queue, setQueue] = useState<FiredInject[]>([])
  const [current, setCurrent] = useState<FiredInject | null>(null)
  const seenRef = useRef<Set<string>>(new Set())

  function db() { return app ? getDatabase(app) : null }

  useEffect(() => {
    const database = db()
    if (!database) return
    const r = ref(database, `sessions/${sessionId}/firedInjects`)
    onValue(r, snap => {
      const data = snap.val() ?? {}
      const newInjects: FiredInject[] = []
      for (const [id, val] of Object.entries(data)) {
        if (!seenRef.current.has(id)) {
          seenRef.current.add(id)
          newInjects.push(val as FiredInject)
        }
      }
      if (newInjects.length > 0) {
        setQueue(q => [...q, ...newInjects])
      }
    })
    return () => off(r)
  }, [sessionId])

  // Show one at a time
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(q => q.slice(1))
    }
  }, [queue, current])

  if (!current) return null

  return (
    <div className="fixed top-16 right-4 z-50 w-80 animate-slide-in">
      <div className="bg-slate-900 border border-orange-500/50 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500/10 border-b border-orange-500/30 px-4 py-3 flex items-center gap-2">
          <span className="text-orange-400 text-lg">⚡</span>
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Inject Event</span>
          <button
            onClick={() => setCurrent(null)}
            className="ml-auto text-slate-500 hover:text-slate-300 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="text-sm font-bold text-white mb-2">{current.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{current.content}</p>

          {current.scoreImpact !== 0 && (
            <div className={`mt-3 text-xs font-medium px-2 py-1 rounded-lg inline-block ${
              current.scoreImpact > 0
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {current.scoreImpact > 0 ? `+${current.scoreImpact}` : current.scoreImpact} points
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setCurrent(null)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Acknowledged ✓
          </button>
        </div>
      </div>
    </div>
  )
}
