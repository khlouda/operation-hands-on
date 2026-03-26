'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { SUBJECTS } from '@/constants/subjects'

const STATS = [
  { label: 'Scenarios Created', value: '0', icon: '📋', sub: 'Get started below' },
  { label: 'Sessions Launched', value: '0', icon: '🚀', sub: 'No sessions yet' },
  { label: 'Students Trained', value: '0', icon: '🎓', sub: 'Waiting for first session' },
  { label: 'Avg Completion', value: '—', icon: '📈', sub: 'No data yet' },
]

export default function InstructorDashboard() {
  const { appUser } = useAuth()
  const firstName = appUser?.displayName?.split(' ')[0] ?? 'Instructor'

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
        {STATS.map(stat => (
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

      {/* Scenario Library + Sessions side by side */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Scenario Library */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white">Scenario Library</h2>
            <Link
              href="/instructor/create"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Create
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl mb-3">
              📋
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">No scenarios yet</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Your AI-generated scenarios will appear here. Create your first one to get started.
            </p>
            <Link
              href="/instructor/create"
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Create First Scenario
            </Link>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white">Recent Sessions</h2>
            <span className="text-xs text-slate-600">Live & completed</span>
          </div>
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl mb-3">
              🚀
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">No sessions launched</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Once you create a scenario and launch a session, it will appear here with live stats.
            </p>
          </div>
        </div>

      </div>

      {/* How it works */}
      <div className="border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-5">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Pick a subject & topic', desc: 'Choose from 7 subjects and 35 topics', icon: '📚' },
            { step: '2', title: 'Answer 5 questions', desc: 'Tell the AI the focus, difficulty, and context', icon: '💬' },
            { step: '3', title: 'AI generates the scenario', desc: 'Complete story, tasks, evidence files, and events in ~30 seconds', icon: '✨' },
            { step: '4', title: 'Launch & watch', desc: 'Teams compete live on the leaderboard while you monitor', icon: '🏆' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
