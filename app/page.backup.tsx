'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import type { MatchResult, UserRequirements } from '@/lib/types'

type View = 'landing' | 'chat' | 'results'

const businessTypes = [
  { label: '🏭 Ghost Kitchen', value: 'Ghost Kitchen / Delivery Brand' },
  { label: '🥐 Bakery', value: 'Bakery / Pastry' },
  { label: '🚐 Street Food', value: 'Street Food' },
  { label: '🍱 Meal Prep', value: 'Meal Prep' },
  { label: '🎪 Events & Pop-ups', value: 'Pop-up / Events' },
  { label: '🍽 Catering', value: 'Catering Company' },
  { label: '🏠 Private Dining', value: 'Private Dining' },
  { label: '📦 Food Producer', value: 'Food Producer / FMCG' },
]

const cities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Glasgow', 'Liverpool', 'Sheffield', 'Newcastle']

const budgetRanges = [
  { label: 'Under £500', value: 499, type: 'monthly' as const },
  { label: '£500 – £1,000', value: 1000, type: 'monthly' as const },
  { label: '£1,000 – £2,000', value: 2000, type: 'monthly' as const },
  { label: '£2,000+', value: 5000, type: 'monthly' as const },
  { label: 'Hourly rate', value: 25, type: 'hourly' as const },
]

const equipmentOptions = ['commercial oven', 'industrial fryer', 'griddle', 'wok burners', 'tandoor', 'pizza oven', 'mixer', 'blast chiller', 'cold room', 'sous vide']

