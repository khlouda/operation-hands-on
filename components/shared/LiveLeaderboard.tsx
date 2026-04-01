'use client'

import { useEffect, useState } from 'react'
import { onTeamsChange } from '@/lib/firebase/rtdb'
import type { LiveTeam } from '@/lib/types'

interface Props {
  sessionId: string
  currentUserId?: string
  compact?: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function LiveLeaderboard({ sessionId, currentUserId, compact }: Props) {
  const [teams, setTeams] = useState<Array<{ id: string } & LiveTeam>>([])

  useEffect(() => {
    let unsub: (() => void) | undefined
    try {
      unsub = onTeamsChange(sessionId, data => {
        const sorted = Object.entries(data)
          .map(([id, t]) => ({ id, ...t }))
          .sort((a, b) => b.score - a.score)
        setTeams(sorted)
      })
    } catch (e) {
      console.error('[LiveLeaderboard] RTDB unavailable:', e)
    }
    return () => unsub?.()
  }, [sessionId])

  if (teams.length === 0) {
    return (
      <div className="text-center py-6 text-slate-600 text-xs">
        No players yet
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {teams.map((team, i) => {
        const isMe = team.id === currentUserId
        return (
          <div
            key={team.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              isMe ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-800/50'
            }`}
          >
            <span className="text-sm w-5 text-center flex-shrink-0">
              {i < 3 ? MEDALS[i] : <span className="text-slate-600 text-xs">{i + 1}</span>}
            </span>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: team.membersOnline?.length ? '#3b82f6' : '#475569' }}
            >
              {String(team.id).charAt(0).toUpperCase()}
            </div>
            {!compact && (
              <span className={`text-xs truncate flex-1 ${isMe ? 'text-blue-300 font-medium' : 'text-slate-400'}`}>
                {isMe ? 'You' : team.id.slice(0, 8)}
              </span>
            )}
            <div className="ml-auto text-right flex-shrink-0">
              <p className={`text-xs font-bold ${isMe ? 'text-yellow-400' : 'text-slate-300'}`}>
                {team.score}
              </p>
              {!compact && (
                <p className="text-xs text-slate-600">{team.tasksCompleted?.length ?? 0}t</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
