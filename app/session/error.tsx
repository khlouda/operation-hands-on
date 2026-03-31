'use client'

export default function SessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center text-center px-6">
      <div>
        <p className="text-red-400 font-semibold mb-2">Something went wrong loading this page</p>
        <p className="text-slate-500 text-sm mb-1 font-mono">{error.message}</p>
        {error.digest && <p className="text-slate-600 text-xs mb-4">Digest: {error.digest}</p>}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 mt-4"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
