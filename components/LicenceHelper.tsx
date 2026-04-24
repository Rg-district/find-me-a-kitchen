'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { councilData, universalRequirements, getLondonBoroughs, getMajorCities } from '@/lib/council-data'
import type { CouncilData } from '@/lib/council-data'

const regionLabels: Record<string, string> = {
  london: 'London',
  england: 'England',
  scotland: 'Scotland',
  wales: 'Wales',
  'northern-ireland': 'Northern Ireland',
}

export default function LicenceHelper() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CouncilData | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const londonBoroughs = getLondonBoroughs()
  const majorCities = getMajorCities()

  const filtered = search.length > 1
    ? councilData.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : []

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fmak-licence-checklist')
      if (saved) setChecked(JSON.parse(saved))
    }
  }, [])

  const toggleCheck = (id: string) => {
    const updated = { ...checked, [id]: !checked[id] }
    setChecked(updated)
    localStorage.setItem('fmak-licence-checklist', JSON.stringify(updated))
  }

  const handleSelect = (council: CouncilData) => {
    setSelected(council)
    setSearch(council.name)
    setShowDropdown(false)
  }

  const allItems = [
    ...universalRequirements.map(r => r.id),
    ...(selected ? ['council-licence'] : []),
  ]
  const completedCount = allItems.filter(id => checked[id]).length
  const progressPct = allItems.length > 0 ? Math.round((completedCount / allItems.length) * 100) : 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Nav */}
      <nav className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">FMAK</Link>
          <Link href="/match" className="text-sm text-gray-600 hover:text-gray-900">Find a Kitchen →</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
          🍜 Free Tool
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Street Food Licence Helper</h1>
        <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
          Find out exactly what licences you need and how to apply — for any London borough or major UK city.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-20 space-y-6">

        {/* Location Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-1">Step 1 — Where do you want to trade?</h2>
          <p className="text-sm text-gray-500 mb-4">Search for your borough or city</p>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); setSelected(null) }}
              onFocus={() => setShowDropdown(true)}
              placeholder="e.g. Camden, Manchester, Bristol..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
            />
            {showDropdown && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.name}
                    onClick={() => handleSelect(c)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 text-sm border-b border-gray-50 last:border-0 flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-400">{regionLabels[c.region]}</span>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && search.length > 1 && filtered.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-sm z-20 px-4 py-3 text-sm text-gray-400">
                No results found. Try a different spelling.
              </div>
            )}
          </div>

          {/* Quick picks */}
          {!selected && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Popular areas:</p>
              <div className="flex flex-wrap gap-2">
                {['Westminster', 'Camden', 'Hackney', 'Manchester', 'Bristol', 'Birmingham', 'Edinburgh'].map(name => {
                  const council = councilData.find(c => c.name === name)
                  return council ? (
                    <button
                      key={name}
                      onClick={() => handleSelect(council)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-orange-100 hover:text-orange-700 rounded-full text-gray-600 transition-colors"
                    >
                      {name}
                    </button>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>

        {/* Universal Requirements — always shown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-1">Step 2 — Universal requirements</h2>
          <p className="text-sm text-gray-500 mb-4">Everyone needs these regardless of location</p>
          <div className="space-y-4">
            {universalRequirements.map((req, i) => (
              <div key={req.id} className="flex gap-3">
                <button
                  onClick={() => toggleCheck(req.id)}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    checked[req.id] ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-orange-400'
                  }`}
                >
                  {checked[req.id] && <span className="text-white text-xs">✓</span>}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Step {i + 1}</span>
                    <span className="font-medium text-gray-800 text-sm">{req.title}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{req.description}</p>
                  <a href={req.link} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:underline mt-1 inline-block">
                    {req.linkText} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Council-specific results */}
        {selected && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">{selected.name} — Specific Requirements</h2>
                <p className="text-sm text-gray-500">{regionLabels[selected.region]}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                selected.consent ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
              }`}>
                {selected.consent ? 'Consent System' : 'Licence System'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Licence type</p>
                <p className="text-sm font-medium text-gray-800">{selected.licenceType}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Estimated fee</p>
                <p className="text-sm font-medium text-gray-800">{selected.feeRange}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Processing time</p>
                <p className="text-sm font-medium text-gray-800">{selected.processingTime}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">System</p>
                <p className="text-sm font-medium text-gray-800">{selected.consent ? 'Consent (less formal)' : 'Full licence'}</p>
              </div>
            </div>

            {selected.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
                <p className="text-xs font-medium text-amber-700 mb-0.5">📌 Local notes</p>
                <p className="text-sm text-amber-800">{selected.notes}</p>
              </div>
            )}

            {/* Council-specific checklist item */}
            <div className="flex gap-3">
              <button
                onClick={() => toggleCheck('council-licence')}
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  checked['council-licence'] ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-orange-400'
                }`}
              >
                {checked['council-licence'] && <span className="text-white text-xs">✓</span>}
              </button>
              <div>
                <p className="font-medium text-gray-800 text-sm">Apply for your {selected.licenceType}</p>
                <p className="text-sm text-gray-500 mt-0.5">Contact {selected.name} licensing team and submit your application with all supporting documents.</p>
              </div>
            </div>

            <a
              href={selected.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-colors text-sm"
            >
              Apply to {selected.name} Council →
            </a>
          </div>
        )}

        {/* Progress tracker */}
        {allItems.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Your progress</p>
              <p className="text-sm font-bold text-gray-900">{completedCount}/{allItems.length} completed</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {progressPct === 100 && (
              <p className="text-sm text-green-600 font-medium mt-2 text-center">✅ All done — you're ready to trade!</p>
            )}
          </div>
        )}

        {/* Key documents list */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Documents you'll typically need</h3>
          <ul className="space-y-2">
            {[
              'Completed application form (from council)',
              'Proof of identity (passport or driving licence)',
              'Proof of address (utility bill, bank statement)',
              'Food Business Registration confirmation letter',
              'Level 2 Food Hygiene Certificate',
              'Public Liability Insurance certificate (min £5M)',
              'Food Safety Management plan (HACCP)',
              'Two recent passport-sized photos',
              'Details of your vehicle or stall (if applicable)',
              'Gas safety certificate (if using gas equipment)',
            ].map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                {doc}
              </li>
            ))}
          </ul>
        </div>

        {/* Licence vs Consent explainer */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Licence vs Consent — what's the difference?</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p><span className="font-medium text-purple-700">Street Trading Licence</span> — a formal legal right to trade at a specific location. Harder to get, longer process, but gives you a more secure long-term position. Can be appealed if refused.</p>
            <p><span className="font-medium text-blue-700">Street Trading Consent</span> — permission from the council to trade. Simpler process, cheaper, but the council can withdraw it more easily. Common in smaller cities and outer London boroughs.</p>
          </div>
        </div>

        {/* CTA to FMAK */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center">
          <p className="font-semibold text-gray-900 mb-1">Also need a commercial kitchen?</p>
          <p className="text-sm text-gray-500 mb-4">Find prep kitchens, dark kitchens and shared spaces near you.</p>
          <Link
            href="/match"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-6 rounded-xl transition-colors text-sm"
          >
            Find me a kitchen →
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center pb-4">
          Fees and requirements change. Always verify current requirements directly with your local council before submitting an application. This tool is for guidance only.
        </p>
      </div>
    </div>
  )
}
