'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { getSession, getScenario, createSubmission } from '@/lib/firebase/firestore'
import type { Session, Scenario, Task, Resource } from '@/lib/types'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const FILE_ICONS: Record<string, string> = {
  log: '📋', config: '⚙️', code: '💻', csv: '📊', text: '📄',
  'network-config': '🌐', image: '🖼️',
}

const DIFF_BADGE: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-orange-500/20 text-orange-400',
  expert: 'bg-red-500/20 text-red-400',
}

// ─── LEFT PANEL: TASKS ───────────────────────────────────────────────────────

function TaskPanel({
  tasks,
  completedTaskIds,
  activeTaskId,
  onSelectTask,
}: {
  tasks: Task[]
  completedTaskIds: string[]
  activeTaskId: string | null
  onSelectTask: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {tasks.map((task, i) => {
        const done = completedTaskIds.includes(task.id)
        const active = activeTaskId === task.id
        return (
          <button
            key={task.id}
            onClick={() => onSelectTask(task.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              done ? 'border-green-500/30 bg-green-500/5' :
              active ? 'border-blue-500 bg-blue-500/10' :
              'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                done ? 'bg-green-500 text-white' :
                active ? 'bg-blue-500 text-white' :
                'bg-slate-700 text-slate-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium truncate ${done ? 'text-green-400' : active ? 'text-blue-300' : 'text-slate-300'}`}>
                {task.title}
              </span>
              <span className="ml-auto text-xs text-yellow-400 font-medium flex-shrink-0">{task.points}p</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── LEFT PANEL: EVIDENCE FILES ──────────────────────────────────────────────

function EvidencePanel({
  resources,
  completedTaskIds,
  onSelectFile,
  selectedFileId,
}: {
  resources: Resource[]
  completedTaskIds: string[]
  onSelectFile: (r: Resource) => void
  selectedFileId: string | null
}) {
  return (
    <div className="space-y-1.5">
      {resources.map(r => {
        const locked = r.unlockCondition && !completedTaskIds.includes(r.unlockCondition.replace('task_', '').replace('_complete', ''))
        const selected = selectedFileId === r.id
        return (
          <button
            key={r.id}
            onClick={() => !locked && onSelectFile(r)}
            disabled={!!locked}
            className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5 ${
              locked ? 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed' :
              selected ? 'border-blue-500 bg-blue-500/10' :
              'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <span className="text-base flex-shrink-0">{FILE_ICONS[r.type] ?? '📄'}</span>
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${selected ? 'text-blue-300' : 'text-slate-300'}`}>{r.name}</p>
              {locked && <p className="text-xs text-slate-600">🔒 Locked</p>}
              {r.isDistractor && !locked && <p className="text-xs text-orange-400/70">may be irrelevant</p>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── CENTER: TASK DETAIL + ANSWER ────────────────────────────────────────────

function TaskDetail({
  task,
  isCompleted,
  onSubmit,
  submitting,
  lastResult,
}: {
  task: Task
  isCompleted: boolean
  onSubmit: (answer: string) => void
  submitting: boolean
  lastResult: 'correct' | 'wrong' | null
}) {
  const [answer, setAnswer] = useState('')
  const [hintIndex, setHintIndex] = useState(-1)

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Task header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-400">Task</span>
          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-400">{task.type}</span>
          <span className="text-xs text-yellow-400 font-bold ml-auto">{task.points} points</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">{task.title}</h2>
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
      </div>

      {/* Hints */}
      {task.hints?.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hints</span>
          </div>
          <div className="space-y-2">
            {task.hints.slice(0, hintIndex + 1).map((hint, i) => (
              <div key={hint.id} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-sm text-yellow-200">
                <span className="text-xs text-yellow-500 font-medium mr-2">Hint {i + 1}:</span>
                {hint.text}
              </div>
            ))}
            {hintIndex < task.hints.length - 1 && (
              <button
                onClick={() => setHintIndex(h => h + 1)}
                className="text-xs text-slate-500 hover:text-yellow-400 transition-colors flex items-center gap-1.5"
              >
                <span>💡</span>
                {hintIndex === -1 ? 'Use a hint' : 'Use next hint'}
                <span className="text-slate-600">(-{task.hints[hintIndex + 1]?.pointsCost ?? 25} pts)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Answer */}
      <div className="mt-auto">
        {isCompleted ? (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-400">Task completed!</p>
              <p className="text-xs text-slate-400">Move to the next task</p>
            </div>
          </div>
        ) : (
          <div>
            {lastResult === 'wrong' && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                ✗ Incorrect — try again
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && answer.trim() && onSubmit(answer.trim())}
                placeholder="Enter your answer or flag…"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
              <button
                onClick={() => answer.trim() && onSubmit(answer.trim())}
                disabled={submitting || !answer.trim()}
                className="px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-40 transition-colors"
              >
                {submitting ? '…' : 'Submit'}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">Press Enter to submit</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CENTER: FILE VIEWER ─────────────────────────────────────────────────────

function FileViewer({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>{FILE_ICONS[resource.type] ?? '📄'}</span>
          <span className="text-sm font-medium text-slate-200">{resource.name}</span>
          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{resource.type}</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
          {resource.content}
        </pre>
      </div>
    </div>
  )
}

// ─── RIGHT: TEAM CHAT ────────────────────────────────────────────────────────

function TeamChat({ teamName, displayName }: { teamName: string; displayName: string }) {
  const [msg, setMsg] = useState('')
  const [messages, setMessages] = useState([
    { id: '1', from: 'System', text: 'Session started. Good luck!', time: 'now' },
  ])

  const send = () => {
    if (!msg.trim()) return
    setMessages(m => [...m, { id: Date.now().toString(), from: displayName, text: msg.trim(), time: 'now' }])
    setMsg('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-slate-700/50 flex-shrink-0">
        <p className="text-xs font-semibold text-slate-300">{teamName}</p>
        <p className="text-xs text-slate-600">Team chat</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map(m => (
          <div key={m.id}>
            <p className="text-xs font-medium text-slate-400">{m.from}</p>
            <p className="text-xs text-slate-300">{m.text}</p>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-slate-700/50 flex-shrink-0">
        <div className="flex gap-1.5">
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Message…"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
          <button onClick={send} className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-500">→</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN WORKSPACE ──────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const { appUser } = useAuth()
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<Resource | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null)
  const [leftTab, setLeftTab] = useState<'tasks' | 'files'>('tasks')
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const s = await getSession(id)
        if (!s) { router.push('/dashboard'); return }
        setSession(s)
        const sc = await getScenario(s.scenarioId)
        setScenario(sc)
        if (sc?.tasks?.length) setActiveTaskId(sc.tasks[0].id)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const handleSubmit = async (answer: string) => {
    if (!scenario || !activeTaskId || !appUser || !session) return
    const task = scenario.tasks.find(t => t.id === activeTaskId)
    if (!task) return

    setSubmitting(true)
    const isCorrect = answer.toLowerCase().trim() === task.correctAnswer.toLowerCase().trim()

    try {
      await createSubmission({
        sessionId: id,
        teamId: appUser.uid,
        userId: appUser.uid,
        taskId: activeTaskId,
        answer,
        isCorrect,
        pointsAwarded: isCorrect ? task.points : 0,
        submittedAt: Date.now(),
      })
    } catch { /* non-blocking */ }

    if (isCorrect) {
      setLastResult('correct')
      setScore(s => s + task.points)
      setCompletedTaskIds(prev => [...prev, activeTaskId])
      // auto-advance to next task
      const idx = scenario.tasks.findIndex(t => t.id === activeTaskId)
      const next = scenario.tasks[idx + 1]
      if (next) setTimeout(() => { setActiveTaskId(next.id); setLastResult(null) }, 1200)
    } else {
      setLastResult('wrong')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session || !scenario) {
    return <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center text-slate-400">Session not found.</div>
  }

  const activeTask = scenario.tasks?.find(t => t.id === activeTaskId) ?? null

  return (
    <div className="h-screen bg-[#0a0d14] flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white">Operation <span className="text-blue-400">Hands-On</span></span>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-300 font-medium truncate max-w-xs">{scenario.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${DIFF_BADGE[scenario.difficulty]}`}>
            {scenario.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Score:</span>
            <span className="font-bold text-yellow-400">{score}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Tasks:</span>
            <span className="font-bold text-white">{completedTaskIds.length}/{scenario.tasks?.length ?? 0}</span>
          </div>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: appUser?.avatarColor ?? '#3b82f6' }}
          >
            {appUser?.displayName?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-64 flex-shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 flex-shrink-0">
            {(['tasks', 'files'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${
                  leftTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'tasks' ? `Tasks (${scenario.tasks?.length ?? 0})` : `Files (${scenario.resources?.length ?? 0})`}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {leftTab === 'tasks' ? (
              <TaskPanel
                tasks={scenario.tasks ?? []}
                completedTaskIds={completedTaskIds}
                activeTaskId={activeTaskId}
                onSelectTask={id => { setActiveTaskId(id); setLastResult(null) }}
              />
            ) : (
              <EvidencePanel
                resources={scenario.resources ?? []}
                completedTaskIds={completedTaskIds}
                onSelectFile={r => { setSelectedFile(r); }}
                selectedFileId={selectedFile?.id ?? null}
              />
            )}
          </div>

          {/* Mission brief toggle */}
          <div className="border-t border-slate-800 p-3 flex-shrink-0">
            <details className="group">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                Mission Brief
              </summary>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{scenario.briefing ?? scenario.story?.slice(0, 200) + '…'}</p>
            </details>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1017]">
          {selectedFile ? (
            <FileViewer resource={selectedFile} onClose={() => setSelectedFile(null)} />
          ) : activeTask ? (
            <TaskDetail
              key={activeTask.id}
              task={activeTask}
              isCompleted={completedTaskIds.includes(activeTask.id)}
              onSubmit={handleSubmit}
              submitting={submitting}
              lastResult={lastResult}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
              Select a task from the left panel
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-56 flex-shrink-0 border-l border-slate-800 flex flex-col overflow-hidden">
          {/* Mini leaderboard */}
          <div className="border-b border-slate-800 p-3 flex-shrink-0">
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Your Score</p>
            <p className="text-2xl font-bold text-yellow-400">{score}</p>
            <p className="text-xs text-slate-600 mt-0.5">{completedTaskIds.length} tasks done</p>
          </div>
          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <TeamChat
              teamName="Your Team"
              displayName={appUser?.displayName ?? 'You'}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
