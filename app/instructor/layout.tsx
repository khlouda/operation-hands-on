import Link from 'next/link'

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f1117]">
      {/* Top nav */}
      <nav className="border-b border-slate-800 bg-[#0f1117]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-bold text-white tracking-tight">
              Operation <span className="text-blue-400">Hands-On</span>
            </Link>
            <span className="text-slate-700">|</span>
            <Link href="/instructor" className="text-sm text-slate-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/instructor/create" className="text-sm text-slate-400 hover:text-white transition-colors">
              Create Scenario
            </Link>
          </div>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
            Instructor
          </span>
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  )
}
