'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Loader2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center">
          <Link href="/account" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-lg ml-2">Log In</h1>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-10">
        {!sent ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>F</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Welcome back
              </h2>
              <p className="text-gray-500 text-sm">Sign in with a magic link — no password needed.</p>
            </div>

            {/* Sign in section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Already have an account?</p>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-100 outline-none text-gray-900"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Sending...' : 'Sign in with magic link'}
                </button>
              </form>
            </div>

            {/* New user section */}
            <Link
              href="/account"
              className="flex items-center justify-between w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-5 hover:bg-emerald-100 hover:border-emerald-200 transition-all group"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-600 mb-0.5">New here?</p>
                <p className="font-semibold text-gray-900">Create your free account</p>
                <p className="text-xs text-gray-500 mt-0.5">Find commercial kitchen space across the UK</p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm mb-1">
              We sent a login link to
            </p>
            <p className="font-semibold text-gray-900 mb-6">{email}</p>
            <p className="text-gray-400 text-xs">
              Click the link in the email to log in. It expires in 1 hour.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Use a different email
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
