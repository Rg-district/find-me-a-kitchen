'use client'

import { useState } from 'react'
import type { MatchResult, UserRequirements } from './api/match/route'

const steps = ['Business', 'Kitchen Needs', 'Location & Budget', 'Results']

const cities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Glasgow', 'Liverpool', 'Sheffield', 'Newcastle']

const equipmentOptions = ['commercial oven', 'industrial fryer', 'griddle', 'wok burners', 'tandoor', 'pizza oven', 'mixer', 'blast chiller', 'cold room', 'sous vide', 'dishwasher']

const businessTypes = ['Ghost Kitchen / Delivery Brand', 'Street Food', 'Catering Company', 'Bakery / Pastry', 'Meal Prep', 'Food Producer / FMCG', 'Private Dining', 'Pop-up / Events', 'Other']

type FormData = {
  businessType: string
  teamSize: number
  city: string
  budget: number
  budgetType: 'hourly' | 'monthly'
  equipment: string[]
  foodTypes: string
  operatingHours: string[]
  storage: string[]
  deliveryPlatforms: string[]
  halal: boolean
  organic: boolean
  vegan: boolean
}

const defaultForm: FormData = {
  businessType: '',
  teamSize: 1,
  city: 'London',
  budget: 1000,
  budgetType: 'monthly',
  equipment: [],
  foodTypes: '',
  operatingHours: [],
  storage: [],
  deliveryPlatforms: [],
  halal: false,
  organic: false,
  vegan: false,
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all"
      style={{ background: value ? '#1a1a1a' : 'white', color: value ? 'white' : '#6b7280', borderColor: value ? '#1a1a1a' : '#e5e7eb' }}>
      {value ? '✓ ' : ''}{label}
    </button>
  )
}

