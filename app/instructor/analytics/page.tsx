'use client'

import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-200">
      {/* Top bar */}
      <div className="border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white">
            Operation <span className="text-blue-400">Hands-On</span>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-sm text-slate-300 font-medium">Analytics</span>
        </div>
        <button
          onClick={() => router.push('/instructor')}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
        >
          ← Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-6">📊</div>
        <h1 className="text-2xl font-bold text-white mb-3">Analytics</h1>
        <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
          Session performance reports, student completion rates, and scenario effectiveness metrics are coming soon.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-10">
          {[
            { label: 'Sessions Run', value: '—' },
            { label: 'Students Trained', value: '—' },
            { label: 'Avg Completion', value: '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/instructor')}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
