/**
 * Firebase Realtime Database helpers.
 * All functions silently no-op if RTDB is unavailable (bad/missing URL).
 */

import { ref, set, update, push, onValue, off, get, getDatabase } from 'firebase/database'
import { app } from './config'
import type { LiveSession, LiveTeam, LiveEvent, ChatMessage } from '@/lib/types'

let _rtdb: ReturnType<typeof getDatabase> | null = null

function rtdb() {
  if (_rtdb) return _rtdb
  if (!app) return null
  try {
    _rtdb = getDatabase(app)
    return _rtdb
  } catch (e) {
    console.warn('[rtdb] getDatabase failed — live features disabled:', e)
    return null
  }
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
  const db = rtdb(); if (!db) return
  await set(ref(db, paths.session(sessionId)), {
    status: 'waiting', startedAt: 0, timeRemaining: timeLimit * 60,
    teams: {}, events: {}, chat: {}, firedInjects: {},
  })
}

export async function startLiveSession(sessionId: string): Promise<void> {
  const db = rtdb(); if (!db) return
  await update(ref(db, paths.session(sessionId)), { status: 'active', startedAt: Date.now() })
}

export async function updateSessionStatus(sessionId: string, status: LiveSession['status']): Promise<void> {
  const db = rtdb(); if (!db) return
  await update(ref(db, paths.session(sessionId)), { status })
}

// ─── TIMER ────────────────────────────────────────────────────────────────────

export async function updateTimer(sessionId: string, secondsRemaining: number): Promise<void> {
  const db = rtdb(); if (!db) return
  await set(ref(db, paths.timer(sessionId)), secondsRemaining)
}

// ─── TEAM SCORES ─────────────────────────────────────────────────────────────

export async function initLiveTeam(sessionId: string, team: LiveTeam & { id: string }): Promise<void> {
  const db = rtdb(); if (!db) return
  await set(ref(db, paths.team(sessionId, team.id)), {
    score: 0, rank: 0, tasksCompleted: [], lastActivity: Date.now(), membersOnline: [],
  })
}

export async function updateTeamScore(sessionId: string, teamId: string, score: number, rank: number): Promise<void> {
  const db = rtdb(); if (!db) return
  await update(ref(db, paths.team(sessionId, teamId)), { score, rank, lastActivity: Date.now() })
}

export async function markTaskComplete(sessionId: string, teamId: string, taskId: string, newScore: number): Promise<void> {
  const db = rtdb(); if (!db) return
  const teamRef = ref(db, paths.team(sessionId, teamId))
  const snap = await get(teamRef)
  const current = snap.val() as LiveTeam | null
  const completed = current?.tasksCompleted ?? []
  if (!completed.includes(taskId)) {
    await update(teamRef, { score: newScore, tasksCompleted: [...completed, taskId], lastActivity: Date.now() })
  }
}

export async function setMemberOnline(sessionId: string, teamId: string, uid: string, online: boolean): Promise<void> {
  const db = rtdb(); if (!db) return
  const teamRef = ref(db, paths.team(sessionId, teamId))
  const snap = await get(teamRef)
  const current = snap.val() as LiveTeam | null
  let members = current?.membersOnline ?? []
  members = online ? (members.includes(uid) ? members : [...members, uid]) : members.filter(m => m !== uid)
  await update(teamRef, { membersOnline: members })
}

// ─── EVENTS FEED ─────────────────────────────────────────────────────────────

export async function pushEvent(sessionId: string, event: Omit<LiveEvent, 'timestamp'>): Promise<void> {
  const db = rtdb(); if (!db) return
  await push(ref(db, paths.events(sessionId)), { ...event, timestamp: Date.now() })
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(sessionId: string, msg: Omit<ChatMessage, 'id'>): Promise<void> {
  const db = rtdb(); if (!db) return
  await push(ref(db, paths.chat(sessionId)), msg)
}

// ─── INJECT EVENTS ───────────────────────────────────────────────────────────

export async function markInjectFired(sessionId: string, injectId: string): Promise<void> {
  const db = rtdb(); if (!db) return
  await update(ref(db, paths.firedInjects(sessionId)), { [injectId]: Date.now() })
}

// ─── LISTENERS ───────────────────────────────────────────────────────────────

export function onSessionChange(sessionId: string, callback: (data: LiveSession | null) => void): () => void {
  const db = rtdb(); if (!db) return () => {}
  const r = ref(db, paths.session(sessionId))
  onValue(r, snap => callback(snap.val() as LiveSession | null))
  return () => off(r)
}

export function onTeamsChange(sessionId: string, callback: (teams: Record<string, LiveTeam>) => void): () => void {
  const db = rtdb(); if (!db) return () => {}
  const r = ref(db, `${paths.session(sessionId)}/teams`)
  onValue(r, snap => callback((snap.val() ?? {}) as Record<string, LiveTeam>))
  return () => off(r)
}

export function onEventsChange(sessionId: string, callback: (events: Record<string, LiveEvent>) => void): () => void {
  const db = rtdb(); if (!db) return () => {}
  const r = ref(db, paths.events(sessionId))
  onValue(r, snap => callback((snap.val() ?? {}) as Record<string, LiveEvent>))
  return () => off(r)
}

export function onChatChange(sessionId: string, callback: (messages: Record<string, ChatMessage>) => void): () => void {
  const db = rtdb(); if (!db) return () => {}
  const r = ref(db, paths.chat(sessionId))
  onValue(r, snap => callback((snap.val() ?? {}) as Record<string, ChatMessage>))
  return () => off(r)
}
