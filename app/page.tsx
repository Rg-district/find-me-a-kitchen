'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Search, User, X, ChevronRight } from 'lucide-react'

export default function HomePage() {
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
          <Link href="/account/login" className="p-2 hover:bg-gray-100 rounded-lg">
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
              <Link href="/match" className="block py-3 px-4 rounded-lg hover:bg-gray-100">Find a Kitchen</Link>
              <Link href="/find-events" className="block py-3 px-4 rounded-lg hover:bg-gray-100">Market & Festival Finder</Link>
              <Link href="/markets" className="block py-3 px-4 rounded-lg hover:bg-gray-100">Markets Guide</Link>
              <Link href="/festivals" className="block py-3 px-4 rounded-lg hover:bg-gray-100">Festivals Guide</Link>
              <Link href="/blog" className="block py-3 px-4 rounded-lg hover:bg-gray-100">Guides & Resources</Link>
              <a href="mailto:listings@findmeakitchen.com" className="block py-3 px-4 rounded-lg hover:bg-gray-100">List Your Kitchen</a>
              <Link href="/faq" className="block py-3 px-4 rounded-lg hover:bg-gray-100">FAQ</Link>
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

          {/* Market & Festival Finder */}
          <Link 
            href="/find-events"
            className="block mt-8 bg-white rounded-2xl p-5 border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl">
                🎪
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">Market & Festival Finder</h2>
                <p className="text-sm text-gray-500">Find events to trade at near you</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Guides */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Guides & Resources
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/markets"
                className="flex flex-col p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🏪</span>
                  <span className="text-sm font-bold text-gray-900">UK Markets</span>
                </div>
                <span className="text-xs text-gray-500">Food markets & halls</span>
                <span className="text-xs text-emerald-600 font-medium mt-1">13 locations</span>
              </Link>
              <Link
                href="/festivals"
                className="flex flex-col p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎪</span>
                  <span className="text-sm font-bold text-gray-900">UK Festivals</span>
                </div>
                <span className="text-xs text-gray-500">Festival trading guide</span>
                <span className="text-xs text-emerald-600 font-medium mt-1">13 events</span>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-10 space-y-3">
            <a
              href="mailto:listings@findmeakitchen.com?subject=List My Kitchen on FMAK"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <div className="font-semibold text-gray-900">List your kitchen</div>
                  <div className="text-sm text-gray-500">Free to list · Email us at listings@findmeakitchen.com</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </a>

            <Link
              href="/resources"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-semibold text-gray-900">Resources & guides</div>
                  <div className="text-sm text-gray-500">Starting a food business · Equipment · Regulations</div>
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
            <Link href="/match" className="hover:text-gray-700">Find Kitchen</Link>
            <Link href="/markets" className="hover:text-gray-700">Markets</Link>
            <Link href="/festivals" className="hover:text-gray-700">Festivals</Link>
            <Link href="/faq" className="hover:text-gray-700">FAQ</Link>
          </div>
          <p className="text-center text-xs text-gray-400">
            © 2026 Find Me a Kitchen
          </p>
        </div>
      </footer>
    </div>
  )
}
