'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Bell, MapPin, ChevronRight, LogOut, User, Clock, BookmarkX, ArrowRight, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface FmakUser {
  id: string
  name: string
  email: string
  location: string
  business_name?: string
  wants_alerts: boolean
  account_type: string
  created_at: string
}

interface SavedMatch {
  id: string
  label?: string
  location: string
  match_data: {
    results?: Array<{ name: string; score: number; type: string }>
    questionnaire?: Record<string, string>
  }
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<FmakUser | null>(null)
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    // These auth params should have been handled by /auth/callback (server-side).
    // The client-side fallbacks below handle edge cases (e.g. implicit flow, direct link visits).

    // Fallback: hash-based access_token (Supabase implicit flow)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    let { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      // Small delay to allow cookie session to hydrate after magic link redirect (SSR/CSR timing)
      await new Promise(resolve => setTimeout(resolve, 800))
      const { data: { user: retryUser } } = await supabase.auth.getUser()
      if (!retryUser) {
        router.replace('/account/login')
        return
      }
      authUser = retryUser
    }

    const { data: fmakUser } = await supabase
      .from('fmak_users')
      .select('*')
      .eq('email', authUser.email?.toLowerCase() || '')
      .single()

    if (!fmakUser) {
      // Authenticated but no profile — auto-create a minimal profile and continue
      const emailUser = authUser.email || ''
      const nameFromEmail = emailUser.split('@')[0] || 'User'
      try {
        const res = await fetch('/api/account/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameFromEmail,
            email: emailUser,
            location: 'UK',
            accountType: 'seeker',
            wantsAlerts: false,
          }),
        })
        if (!res.ok) {
          // If auto-create fails (e.g. already exists race condition), just reload
          console.warn('Auto-create profile response:', res.status)
        }
      } catch (err) {
        console.error('Auto-create profile error:', err)
      }
      // Reload the dashboard now that profile exists
      loadDashboard()
      return
    }

    setUser(fmakUser)

    const { data: matches } = await supabase
      .from('saved_matches')
      .select('*')
      .eq('user_id', fmakUser.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setSavedMatches(matches || [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadDashboard()

    // Listen for auth state changes (handles magic link session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadDashboard()
      if (event === 'SIGNED_OUT') router.replace('/account/login')
    })

    return () => subscription.unsubscribe()
  }, [loadDashboard, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Nav */}
      <nav className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">FMAK</Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">My Account</p>
          <h1
            className="text-2xl text-gray-900 mb-1"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
          >
            {user.name ? `Hey, ${user.name.split(' ')[0]}` : 'Your Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {user.location}
            {user.business_name && <span className="text-gray-300 mx-1">·</span>}
            {user.business_name && <span>{user.business_name}</span>}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/match"
            className="bg-gray-900 text-white rounded-2xl p-5 flex flex-col gap-2 hover:bg-gray-700 transition-colors"
          >
            <Search className="w-5 h-5" />
            <span className="font-semibold text-sm">Find a Kitchen</span>
            <span className="text-xs text-gray-400">Start a new search</span>
          </Link>
          <Link
            href="/find-events"
            className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-2 hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <Building2 className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-sm text-gray-900">Markets & Events</span>
            <span className="text-xs text-gray-400">Find trading opportunities</span>
          </Link>
        </div>

        {/* Alerts status */}
        <div className={`rounded-2xl p-4 mb-6 flex items-center gap-3 ${user.wants_alerts ? 'bg-green-50 border border-green-100' : 'bg-white border border-gray-100'}`}>
          <Bell className={`w-5 h-5 flex-shrink-0 ${user.wants_alerts ? 'text-green-600' : 'text-gray-400'}`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${user.wants_alerts ? 'text-green-800' : 'text-gray-700'}`}>
              {user.wants_alerts ? 'Kitchen alerts active' : 'Kitchen alerts off'}
            </p>
            <p className="text-xs text-gray-500">
              {user.wants_alerts
                ? `You'll be emailed when new kitchens open in ${user.location}`
                : 'Turn on to get notified of new kitchens near you'}
            </p>
          </div>
        </div>

        {/* Saved matches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Saved Matches</h2>
            <Link href="/match" className="text-xs text-gray-500 hover:text-gray-900">New search →</Link>
          </div>

          {savedMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <BookmarkX className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">No saved matches yet</p>
              <Link
                href="/match"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
              >
                Find my kitchen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {savedMatches.map(match => {
                const topMatch = match.match_data?.results?.[0]
                return (
                  <div key={match.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {match.label || (match.location ? `Kitchen search — ${match.location}` : 'Kitchen search')}
                        </p>
                        {topMatch && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Top match: {topMatch.name} ({topMatch.score}% match)
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(match.created_at)}
                        </p>
                      </div>
                      <Link href="/match" className="flex-shrink-0 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Member since {formatDate(user.created_at)}</p>
        </div>
      </main>
    </div>
  )
}
