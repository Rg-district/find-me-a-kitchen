'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, MapPin, ChevronRight, LogOut, User, Clock, BookmarkX, ArrowRight, Building2 } from 'lucide-react'
import { supabaseAuth } from '@/lib/supabase-auth'

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
  }
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<FmakUser | null>(null)
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Get session from the same client that set it (supabaseAuth)
      const { data: { session } } = await supabaseAuth.auth.getSession()

      if (!session?.user) {
        router.replace('/account/login')
        return
      }

      const email = session.user.email?.toLowerCase() ?? ''

      // Look up FMAK profile
      let { data: fmakUser } = await supabaseAuth
        .from('fmak_users')
        .select('*')
        .eq('email', email)
        .single()

      if (!fmakUser) {
        // Auto-create minimal profile
        const nameFromEmail = email.split('@')[0] || 'User'
        const { data: newUser } = await supabaseAuth
          .from('fmak_users')
          .insert({
            email,
            name: nameFromEmail,
            location: 'UK',
            account_type: 'seeker',
            wants_alerts: false,
          })
          .select()
          .single()
        fmakUser = newUser
      }

      if (!fmakUser) {
        // Profile creation failed — send to register with email pre-filled
        router.replace('/account?email=' + encodeURIComponent(email))
        return
      }

      setUser(fmakUser)

      const { data: matches } = await supabaseAuth
        .from('saved_matches')
        .select('*')
        .eq('user_id', fmakUser.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setSavedMatches(matches ?? [])
      setLoading(false)
    }

    load()

    // Also listen for auth changes (e.g. if user logs in while on this page)
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') load()
      if (event === 'SIGNED_OUT') router.replace('/')
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabaseAuth.auth.signOut()
    router.replace('/')
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

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
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">My Account</p>
          <h1 className="text-2xl text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}>
            {user.name ? `Hey, ${user.name.split(' ')[0]}` : 'Your Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {user.location}
            {user.business_name && <><span className="text-gray-300 mx-1">·</span><span>{user.business_name}</span></>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/match" className="bg-gray-900 text-white rounded-2xl p-5 flex flex-col gap-2 hover:bg-gray-700 transition-colors">
            <Search className="w-5 h-5" />
            <span className="font-semibold text-sm">Find a Kitchen</span>
            <span className="text-xs text-gray-400">Start a new search</span>
          </Link>
          <Link href="/find-events" className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-2 hover:border-gray-200 hover:shadow-sm transition-all">
            <Building2 className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-sm text-gray-900">Markets & Events</span>
            <span className="text-xs text-gray-400">Find trading opportunities</span>
          </Link>
        </div>

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

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Saved Matches</h2>
            <Link href="/match" className="text-xs text-gray-500 hover:text-gray-900">New search →</Link>
          </div>

          {savedMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <BookmarkX className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">No saved matches yet</p>
              <Link href="/match" className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors">
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
                        {topMatch && <p className="text-xs text-gray-500 mt-0.5">Top match: {topMatch.name} ({topMatch.score}% match)</p>}
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
