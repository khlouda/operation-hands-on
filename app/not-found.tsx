import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center px-4 text-slate-200">
      <div className="text-center">
        <p className="text-7xl font-black text-slate-700 mb-4">404</p>
        <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Student Dashboard
          </Link>
          <Link
            href="/instructor"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            Instructor Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
