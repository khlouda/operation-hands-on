import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0f1117]">
      <Link href="/" className="mb-10 text-lg font-bold text-white tracking-tight">
        Operation <span className="text-blue-400">Hands-On</span>
      </Link>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
