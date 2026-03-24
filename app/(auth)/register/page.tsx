'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/lib/firebase/auth'
import { SUBJECTS } from '@/constants/subjects'
import type { UserRole, SubjectSlug } from '@/lib/types'

const AVATAR_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
]

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<UserRole>('student')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarColor, setAvatarColor] = useState('#3b82f6')
  const [subjectInterests, setSubjectInterests] = useState<SubjectSlug[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleSubject = (slug: SubjectSlug) => {
    setSubjectInterests(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await register({ email, password, displayName, role, avatarColor, subjectInterests })
      router.push(role === 'instructor' ? '/instructor' : '/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists')
        setStep(1)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
      {/* Step 1 — Account details */}
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-slate-400 text-sm mb-8">Join Operation Hands-On at ECPI</p>

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['student', 'instructor'] as UserRole[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  role === r
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="text-xl mb-1">{r === 'student' ? '🎓' : '👨‍🏫'}</div>
                <p className={`text-sm font-semibold capitalize ${role === r ? 'text-blue-300' : 'text-slate-200'}`}>
                  {r}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {r === 'student' ? 'Join sessions & compete' : 'Create & launch sessions'}
                </p>
              </button>
            ))}
          </div>

          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="you@ecpi.edu"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Min 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Confirm Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors text-sm"
            >
              Next: Customize Profile →
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </>
      )}

      {/* Step 2 — Profile customization */}
      {step === 2 && (
        <>
          <button
            onClick={() => setStep(1)}
            className="text-xs text-slate-500 hover:text-slate-300 mb-6 flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold text-white mb-1">Customize your profile</h1>
          <p className="text-slate-400 text-sm mb-8">Pick a color and your subject interests</p>

          {/* Avatar color */}
          <div className="mb-7">
            <label className="block text-xs font-medium text-slate-400 mb-3">Avatar Color</label>
            <div className="flex items-center gap-3">
              {/* Preview */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {displayName.charAt(0).toUpperCase() || '?'}
              </div>
              {/* Color swatches */}
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAvatarColor(c.value)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      avatarColor === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Subject interests */}
          <div className="mb-8">
            <label className="block text-xs font-medium text-slate-400 mb-3">
              Subject Interests <span className="text-slate-600">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECTS.map(s => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggleSubject(s.slug)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    subjectInterests.includes(s.slug)
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="text-xs">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? 'Creating account…' : '✓ Create Account'}
          </button>
        </>
      )}
    </div>
  )
}
