'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Search, MapPin, Building2, UtensilsCrossed, Coffee, Truck, ChefHat } from 'lucide-react'

const CATEGORIES = [
  { name: 'Dark Kitchens', icon: Building2, count: 24 },
  { name: 'Shared Kitchens', icon: UtensilsCrossed, count: 18 },
  { name: 'Cafes & Restaurants', icon: Coffee, count: 12 },
  { name: 'Food Production', icon: ChefHat, count: 8 },
  { name: 'Mobile Units', icon: Truck, count: 6 },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'rent' | 'buy'>('rent')
  const [location, setLocation] = useState('')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Navigation */}
      <nav className="px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button className="p-2 -ml-2">
            <Menu className="w-6 h-6 text-gray-800" />
          </button>
          <div className="text-xl font-bold text-gray-900">FMAK</div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </nav>

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

          {/* Dark Search Card */}
          <div className="bg-gray-900 rounded-2xl p-5 shadow-xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('rent')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'rent'
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Rent
              </button>
              <button
                onClick={() => setActiveTab('buy')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'buy'
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Buy
              </button>
            </div>

            {/* Location Input */}
            <div className="relative mb-4">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter city or postcode"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Search Button */}
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
              <Search className="w-5 h-5" />
              Search kitchens
            </button>
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
              href="/list"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors"
            >
              <div>
                <div className="font-semibold text-gray-900">List your kitchen</div>
                <div className="text-sm text-gray-500">Free to list · Reach operators across the UK</div>
              </div>
              <div className="text-emerald-500 text-xl">→</div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 bg-white/50">
        <div className="max-w-lg mx-auto px-4">
          <p className="text-center text-xs text-gray-400">
            © 2026 Find Me a Kitchen
          </p>
        </div>
      </footer>
    </div>
  )
}