export default function Home() {
  const [view, setView] = useState<View>('landing')
  const [businessType, setBusinessType] = useState('')
  const [city, setCity] = useState('London')
  const [budget, setBudget] = useState(1000)
  const [budgetType, setBudgetType] = useState<'monthly' | 'hourly'>('monthly')
  const [equipment, setEquipment] = useState<string[]>([])
  const [storage, setStorage] = useState<string[]>([])
  const [shifts, setShifts] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [halal, setHalal] = useState(false)
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<MatchResult | null>(null)
  const [chatStep, setChatStep] = useState(1)

  const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const runMatch = async () => {
    setLoading(true)
    setView('results')
    try {
      const req: UserRequirements = {
        businessType, teamSize: 3, city, budget, budgetType,
        equipment, foodTypes: [businessType], operatingHours: shifts,
        storage, deliveryPlatforms: platforms, halal,
      }
      const res = await fetch('/api/match', {
        method: 'POST', body: JSON.stringify(req),
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      const r = data.results || []
      setResults(r)
      if (r.length > 0) setSelected(r[0])
    } catch { setResults([]) }
    setLoading(false)
  }

  const pill = (label: string, active: boolean, onClick: () => void, small = false) => (
    <button onClick={onClick}
      className={`border rounded-full font-medium transition-all duration-150 ${small ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2.5'}`}
      style={{ background: active ? '#111' : 'white', color: active ? 'white' : '#374151', borderColor: active ? '#111' : '#e5e7eb' }}>
      {label}
    </button>
  )

  // ─── LANDING ───
  if (view === 'landing') return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-12 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <a href="/"><img src="/logo.png" alt="Find Me a Kitchen" className="h-10" /></a>
        <div className="flex gap-8">
          <a href="/browse" className="text-sm text-gray-500 font-medium cursor-pointer hover:text-gray-900 transition-colors">Browse</a>
          <a href="/list-kitchen" className="text-sm text-gray-500 font-medium cursor-pointer hover:text-gray-900 transition-colors">List your kitchen</a>
          <a href="/faq" className="text-sm text-gray-500 font-medium cursor-pointer hover:text-gray-900 transition-colors">How it works</a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 cursor-pointer hover:text-gray-900 transition-colors">Sign in</span>
          <button onClick={() => setView('chat')}
            className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-black transition-colors">
            Find a Kitchen
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-16 pb-20 text-center fade-up">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full border border-green-200 mb-8">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full pulse inline-block" />
          🇬🇧 AI-powered · 15 cities · 50+ kitchens
        </div>

        <h1 className="text-6xl font-extrabold tracking-tight leading-tight mb-5" style={{ letterSpacing: '-3px' }}>
          Find your perfect<br /><span className="text-green-600">kitchen space.</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-12 max-w-lg mx-auto">
          Tell us about your food business. We&apos;ll match you to the ideal kitchen in seconds — no browsing, no guessing.
        </p>

        {/* Intake widget */}
        <div className="max-w-xl mx-auto bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden text-left">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-sm">🔪</div>
            <div>
              <div className="text-sm font-bold">Kitchen Finder AI</div>
              <div className="text-xs text-green-600 font-medium">● Online — ready to match you</div>
            </div>
          </div>
          <div className="px-5 pt-5 pb-2 text-sm font-semibold text-gray-900">What type of food business are you running?</div>
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            {businessTypes.map(b => (
              <button key={b.value} onClick={() => setBusinessType(b.value)}
                className="border rounded-full text-sm font-medium px-4 py-2 transition-all"
                style={{ background: businessType === b.value ? '#111' : 'white', color: businessType === b.value ? 'white' : '#374151', borderColor: businessType === b.value ? '#111' : '#e5e7eb' }}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="px-5 pb-5">
            <button onClick={() => { if (businessType) { setChatStep(2); setView('chat') } }}
              disabled={!businessType}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 hover:bg-black">
              Continue →
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-14 mt-16 pt-10 border-t border-gray-100">
          {[['50+','Kitchens listed'],['15','UK cities'],['2min','Avg to match'],['100%','Free to use']].map(([n, l]) => (
            <div key={l}>
              <div className="text-2xl font-extrabold tracking-tight">{n}</div>
              <div className="text-xs text-gray-400 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ─── CHAT ───
  if (view === 'chat') return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-12 py-4 border-b border-gray-100 bg-white/95 backdrop-blur z-50">
        <a href="/"><img src="/logo.png" alt="Find Me a Kitchen" className="h-10" /></a>
        <button onClick={() => setView('landing')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Back</button>
      </nav>

      <div className="grid grid-cols-2 min-h-[calc(100vh-62px)]" style={{ borderTop: '1px solid #f0f0f0' }}>
        {/* Left */}
        <div className="px-14 py-12 flex flex-col">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Step {chatStep === 2 ? '2' : '3'} of 3 — {chatStep === 2 ? 'Location & Budget' : 'Kitchen Needs'}
          </div>
          <div className="h-0.5 bg-gray-100 rounded mb-10">
            <div className="h-full bg-gray-900 rounded transition-all duration-500" style={{ width: chatStep === 2 ? '66%' : '99%' }} />
          </div>

          {chatStep === 2 && (
            <div className="fade-up space-y-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1.5">Where are you based?</h2>
                <p className="text-sm text-gray-500 mb-5">We&apos;ll find kitchens in your city first, then nearby if needed.</p>
                <div className="flex flex-wrap gap-2">
                  {cities.map(c => pill(c, city === c, () => setCity(c)))}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1.5">What&apos;s your monthly budget?</h2>
                <p className="text-sm text-gray-500 mb-5">We&apos;ll show options above and below if you&apos;re flexible.</p>
                <div className="flex flex-wrap gap-2">
                  {budgetRanges.map(b => pill(b.label, budget === b.value && budgetType === b.type, () => { setBudget(b.value); setBudgetType(b.type) }))}
                </div>
              </div>
              <button onClick={() => setChatStep(3)}
                className="bg-gray-900 text-white px-8 py-3.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:bg-black transition-colors">
                Continue → <span className="opacity-60">(almost there)</span>
              </button>
            </div>
          )}

          {chatStep === 3 && (
            <div className="fade-up space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1.5">Equipment you need?</h2>
                <p className="text-sm text-gray-500 mb-4">Select all that apply — we&apos;ll filter for you.</p>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map(e => pill(e, equipment.includes(e), () => toggleArr(equipment, setEquipment, e)))}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-4">Any special requirements?</h2>
                <div className="flex flex-wrap gap-2">
                  {['dry storage', 'cold storage', 'frozen storage'].map(s => {
                    const v = s.replace(' storage','')
                    return pill(s, storage.includes(v), () => toggleArr(storage, setStorage, v))
                  })}
                  {[['Deliveroo','Deliveroo'], ['UberEats','UberEats'], ['JustEat','JustEat']].map(([l, v]) =>
                    pill(l, platforms.includes(v), () => toggleArr(platforms, setPlatforms, v))
                  )}
                  {pill('Halal certified', halal, () => setHalal(!halal))}
                </div>
              </div>
              <button onClick={runMatch}
                className="bg-gray-900 text-white px-10 py-3.5 rounded-full text-sm font-bold hover:bg-black transition-colors">
                Find my kitchen 🔍
              </button>
            </div>
          )}
        </div>

        {/* Right preview */}
        <div className="bg-gray-50 px-10 py-12 border-l border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Your matches loading...</div>
          <div className="space-y-3">
            {[
              { name: 'Karma Kitchen Bermondsey', loc: 'SE1 · London', price: '£1,500/mo', match: '94%', active: true },
              { name: 'East End Food Hub', loc: 'E8 · Hackney', price: '£650/mo', match: '—', active: false },
              { name: 'Mission Kitchen W12', loc: 'W12 · White City', price: '£800/mo', match: '—', active: false },
            ].map(k => (
              <div key={k.name} className="bg-white rounded-2xl border p-4 transition-all"
                style={{ borderColor: k.active ? '#111' : '#f0f0f0', opacity: k.active ? 1 : 0.4 }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-bold">{k.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{k.loc}</div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: k.active ? '#16a34a' : '#9ca3af' }}>{k.match}</span>
                </div>
                <div className="text-sm font-bold">{k.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ─── RESULTS ───
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-12 py-4 border-b border-gray-100 bg-white/95 backdrop-blur z-50 sticky top-0">
        <a href="/"><img src="/logo.png" alt="Find Me a Kitchen" className="h-10" /></a>
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('landing'); setResults([]); setSelected(null) }}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← New search</button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex gap-2 flex-wrap">
            {city && <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full">{city}</span>}
            {businessType && <span className="bg-white text-gray-600 border border-gray-200 text-xs font-medium px-3 py-1.5 rounded-full">{businessType.split('/')[0].trim()} ✕</span>}
          </div>
          <span className="text-sm text-gray-400 ml-2">{loading ? 'Matching...' : `${results.length} kitchens matched`}</span>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-62px)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-100 overflow-y-auto flex-shrink-0">
          <div className="px-5 pt-5 pb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Your matches</div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 spin" />
            </div>
          ) : results.map((r, i) => (
            <div key={r.kitchen.id} onClick={() => setSelected(r)}
              className="flex gap-3 px-5 py-3.5 cursor-pointer transition-all border-l-2"
              style={{ background: selected?.kitchen.id === r.kitchen.id ? '#fafafa' : 'white', borderLeftColor: selected?.kitchen.id === r.kitchen.id ? '#111' : 'transparent' }}>
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                {['🏭','🌿','🏢','🌆','🏗'][i] || '🍴'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{r.kitchen.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.kitchen.area} · {r.kitchen.city}</div>
                <div className="text-xs font-bold mt-1">
                  {r.kitchen.pricePerMonth ? `£${r.kitchen.pricePerMonth.toLocaleString()}/mo` : `£${r.kitchen.pricePerHour}/hr`}
                </div>
                <div className="text-xs font-bold mt-0.5" style={{ color: i === 0 ? '#16a34a' : '#9ca3af' }}>
                  {i === 0 ? `⭐ ${r.compatibilityPct}% match` : `${r.compatibilityPct}% match`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 spin" />
              <p className="text-gray-500 text-sm">Finding your perfect match...</p>
            </div>
          ) : !selected ? (
            <div className="flex items-center justify-center h-full text-gray-400">No results found. Try adjusting your search.</div>
          ) : (
            <div className="max-w-2xl fade-up">
              {/* Header image */}
              <div className="h-52 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
                <span className="text-5xl">🏭</span>
                <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1.5 text-xs font-bold">
                  ⭐ {selected.compatibilityPct}% match
                </div>
                {selected.kitchen.verified && (
                  <div className="absolute top-4 right-4 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
                    ✓ Verified
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight mb-1">{selected.kitchen.name}</h2>
              <p className="text-sm text-gray-500 mb-6">📍 {selected.kitchen.area}, {selected.kitchen.city} · {selected.kitchen.postcode}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  ['Monthly', selected.kitchen.pricePerMonth ? `£${selected.kitchen.pricePerMonth.toLocaleString()}` : '—'],
                  ['Capacity', `${selected.kitchen.maxCapacity} people`],
                  ['Rating', `⭐ ${selected.kitchen.rating}`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{l}</div>
                    <div className="text-lg font-extrabold tracking-tight">{v}</div>
                  </div>
                ))}
              </div>

              {/* Match reasons */}
              {selected.matchReasons.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
                  <div className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3">✓ Why it&apos;s your match</div>
                  {selected.matchReasons.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
                      <span className="text-green-600 font-bold text-xs">✓</span>{r}
                    </div>
                  ))}
                </div>
              )}

              {/* Gaps */}
              {selected.gaps.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">⚠ Things to check</div>
                  {selected.gaps.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 mb-1.5">
                      <span className="text-amber-500 font-bold text-xs">!</span>{g}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-600 leading-relaxed mb-5">{selected.kitchen.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-7">
                {selected.kitchen.features.map(f => (
                  <span key={f} className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: '#f4f3f0', color: '#374151' }}>{f}</span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <a href={`mailto:${selected.kitchen.email}`}
                  className="flex-1 bg-gray-900 text-white text-sm font-bold py-4 rounded-xl text-center hover:bg-black transition-colors">
                  Enquire Now →
                </a>
                <a href={`https://${selected.kitchen.website}`} target="_blank" rel="noopener"
                  className="px-6 py-4 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                  Website
                </a>
                <button className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-lg hover:bg-gray-50 transition-colors">🤍</button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-6">
                Not finding the right fit?{' '}
                <a href="mailto:hello@findmeakitchen.com" className="underline hover:text-gray-600">Tell us what you need</a>
                {' '}and we&apos;ll source it for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// v2 hybrid redesign Mon Mar  2 20:16:09 GMT 2026
