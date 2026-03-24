import Link from 'next/link'
import { SUBJECTS } from '@/constants/subjects'

export default function InstructorDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
        <p className="text-slate-400 mt-1">Create AI-generated scenarios and launch live sessions</p>
      </div>

      {/* Quick action */}
      <Link
        href="/instructor/create"
        className="flex items-center gap-4 p-6 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-colors mb-10 group"
      >
        <div className="text-4xl">✨</div>
        <div>
          <p className="text-lg font-semibold text-white">Create New Scenario</p>
          <p className="text-blue-200 text-sm">Pick a subject → answer 5 questions → AI builds a complete exercise</p>
        </div>
        <div className="ml-auto text-blue-200 group-hover:translate-x-1 transition-transform text-xl">→</div>
      </Link>

      {/* Subject grid */}
      <div>
        <h2 className="text-xs font-medium tracking-wider uppercase text-slate-500 mb-4">
          Available Subjects
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map(subject => (
            <Link
              key={subject.id}
              href={`/instructor/create?subject=${subject.slug}`}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800 transition-all"
            >
              <span className="text-2xl">{subject.icon}</span>
              <div>
                <p className="text-sm font-medium text-slate-200">{subject.name}</p>
                <p className="text-xs text-slate-500">{subject.topics.length} topics</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
