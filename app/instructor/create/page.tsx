'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SUBJECTS, SUBJECT_QUESTIONS } from '@/constants/subjects'
import { useAuth } from '@/lib/context/AuthContext'
import type { Subject, Topic, DifficultyLevel, SessionMode, GenerationParams, Scenario } from '@/lib/types'
import { Suspense } from 'react'

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Subject', 'Parameters', 'Questions', 'Generate', 'Review']
  return (
    <div className="flex items-center gap-2 mb-10">
      {labels.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                done ? 'bg-blue-600 border-blue-600 text-white' :
                active ? 'border-blue-500 text-blue-400 bg-blue-500/10' :
                'border-slate-700 text-slate-600'
              }`}>
                {done ? '✓' : step}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-slate-200' : 'text-slate-600'}`}>
                {label}
              </span>
            </div>
            {i < total - 1 && <div className="w-8 h-px bg-slate-700 mx-1" />}
          </div>
        )
      })}
    </div>
  )
}

// ─── STEP 1: SUBJECT & TOPIC ─────────────────────────────────────────────────

function Step1({
  selectedSubject, selectedTopic,
  onSelectSubject, onSelectTopic, onNext
}: {
  selectedSubject: Subject | null
  selectedTopic: Topic | null
  onSelectSubject: (s: Subject) => void
  onSelectTopic: (t: Topic) => void
  onNext: () => void
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Choose a Subject & Topic</h2>
      <p className="text-slate-400 text-sm mb-8">Select the subject area, then pick a specific topic for the exercise.</p>

      {/* Subjects */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {SUBJECTS.map(subject => (
          <button
            key={subject.id}
            onClick={() => onSelectSubject(subject)}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
              selectedSubject?.id === subject.id
                ? 'border-blue-500 bg-blue-500/10 text-white'
                : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <span className="text-2xl">{subject.icon}</span>
            <div>
              <p className="text-sm font-medium">{subject.name}</p>
              <p className="text-xs text-slate-500">{subject.topics.length} topics</p>
            </div>
          </button>
        ))}
      </div>

      {/* Topics */}
      {selectedSubject && (
        <div>
          <h3 className="text-xs font-medium tracking-wider uppercase text-slate-500 mb-3">
            Topics in {selectedSubject.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
            {selectedSubject.topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedTopic?.id === topic.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <p className={`text-sm font-medium ${selectedTopic?.id === topic.id ? 'text-blue-300' : 'text-slate-200'}`}>
                  {topic.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">{topic.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!selectedSubject || !selectedTopic}
        className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
      >
        Next: Set Parameters →
      </button>
    </div>
  )
}

// ─── STEP 2: PARAMETERS ──────────────────────────────────────────────────────

const DIFFICULTIES: { value: DifficultyLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'First exposure to the topic' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience required' },
  { value: 'advanced', label: 'Advanced', desc: 'Strong foundation needed' },
  { value: 'expert', label: 'Expert', desc: 'Professional-level challenge' },
]

const MODES: { value: SessionMode; label: string; icon: string; desc: string }[] = [
  { value: 'competitive', label: 'Competitive', icon: '🏆', desc: 'Teams race for the top score' },
  { value: 'cooperative', label: 'Cooperative', icon: '🤝', desc: 'All teams work together' },
  { value: 'individual', label: 'Individual', icon: '👤', desc: 'Each student works alone' },
]

function Step2({
  difficulty, setDifficulty,
  timeLimit, setTimeLimit,
  teamSize, setTeamSize,
  mode, setMode,
  onNext, onBack
}: {
  difficulty: DifficultyLevel
  setDifficulty: (v: DifficultyLevel) => void
  timeLimit: number
  setTimeLimit: (v: number) => void
  teamSize: number
  setTeamSize: (v: number) => void
  mode: SessionMode
  setMode: (v: SessionMode) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Set Parameters</h2>
      <p className="text-slate-400 text-sm mb-8">Configure how the scenario will be structured and scored.</p>

      {/* Difficulty */}
      <div className="mb-8">
        <label className="text-xs font-medium tracking-wider uppercase text-slate-500 block mb-3">Difficulty</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`p-4 rounded-xl border text-left transition-all ${
                difficulty === d.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <p className={`text-sm font-semibold ${difficulty === d.value ? 'text-blue-300' : 'text-slate-200'}`}>
                {d.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Time limit */}
      <div className="mb-8">
        <label className="text-xs font-medium tracking-wider uppercase text-slate-500 block mb-3">
          Time Limit — <span className="text-slate-300 normal-case font-bold">{timeLimit} minutes</span>
        </label>
        <div className="flex gap-2">
          {[30, 45, 60, 90, 120].map(t => (
            <button
              key={t}
              onClick={() => setTimeLimit(t)}
              className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                timeLimit === t
                  ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              {t}m
            </button>
          ))}
        </div>
      </div>

      {/* Team size */}
      <div className="mb-8">
        <label className="text-xs font-medium tracking-wider uppercase text-slate-500 block mb-3">
          Team Size — <span className="text-slate-300 normal-case font-bold">{teamSize === 1 ? 'Solo' : `${teamSize} students`}</span>
        </label>
        <input
          type="range" min={1} max={6} value={teamSize}
          onChange={e => setTeamSize(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>Solo</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6+</span>
        </div>
      </div>

      {/* Mode */}
      <div className="mb-10">
        <label className="text-xs font-medium tracking-wider uppercase text-slate-500 block mb-3">Session Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === m.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="text-xl mb-1">{m.icon}</div>
              <p className={`text-sm font-semibold ${mode === m.value ? 'text-blue-300' : 'text-slate-200'}`}>{m.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-3 text-sm font-semibold text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors">
          Next: Answer Questions →
        </button>
      </div>
    </div>
  )
}

// ─── STEP 3: QUESTIONS ───────────────────────────────────────────────────────

function Step3({
  subject, answers, setAnswers, onNext, onBack
}: {
  subject: Subject
  answers: Record<string, string>
  setAnswers: (a: Record<string, string>) => void
  onNext: () => void
  onBack: () => void
}) {
  const questions = SUBJECT_QUESTIONS[subject.slug] ?? []
  const allAnswered = questions.every(q => answers[q.id]?.trim())

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Answer 5 Questions</h2>
      <p className="text-slate-400 text-sm mb-8">
        These guide the AI to generate a scenario that fits your class. Takes 30 seconds.
      </p>

      <div className="space-y-6 mb-10">
        {questions.map((q, i) => (
          <div key={q.id}>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              <span className="text-blue-400 mr-2">Q{i + 1}.</span>{q.question}
            </label>
            {q.type === 'select' && q.options ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                      answers[q.id] === opt
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                rows={2}
                placeholder="Type your answer here…"
                value={answers[q.id] ?? ''}
                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-3 text-sm font-semibold text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!allAnswered}
          className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
        >
          Generate Scenario ✨
        </button>
      </div>
    </div>
  )
}

// ─── STEP 4: GENERATE ────────────────────────────────────────────────────────

function Step4({
  params, onComplete
}: {
  params: GenerationParams
  onComplete: (scenario: Scenario) => void
}) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'retrying' | 'done' | 'error'>('idle')
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const started = useRef(false)
  const MAX_RETRIES = 4

  const generate = async (attempt: number = 0) => {
    if (started.current) return
    started.current = true
    setStatus('generating')
    setStreamText('')

    try {
      const res = await fetch('/api/ai/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Generation failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (!payload) continue

          const msg = JSON.parse(payload)
          if (msg.type === 'chunk') {
            setStreamText(t => t + msg.text)
          } else if (msg.type === 'done') {
            setStatus('done')
            onComplete(msg.scenario)
            return
          } else if (msg.type === 'error') {
            if (msg.message === 'overloaded' && attempt < MAX_RETRIES) {
              started.current = false
              const waitSec = 5 + attempt * 3
              setRetryCount(attempt + 1)
              setCountdown(waitSec)
              setStatus('retrying')
              // countdown display
              for (let s = waitSec - 1; s >= 0; s--) {
                await new Promise(r => setTimeout(r, 1000))
                setCountdown(s)
              }
              generate(attempt + 1)
              return
            }
            throw new Error(msg.message === 'overloaded'
              ? 'Claude is overloaded right now. Please try again in a few minutes.'
              : (msg.message ?? 'Generation failed'))
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-2xl font-bold text-white mb-3">Ready to Generate</h2>
        <p className="text-slate-400 max-w-md mb-8">
          Claude will build a complete immersive scenario — story, tasks, evidence files, inject events, and hints.
          Takes about 20–30 seconds.
        </p>
        <button
          onClick={() => generate(0)}
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors text-lg"
        >
          Generate Scenario
        </button>
      </div>
    )
  }

  if (status === 'retrying') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-6">⏳</div>
        <h2 className="text-xl font-bold text-white mb-2">Claude is busy — retrying…</h2>
        <p className="text-slate-400 text-sm mb-2">Attempt {retryCount} of {MAX_RETRIES}</p>
        <p className="text-slate-500 text-sm">Retrying in <span className="text-blue-400 font-bold">{countdown}s</span></p>
      </div>
    )
  }

  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Building your scenario…</h2>
        <p className="text-slate-400 text-sm mb-8">Claude is writing the story, tasks, evidence files, and inject events</p>
        <div className="w-full max-w-2xl bg-slate-800/50 rounded-xl border border-slate-700 p-4 text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-blue-400 font-medium">AI is writing…</span>
          </div>
          {streamText ? (
            <pre className="text-xs text-slate-400 whitespace-pre-wrap break-all max-h-48 overflow-hidden font-mono leading-relaxed">
              {streamText.slice(-600)}
            </pre>
          ) : (
            <div className="space-y-1">
              {['Crafting story narrative', 'Designing progressive tasks', 'Creating evidence files', 'Writing inject events', 'Generating hints & scoring'].map((step) => (
                <div key={step} className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Generation failed</h2>
        <p className="text-red-400 text-sm mb-6">{error}</p>
        <button
          onClick={() => { started.current = false; setRetryCount(0); setStatus('idle') }}
          className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500"
        >
          Try Again
        </button>
      </div>
    )
  }

  return null
}

// ─── STEP 5: REVIEW ──────────────────────────────────────────────────────────

function Step5({ scenario, params, instructorId, onRegenerate }: {
  scenario: Scenario
  params: GenerationParams
  instructorId: string
  onRegenerate: () => void
}) {
  const router = useRouter()
  const [publishing, setPublishing] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [sessionId, setSessionId] = useState('')

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          instructorId,
          mode: params.mode,
          timeLimit: params.timeLimit,
          teamSize: params.teamSize,
        }),
      })
      const data = await res.json()

      setAccessCode(data.accessCode)
      setSessionId(data.sessionId)

      // Initialize RTDB session structure so leaderboard/timer work immediately
      try {
        const { initLiveSession } = await import('@/lib/firebase/rtdb')
        await initLiveSession(data.sessionId, params.timeLimit)
      } catch { /* RTDB unavailable — live features will be limited */ }
    } catch {
      // still show success even if session creation fails
      setAccessCode('ERROR')
    } finally {
      setPublishing(false)
    }
  }

  // ── Success screen after publishing ──
  if (accessCode) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-3xl mb-6">✓</div>
        <h2 className="text-2xl font-bold text-white mb-2">Session Created!</h2>
        <p className="text-slate-400 text-sm mb-8">Share this code with your students to join the session</p>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-8 w-full max-w-sm">
          <p className="text-xs font-medium tracking-widest uppercase text-slate-500 mb-3">Access Code</p>
          <p className="text-5xl font-bold text-white tracking-widest font-mono">{accessCode}</p>
          <p className="text-xs text-slate-500 mt-3">Students enter this on their dashboard</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/session/${sessionId}/monitor`)}
            className="px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Open Monitor →
          </button>
          <button
            onClick={() => router.push('/instructor')}
            className="px-6 py-3 text-sm font-semibold text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Review Your Scenario</h2>
          <p className="text-slate-400 text-sm">Review what Claude generated. Publish when ready.</p>
        </div>
        <button
          onClick={onRegenerate}
          className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
        >
          ↺ Regenerate
        </button>
      </div>

      {/* Title & Story */}
      <div className="mb-6 p-6 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium tracking-wider uppercase text-blue-400">Scenario</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            scenario.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
            scenario.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
            scenario.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {scenario.difficulty}
          </span>
          <span className="text-xs text-slate-500">{scenario.estimatedTime} min</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-3">{scenario.title}</h3>
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{scenario.story}</p>
      </div>

      {/* Tasks */}
      <div className="mb-6">
        <h3 className="text-xs font-medium tracking-wider uppercase text-slate-500 mb-3">
          Tasks ({scenario.tasks?.length ?? 0})
        </h3>
        <div className="space-y-3">
          {scenario.tasks?.map((task, i) => (
            <div key={task.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">
                  Task {i + 1}: {task.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">{task.type}</span>
                  <span className="text-xs text-yellow-400 font-medium">{task.points} pts</span>
                </div>
              </div>
              <p className="text-sm text-slate-400">{task.description}</p>
              {task.hints?.length > 0 && (
                <p className="text-xs text-slate-600 mt-2">{task.hints.length} hints available</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      {scenario.resources?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium tracking-wider uppercase text-slate-500 mb-3">
            Evidence Files ({scenario.resources.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {scenario.resources.map(r => (
              <div key={r.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center gap-2">
                <span className="text-lg">
                  {r.type === 'log' ? '📋' : r.type === 'config' ? '⚙️' : r.type === 'code' ? '💻' : '📄'}
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-300">{r.name}</p>
                  {r.isDistractor && <p className="text-xs text-orange-400">distractor</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inject events */}
      {scenario.injectEvents?.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-medium tracking-wider uppercase text-slate-500 mb-3">
            Inject Events ({scenario.injectEvents.length})
          </h3>
          <div className="space-y-2">
            {scenario.injectEvents.map(e => (
              <div key={e.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 flex items-start gap-3">
                <span className="text-lg mt-0.5">⚡</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{e.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {e.triggerType === 'time' ? `Fires at ${e.triggerTime} min` : e.triggerType}
                    {e.scoreImpact !== 0 && ` · ${e.scoreImpact > 0 ? '+' : ''}${e.scoreImpact} pts`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish */}
      <div className="flex gap-3">
        <button
          onClick={onRegenerate}
          className="px-6 py-3 text-sm font-semibold text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
        >
          ↺ Start Over
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="px-8 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
        >
          {publishing ? 'Creating session…' : '✓ Publish & Create Session'}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function CreateScenarioContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { appUser } = useAuth()

  const [step, setStep] = useState(1)

  // Step 1
  const preselectedSlug = searchParams.get('subject')
  const preselectedSubject = SUBJECTS.find(s => s.slug === preselectedSlug) ?? null
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(preselectedSubject)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  // Step 2
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate')
  const [timeLimit, setTimeLimit] = useState(60)
  const [teamSize, setTeamSize] = useState(3)
  const [mode, setMode] = useState<SessionMode>('competitive')

  // Step 3
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Step 5
  const [generatedScenario, setGeneratedScenario] = useState<Scenario | null>(null)

  const buildParams = (): GenerationParams => ({
    subject: selectedSubject!.slug,
    topic: selectedTopic!.slug,
    difficulty,
    timeLimit,
    teamSize,
    mode,
    learningObjectives: Object.values(answers).filter(Boolean),
    answers,
  })

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <StepIndicator current={step} total={5} />

      {step === 1 && (
        <Step1
          selectedSubject={selectedSubject}
          selectedTopic={selectedTopic}
          onSelectSubject={s => { setSelectedSubject(s); setSelectedTopic(null) }}
          onSelectTopic={setSelectedTopic}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && selectedSubject && (
        <Step2
          difficulty={difficulty} setDifficulty={setDifficulty}
          timeLimit={timeLimit} setTimeLimit={setTimeLimit}
          teamSize={teamSize} setTeamSize={setTeamSize}
          mode={mode} setMode={setMode}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selectedSubject && (
        <Step3
          subject={selectedSubject}
          answers={answers}
          setAnswers={setAnswers}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <Step4
          params={buildParams()}
          onComplete={scenario => {
            setGeneratedScenario(scenario)
            setStep(5)
          }}
        />
      )}

      {step === 5 && generatedScenario && (
        <Step5
          scenario={generatedScenario}
          params={buildParams()}
          instructorId={appUser?.uid ?? ''}
          onRegenerate={() => { setStep(4); setGeneratedScenario(null) }}
        />
      )}
    </div>
  )
}

export default function CreateScenarioPage() {
  return (
    <Suspense>
      <CreateScenarioContent />
    </Suspense>
  )
}
