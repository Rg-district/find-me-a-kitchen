'use client'

// PREVIEW ONLY — shows what the dashboard looks like when logged in
// Remove this page once auth is working

import Link from 'next/link'
import { Search, Bell, MapPin, ChevronRight, LogOut, User, Clock, BookmarkX, ArrowRight, Building2 } from 'lucide-react'

const mockUser = {
  name: 'Romes',
  email: 'romes@example.com',
  location: 'London',
  business_name: 'Cater Converts',
  wants_alerts: true,
  created_at: '2026-03-26T00:00:00Z',
}

const mockMatches = [
  {
    id: '1',
    label: 'Kitchen search — London',
    location: 'London',
    match_data: { results: [{ name: 'Karma Kitchen', score: 87, type: 'dark_kitchen' }] },
    created_at: '2026-03-25T14:22:00Z',
  },
  {
    id: '2',
    label: 'Kitchen search — East London',
    location: 'East London',
    match_data: { results: [{ name: 'FoodStars', score: 74, type: 'dark_kitchen' }] },
    created_at: '2026-03-20T09:10:00Z',
  },
]

export default function DashboardPreview() {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Preview banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700 font-medium">
        📋 Dashboard Preview — this is what users see when logged in
      </div>

      {/* Nav */}
      <nav className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">FMAK</Link>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
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
            Hey, {mockUser.name}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {mockUser.location}
            <span className="text-gray-300">·</span>
            {mockUser.business_name}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-gray-900 text-white rounded-2xl p-5 flex flex-col gap-2">
            <Search className="w-5 h-5" />
            <span className="font-semibold text-sm">Find a Kitchen</span>
            <span className="text-xs text-gray-400">Start a new search</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-2">
            <Building2 className="w-5 h-5 text-gray-700" />
            <span className="font-semibold text-sm text-gray-900">Markets & Events</span>
            <span className="text-xs text-gray-400">Find trading opportunities</span>
          </div>
        </div>

        {/* Alerts — active */}
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3 bg-green-50 border border-green-100">
          <Bell className="w-5 h-5 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Kitchen alerts active</p>
            <p className="text-xs text-gray-500">
              You'll be emailed when new kitchens open in {mockUser.location}
            </p>
          </div>
        </div>

        {/* Saved matches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Saved Matches</h2>
            <span className="text-xs text-gray-500">New search →</span>
          </div>

          <div className="space-y-3">
            {mockMatches.map(match => {
              const topMatch = match.match_data?.results?.[0]
              return (
                <div key={match.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{match.label}</p>
                      {topMatch && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Top match: {topMatch.name} ({topMatch.score}% match)
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(match.created_at)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Empty state (for reference) */}
        <div className="mt-6 bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center opacity-50">
          <BookmarkX className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">This is how it looks with no saved matches yet</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-xl">
            Find my kitchen <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Profile */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{mockUser.name}</p>
              <p className="text-xs text-gray-400">{mockUser.email}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Member since {formatDate(mockUser.created_at)}</p>
        </div>
      </main>
    </div>
  )
}
