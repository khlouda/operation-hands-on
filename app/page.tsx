import Link from 'next/link'
import { SUBJECTS } from '@/constants/subjects'

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          ECPI University · AI Training Platform
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-white max-w-3xl leading-tight">
          Operation{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Hands-On
          </span>
        </h1>
        <p className="mt-6 text-xl text-slate-400 max-w-2xl leading-relaxed">
          Instructors pick a subject. AI generates a complete immersive scenario.
          Students compete in real time using real tools.
        </p>
        <div className="flex gap-4 mt-10">
          <Link
            href="/login"
            className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 text-sm font-semibold text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Subjects grid */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <h2 className="text-sm font-medium tracking-wider uppercase text-slate-500 mb-6">
          7 Subject Areas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SUBJECTS.map(subject => (
            <div
              key={subject.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
            >
              <span className="text-2xl">{subject.icon}</span>
              <div>
                <p className="text-sm font-medium text-slate-200">{subject.name}</p>
                <p className="text-xs text-slate-500">{subject.topics.length} topics</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