function MultiSelect({ options, selected, onChange, label }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; label?: string }) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} onClick={() => toggle(opt)}
          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
          style={{ background: selected.includes(opt) ? '#1a1a1a' : 'white', color: selected.includes(opt) ? 'white' : '#6b7280', borderColor: selected.includes(opt) ? '#1a1a1a' : '#e5e7eb' }}>
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function Home() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const update = (field: keyof FormData, value: any) => setForm(p => ({ ...p, [field]: value }))

  const runMatch = async () => {
    setLoading(true)
    setStep(3)
    try {
      const req: UserRequirements = {
        businessType: form.businessType,
        teamSize: form.teamSize,
        city: form.city,
        budget: form.budget,
        budgetType: form.budgetType,
        equipment: form.equipment,
        foodTypes: [form.foodTypes],
        operatingHours: form.operatingHours,
        storage: form.storage,
        deliveryPlatforms: form.deliveryPlatforms,
        halal: form.halal,
        organic: form.organic,
        vegan: form.vegan,
      }
      const res = await fetch('/api/match', { method: 'POST', body: JSON.stringify(req), headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      setResults(data.results || [])
    } catch { setResults([]) }
    setLoading(false)
  }

  const accent = '#d4a843'

  return (
    <div className="min-h-screen" style={{ background: '#f8f7f4' }}>
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: '#1a1a1a' }}>🔪</div>
            <div>
              <div className="font-bold text-sm tracking-tight">Find Me a Kitchen</div>
              <div className="text-xs text-gray-500">AI-powered commercial kitchen matching</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">🇬🇧 UK Only</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {step < 3 ? (
          <>
            {/* Hero */}
            {step === 0 && (
              <div className="text-center mb-12 fade-up">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                  Find your perfect<br /><span style={{ color: accent }}>commercial kitchen</span>
                </h1>
                <p className="text-gray-500 text-lg">Tell us about your business. We'll match you to the right kitchen in seconds.</p>
              </div>
            )}

            {/* Progress */}
            <div className="flex items-center gap-2 mb-10">
              {steps.slice(0, 3).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{ background: i <= step ? '#1a1a1a' : '#e5e7eb', color: i <= step ? 'white' : '#9ca3af' }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className="text-sm font-medium" style={{ color: i === step ? '#1a1a1a' : '#9ca3af' }}>{s}</span>
                  </div>
                  {i < 2 && <div className="flex-1 h-px w-8 bg-gray-200" />}
                </div>
              ))}
            </div>

            {/* Step 0: Business */}
            {step === 0 && (
              <div className="fade-up space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">What type of food business are you?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {businessTypes.map(type => (
                      <button key={type} onClick={() => update('businessType', type)}
                        className="p-3 rounded-xl border text-sm font-medium text-left transition-all"
                        style={{ background: form.businessType === type ? '#1a1a1a' : 'white', color: form.businessType === type ? 'white' : '#374151', borderColor: form.businessType === type ? '#1a1a1a' : '#e5e7eb' }}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Team size (including you)</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min={1} max={20} value={form.teamSize} onChange={e => update('teamSize', +e.target.value)} className="flex-1 accent-gray-900" />
                    <span className="text-2xl font-bold w-12 text-center">{form.teamSize}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Special requirements</label>
                  <div className="flex gap-3 flex-wrap">
                    <Toggle label="Halal certified" value={form.halal} onChange={v => update('halal', v)} />
                    <Toggle label="Organic certified" value={form.organic} onChange={v => update('organic', v)} />
                    <Toggle label="Vegan-friendly" value={form.vegan} onChange={v => update('vegan', v)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Kitchen Needs */}
            {step === 1 && (
              <div className="fade-up space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Equipment you need</label>
                  <MultiSelect options={equipmentOptions} selected={form.equipment} onChange={v => update('equipment', v)} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Storage required</label>
                  <MultiSelect options={['dry', 'cold', 'frozen']} selected={form.storage} onChange={v => update('storage', v)} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">When do you need to operate?</label>
                  <MultiSelect options={['morning', 'afternoon', 'evening', 'overnight']} selected={form.operatingHours} onChange={v => update('operatingHours', v)} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Delivery platforms you use</label>
                  <MultiSelect options={['Deliveroo', 'UberEats', 'JustEat', 'Own fleet']} selected={form.deliveryPlatforms} onChange={v => update('deliveryPlatforms', v)} />
                </div>
              </div>
            )}

            {/* Step 2: Location & Budget */}
            {step === 2 && (
              <div className="fade-up space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">City</label>
                  <div className="grid grid-cols-5 gap-2">
                    {cities.map(city => (
                      <button key={city} onClick={() => update('city', city)}
                        className="py-2 px-3 rounded-lg border text-sm font-medium transition-all"
                        style={{ background: form.city === city ? '#1a1a1a' : 'white', color: form.city === city ? 'white' : '#374151', borderColor: form.city === city ? '#1a1a1a' : '#e5e7eb' }}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Budget</label>
                  <div className="flex gap-3 mb-4">
                    <button onClick={() => update('budgetType', 'monthly')}
                      className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                      style={{ background: form.budgetType === 'monthly' ? '#1a1a1a' : 'white', color: form.budgetType === 'monthly' ? 'white' : '#6b7280', borderColor: form.budgetType === 'monthly' ? '#1a1a1a' : '#e5e7eb' }}>
                      Monthly
                    </button>
                    <button onClick={() => update('budgetType', 'hourly')}
                      className="px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                      style={{ background: form.budgetType === 'hourly' ? '#1a1a1a' : 'white', color: form.budgetType === 'hourly' ? 'white' : '#6b7280', borderColor: form.budgetType === 'hourly' ? '#1a1a1a' : '#e5e7eb' }}>
                      Hourly
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <input type="range"
                      min={form.budgetType === 'monthly' ? 300 : 8}
                      max={form.budgetType === 'monthly' ? 5000 : 50}
                      step={form.budgetType === 'monthly' ? 50 : 1}
                      value={form.budget}
                      onChange={e => update('budget', +e.target.value)}
                      className="flex-1 accent-gray-900" />
                    <span className="text-2xl font-bold w-28 text-center">£{form.budget.toLocaleString()}{form.budgetType === 'hourly' ? '/hr' : '/mo'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-10">
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-6 py-3 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                  Back
                </button>
              ) : <div />}
              {step < 2 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.businessType}
                  className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: '#1a1a1a' }}>
                  Continue →
                </button>
              ) : (
                <button onClick={runMatch}
                  className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: `linear-gradient(135deg, #1a1a1a, #374151)` }}>
                  Find My Kitchen 🔍
                </button>
              )}
            </div>
          </>
        ) : (
          // Results
          <div className="fade-up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Your Matched Kitchens</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {loading ? 'Finding your matches...' : `${results.length} kitchens matched in ${form.city}`}
                </p>
              </div>
              <button onClick={() => { setStep(0); setResults([]) }}
                className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50 transition-all">
                ← Start Over
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 spin mx-auto mb-4" />
                <p className="text-gray-500">Matching you to the best kitchens...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-2">No exact matches found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your budget or location.</p>
                <button onClick={() => setStep(0)} className="mt-6 px-6 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#1a1a1a' }}>
                  Adjust Search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, i) => {
                  const k = result.kitchen
                  const isTop = i === 0
                  const isExpanded = expanded === k.id

                  return (
                    <div key={k.id}
                      className="bg-white rounded-2xl border overflow-hidden transition-all cursor-pointer"
                      style={{ borderColor: isTop ? '#d4a843' : '#e5e7eb', boxShadow: isTop ? '0 0 0 1px #d4a843' : 'none' }}
                      onClick={() => setExpanded(isExpanded ? null : k.id)}>

                      {isTop && (
                        <div className="px-6 py-2 text-xs font-semibold" style={{ background: '#d4a843', color: 'white' }}>
                          ⭐ Best Match
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-gray-900">{k.name}</h3>
                              {k.verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">✓ Verified</span>}
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{k.area}, {k.city} · {k.postcode}</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{k.description}</p>
                          </div>

                          {/* Match score */}
                          <div className="text-center flex-shrink-0">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 mb-1"
                              style={{ borderColor: result.compatibilityPct >= 80 ? '#22c55e' : result.compatibilityPct >= 60 ? '#d4a843' : '#e5e7eb', color: result.compatibilityPct >= 80 ? '#22c55e' : result.compatibilityPct >= 60 ? '#d4a843' : '#6b7280' }}>
                              {result.compatibilityPct}%
                            </div>
                            <div className="text-xs text-gray-500">match</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                          <div>
                            <span className="text-xs text-gray-500">Price</span>
                            <div className="text-sm font-semibold">
                              {k.pricePerMonth ? `£${k.pricePerMonth.toLocaleString()}/mo` : ''}
                              {k.pricePerHour > 0 ? ` · £${k.pricePerHour}/hr` : ''}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Capacity</span>
                            <div className="text-sm font-semibold">Up to {k.maxCapacity} people</div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Rating</span>
                            <div className="text-sm font-semibold">⭐ {k.rating} ({k.reviewCount})</div>
                          </div>
                          <div className="ml-auto">
                            <span className="text-xs text-gray-400">{isExpanded ? 'Less ↑' : 'More ↓'}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-5 pt-5 border-t border-gray-50 space-y-4">
                            {result.matchReasons.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-700 mb-2">✓ Why it matches</p>
                                <ul className="space-y-1">
                                  {result.matchReasons.map((r, i) => <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-green-500">✓</span>{r}</li>)}
                                </ul>
                              </div>
                            )}

                            {result.gaps.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-amber-700 mb-2">⚠ Things to check</p>
                                <ul className="space-y-1">
                                  {result.gaps.map((g, i) => <li key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-amber-500">!</span>{g}</li>)}
                                </ul>
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">Equipment available</p>
                              <div className="flex flex-wrap gap-1.5">
                                {k.equipment.map(e => (
                                  <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-600">{e}</span>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                              <a href={`mailto:${k.email}`}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white text-center transition-all"
                                style={{ background: '#1a1a1a' }}>
                                Enquire Now →
                              </a>
                              <a href={`https://${k.website}`} target="_blank" rel="noopener"
                                className="px-6 py-3 rounded-xl text-sm font-semibold border text-gray-700 hover:bg-gray-50 transition-all">
                                Visit Website
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div className="text-center pt-4 text-sm text-gray-400">
                  Not finding the right fit? <a href="mailto:hello@findmeakitchen.co.uk" className="underline">Tell us what you need</a> and we&apos;ll source it for you.
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
