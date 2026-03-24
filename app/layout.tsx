import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/context/AuthContext'

export const metadata: Metadata = {
  title: 'Operation Hands-On',
  description: 'AI-powered university training platform for ECPI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0f1117] text-slate-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
