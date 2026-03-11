'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Search, MapPin, Building2, UtensilsCrossed, Coffee, Truck, ChefHat, User, X, ChevronRight, Sparkles } from 'lucide-react'

const CATEGORIES = [
  { name: 'Dark Kitchens', icon: Building2, count: 24 },
  { name: 'Shared Kitchens', icon: UtensilsCrossed, count: 18 },
  { name: 'Cafes & Restaurants', icon: Coffee, count: 12 },
  { name: 'Food Production', icon: ChefHat, count: 8 },
  { name: 'Mobile Units', icon: Truck, count: 6 },
]

export default function HomePage() {
  const [location, setLocation] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Navigation */}
      <nav className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => setMenuOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6 text-gray-800" />
          </button>
          <Link href="/" className="text-xl font-bold text-gray-900">FMAK</Link>
          <Link href="/account" className="p-2 hover:bg-gray-100 rounded-lg">
            <User className="w-6 h-6 text-gray-800" />
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setMenuOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-1">
              <Link href="/browse" className="block py-3 px-4 rounded-lg hover:bg-gray-100">Browse Kitchens</Link>
              <Link href="/list-kitchen" className="block py-3 px-4 rounded-lg hover:bg-gray-100">List Your Kitchen</Link>
              <Link href="/faq" className="block py-3 px-4 rounded-lg hover:bg-gray-100">FAQ</Link>
              <hr className="my-3" />
              <Link href="/account" className="block py-3 px-4 rounded-lg bg-emerald-500 text-white text-center font-semibold">
                Sign Up / Log In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <main className="px-4 pt-8 pb-12">
        <div className="max-w-lg mx-auto">
          {/* Headline - Bold Serif */}
          <h1 
            className="text-3xl md:text-4xl text-gray-900 text-center mb-3 leading-tight"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
          >
            Find your perfect kitchen space
          </h1>
          <p className="text-gray-600 text-center text-sm mb-8">
            The UK's marketplace for commercial kitchens
          </p>

          {/* Kitchen Matcher CTA */}
          <Link 
            href="/match"
            className="block bg-gray-900 rounded-2xl p-6 shadow-xl hover:bg-gray-800 transition-colors group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Find Your Perfect Kitchen</h2>
                <p className="text-gray-400 text-sm">Answer a few questions, get matched instantly</p>
              </div>
            </div>
            <div className="bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
              Start Matching
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Or Browse Directly */}
          <div className="mt-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Or search by location..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full pl-10 pr-24 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <Link 
                href={`/browse?location=${location}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Browse
              </Link>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Browse by type
            </h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.name}
                  href={`/browse?type=${cat.name}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
                >
                  <cat.icon className="w-4 h-4 text-gray-500 group-hover:text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-10 space-y-3">
            <Link
              href="/list-kitchen"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <div className="font-semibold text-gray-900">List your kitchen</div>
                  <div className="text-sm text-gray-500">Free to list · Reach operators across the UK</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link
              href="/account"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="font-semibold text-gray-900">Sign up or log in</div>
                  <div className="text-sm text-gray-500">Save kitchens · Get alerts · Manage listings</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link
              href="/browse"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <div className="font-semibold text-gray-900">Browse all kitchens</div>
                  <div className="text-sm text-gray-500">View all available spaces</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 bg-white/50">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-center gap-6 text-xs text-gray-500 mb-3">
            <Link href="/browse" className="hover:text-gray-700">Browse</Link>
            <Link href="/list-kitchen" className="hover:text-gray-700">List Kitchen</Link>
            <Link href="/faq" className="hover:text-gray-700">FAQ</Link>
            <Link href="/contact" className="hover:text-gray-700">Contact</Link>
          </div>
          <p className="text-center text-xs text-gray-400">
            © 2026 Find Me a Kitchen
          </p>
        </div>
      </footer>
    </div>
  )
}
