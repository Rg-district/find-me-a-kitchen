'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const KITCHEN_TYPES = [
  'All Types',
  'Dark Kitchen / Ghost Kitchen',
  'Shared Commercial Kitchen',
  'Commissary Kitchen',
  'Pop-up / Event Kitchen',
  'Restaurant Kitchen (off-hours)',
]

const TERM_FILTERS = [
  { key: 'hourly', label: 'Hourly' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'longTerm', label: 'Long-term' },
]

const EQUIPMENT_OPTIONS = [
  'Commercial Oven', 'Hob / Range', 'Griddle', 'Fryer', 'Bain Marie',
  'Fridge', 'Freezer', 'Cold Room', 'Dishwasher', 'Extraction Hood',
]

interface Kitchen {
  id: string
  kitchen_name: string
  business_name: string
  kitchen_type: string
  city: string
  postcode: string
  price_per_hour: number | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  terms_available: string[]
  open_to_negotiation: boolean
  equipment: string[]
  capacity: number | null
  available_hours: string
  status: string
}

export default function BrowsePage() {
  const [kitchens, setKitchens] = useState<Kitchen[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    city: '',
    kitchenType: 'All Types',
    terms: [] as string[],
    maxPrice: '',
    equipment: [] as string[],
    negotiationOnly: false,
  })
  const [showEquipmentFilter, setShowEquipmentFilter] = useState(false)

  useEffect(() => {
    fetchKitchens()
  }, [])

  async function fetchKitchens() {
    try {
      const res = await fetch('/api/kitchens')
      const data = await res.json()
      if (data.kitchens) {
        setKitchens(data.kitchens)
      }
    } catch (err) {
      console.error('Failed to fetch kitchens:', err)
    } finally {
      setLoading(false)
    }
  }

  function toggleTerm(term: string) {
    setFilters(f => ({
      ...f,
      terms: f.terms.includes(term)
        ? f.terms.filter(t => t !== term)
        : [...f.terms, term],
    }))
  }

  function toggleEquipment(item: string) {
    setFilters(f => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter(e => e !== item)
        : [...f.equipment, item],
    }))
  }

  function clearFilters() {
    setFilters({ city: '', kitchenType: 'All Types', terms: [], maxPrice: '', equipment: [], negotiationOnly: false })
  }

  const hasActiveFilters = filters.city || filters.kitchenType !== 'All Types' || filters.terms.length > 0 || filters.equipment.length > 0 || filters.negotiationOnly

  const filtered = kitchens.filter(k => {
    if (filters.city && !k.city?.toLowerCase().includes(filters.city.toLowerCase())) return false
    if (filters.kitchenType !== 'All Types' && k.kitchen_type !== filters.kitchenType) return false
    if (filters.terms.length > 0) {
      const hasMatchingTerm = filters.terms.some(t => k.terms_available?.includes(t))
      if (!hasMatchingTerm) return false
    }
    if (filters.negotiationOnly && !k.open_to_negotiation) return false
    if (filters.equipment.length > 0) {
      const hasAllEquipment = filters.equipment.every(e => k.equipment?.includes(e))
      if (!hasAllEquipment) return false
    }
    return true
  })

  function getLowestPrice(k: Kitchen): string {
    const prices = [k.price_per_hour, k.price_per_day, k.price_per_week, k.price_per_month].filter(p => p != null) as number[]
    if (prices.length === 0) return 'Contact for pricing'
    const min = Math.min(...prices)
    if (k.price_per_hour === min) return `From £${min}/hour`
    if (k.price_per_day === min) return `From £${min}/day`
    if (k.price_per_week === min) return `From £${min}/week`
    return `From £${min}/month`
  }

  // Filter sidebar content (reused for mobile modal)
  const FilterContent = () => (
    <div className="space-y-5">
      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
        <input
          type="text"
          placeholder="e.g. London"
          value={filters.city}
          onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Kitchen Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Kitchen Type</label>
        <select
          value={filters.kitchenType}
          onChange={e => setFilters(f => ({ ...f, kitchenType: e.target.value }))}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          {KITCHEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Rental Terms */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Rental Terms</label>
        <div className="flex flex-wrap gap-2">
          {TERM_FILTERS.map(term => (
            <button
              key={term.key}
              onClick={() => toggleTerm(term.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors
                ${filters.terms.includes(term.key)
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-600'
                }`}
            >
              {term.label}
            </button>
          ))}
        </div>
      </div>

      {/* Open to Negotiation */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.negotiationOnly}
            onChange={e => setFilters(f => ({ ...f, negotiationOnly: e.target.checked }))}
            className="w-5 h-5 accent-amber-500"
          />
          <span className="text-sm font-medium text-gray-700">Open to negotiation only</span>
        </label>
      </div>

      {/* Equipment */}
      <div>
        <button
          onClick={() => setShowEquipmentFilter(!showEquipmentFilter)}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-semibold bg-white flex justify-between items-center"
        >
          <span>Equipment {filters.equipment.length > 0 && `(${filters.equipment.length})`}</span>
          <span>{showEquipmentFilter ? '▲' : '▼'}</span>
        </button>
        {showEquipmentFilter && (
          <div className="mt-2 space-y-2">
            {EQUIPMENT_OPTIONS.map(item => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.equipment.includes(item)}
                  onChange={() => toggleEquipment(item)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-sm text-gray-600">{item}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full p-2.5 bg-red-50 text-red-700 rounded-lg font-semibold text-sm"
        >
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <Link href="/">
            <img src="/logo.png" alt="Find Me a Kitchen" className="h-8 md:h-10" />
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile filter button */}
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium"
            >
              Filters {hasActiveFilters && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
            </button>
            <Link href="/list-kitchen" className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
              <span className="hidden md:inline">List Your Kitchen — Free</span>
              <span className="md:hidden">+ List</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Browse Commercial Kitchens
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            {filtered.length} kitchen{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop only */}
          <aside className="hidden md:block w-72 shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24">
              <h2 className="text-base font-bold text-gray-900 mb-5">Filters</h2>
              <FilterContent />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-16 text-gray-400">Loading kitchens...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🍳</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No kitchens found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or check back soon</p>
                <Link href="/list-kitchen" className="inline-block bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold">
                  List a kitchen
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(kitchen => (
                  <Link key={kitchen.id} href={`/kitchen/${kitchen.id}`} className="block">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer h-full">
                      {/* Type Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-block bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">
                          {kitchen.kitchen_type || 'Commercial Kitchen'}
                        </span>
                        {kitchen.open_to_negotiation && (
                          <span className="inline-block bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-medium">
                            Open to negotiation
                          </span>
                        )}
                      </div>

                      {/* Name & Location */}
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                        {kitchen.kitchen_name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {kitchen.city}{kitchen.postcode ? `, ${kitchen.postcode.split(' ')[0]}` : ''}
                      </p>

                      {/* Price */}
                      <p className="text-base font-semibold text-emerald-600 mb-3">
                        {getLowestPrice(kitchen)}
                      </p>

                      {/* Terms */}
                      {kitchen.terms_available && kitchen.terms_available.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mb-3">
                          {kitchen.terms_available.map(term => (
                            <span key={term} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium capitalize">
                              {term === 'longTerm' ? 'Long-term' : term}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Equipment Preview */}
                      {kitchen.equipment && kitchen.equipment.length > 0 && (
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {kitchen.equipment.slice(0, 3).join(' · ')}
                          {kitchen.equipment.length > 3 && ` +${kitchen.equipment.length - 3} more`}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="text-2xl text-gray-400">×</button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg font-bold"
              >
                Show {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
