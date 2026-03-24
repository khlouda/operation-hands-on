/**
 * Firebase Realtime Database helpers.
 * Used for everything that needs to update live across all clients:
 *   - Session status & timer
 *   - Team scores & leaderboard
 *   - Live event feed
 *   - Team chat
 *   - Inject events
 */

import { ref, set, update, push, onValue, off, get, getDatabase } from 'firebase/database'
import { app } from './config'
import type { LiveSession, LiveTeam, LiveEvent, ChatMessage } from '@/lib/types'

function rtdb() {
  if (!app) throw new Error('Firebase not configured — add environment variables')
  return getDatabase(app)
}

// Path helpers
const paths = {
  session: (sessionId: string) => `sessions/${sessionId}`,
  team: (sessionId: string, teamId: string) => `sessions/${sessionId}/teams/${teamId}`,
  events: (sessionId: string) => `sessions/${sessionId}/events`,
  chat: (sessionId: string) => `sessions/${sessionId}/chat`,
  timer: (sessionId: string) => `sessions/${sessionId}/timeRemaining`,
  firedInjects: (sessionId: string) => `sessions/${sessionId}/firedInjects`,
}

// ─── SESSION INIT ─────────────────────────────────────────────────────────────

export async function initLiveSession(sessionId: string, timeLimit: number): Promise<void> {
  await set(ref(rtdb(), paths.session(sessionId)), {
    status: 'waiting',
    startedAt: 0,
    timeRemaining: timeLimit * 60,
    teams: {},
    events: {},
    chat: {},
    firedInjects: {},
  })
}

export async function startLiveSession(sessionId: string): Promise<void> {
  await update(ref(rtdb(), paths.session(sessionId)), {
    status: 'active',
    startedAt: Date.now(),
  })
}

export async function updateSessionStatus(
  sessionId: string,
  status: LiveSession['status']
): Promise<void> {
  await update(ref(rtdb(), paths.session(sessionId)), { status })
}

// ─── TIMER ────────────────────────────────────────────────────────────────────

export async function updateTimer(sessionId: string, secondsRemaining: number): Promise<void> {
  await set(ref(rtdb(), paths.timer(sessionId)), secondsRemaining)
}

// ─── TEAM SCORES ─────────────────────────────────────────────────────────────

export async function initLiveTeam(sessionId: string, team: LiveTeam & { id: string }): Promise<void> {
  await set(ref(rtdb(), paths.team(sessionId, team.id)), {
    score: 0,
    rank: 0,
    tasksCompleted: [],
    lastActivity: Date.now(),
    membersOnline: [],
  })
}

export async function updateTeamScore(
  sessionId: string,
  teamId: string,
  score: number,
  rank: number
): Promise<void> {
  await update(ref(rtdb(), paths.team(sessionId, teamId)), { score, rank, lastActivity: Date.now() })
}

export async function markTaskComplete(
  sessionId: string,
  teamId: string,
  taskId: string,
  newScore: number
): Promise<void> {
  const teamRef = ref(rtdb(), paths.team(sessionId, teamId))
  const snap = await get(teamRef)
  const current = snap.val() as LiveTeam | null
  const completed = current?.tasksCompleted ?? []
  if (!completed.includes(taskId)) {
    await update(teamRef, {
      score: newScore,
      tasksCompleted: [...completed, taskId],
      lastActivity: Date.now(),
    })
  }
}

export async function setMemberOnline(
  sessionId: string,
  teamId: string,
  uid: string,
  online: boolean
): Promise<void> {
  const teamRef = ref(rtdb(), paths.team(sessionId, teamId))
  const snap = await get(teamRef)
  const current = snap.val() as LiveTeam | null
  let members = current?.membersOnline ?? []
  if (online) {
    if (!members.includes(uid)) members = [...members, uid]
  } else {
    members = members.filter(m => m !== uid)
  }
  await update(teamRef, { membersOnline: members })
}

// ─── EVENTS FEED ─────────────────────────────────────────────────────────────

export async function pushEvent(sessionId: string, event: Omit<LiveEvent, 'timestamp'>): Promise<void> {
  await push(ref(rtdb(), paths.events(sessionId)), { ...event, timestamp: Date.now() })
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(sessionId: string, msg: Omit<ChatMessage, 'id'>): Promise<void> {
  await push(ref(rtdb(), paths.chat(sessionId)), msg)
}

// ─── INJECT EVENTS ───────────────────────────────────────────────────────────

export async function markInjectFired(sessionId: string, injectId: string): Promise<void> {
  await update(ref(rtdb(), paths.firedInjects(sessionId)), { [injectId]: Date.now() })
}

// ─── LISTENERS ───────────────────────────────────────────────────────────────

export function onSessionChange(
  sessionId: string,
  callback: (data: LiveSession | null) => void
): () => void {
  const r = ref(rtdb(), paths.session(sessionId))
  onValue(r, snap => callback(snap.val() as LiveSession | null))
  return () => off(r)
}

export function onTeamsChange(
  sessionId: string,
  callback: (teams: Record<string, LiveTeam>) => void
): () => void {
  const r = ref(rtdb(), `${paths.session(sessionId)}/teams`)
  onValue(r, snap => callback((snap.val() ?? {}) as Record<string, LiveTeam>))
  return () => off(r)
}

export function onEventsChange(
  sessionId: string,
  callback: (events: Record<string, LiveEvent>) => void
): () => void {
  const r = ref(rtdb(), paths.events(sessionId))
  onValue(r, snap => callback((snap.val() ?? {}) as Record<string, LiveEvent>))
  return () => off(r)
}

export function onChatChange(
  sessionId: string,
  callback: (messages: Record<string, ChatMessage>) => void
): () => void {
  const r = ref(rtdb(), paths.chat(sessionId))
  onValue(r, snap => callback((snap.val() ?? {}) as Record<string, ChatMessage>))
  return () => off(r)
}
