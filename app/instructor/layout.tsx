'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'
import { logout } from '@/lib/firebase/auth'

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1117]">
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

          <div className="flex items-center gap-3">
            {appUser && (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: appUser.avatarColor }}
                >
                  {appUser.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-300">{appUser.displayName}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  )
}
