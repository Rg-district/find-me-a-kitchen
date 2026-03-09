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

  // Filter kitchens
  const filtered = kitchens.filter(k => {
    // City filter
    if (filters.city && !k.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false
    }
    // Type filter
    if (filters.kitchenType !== 'All Types' && k.kitchen_type !== filters.kitchenType) {
      return false
    }
    // Terms filter
    if (filters.terms.length > 0) {
      const hasMatchingTerm = filters.terms.some(t => k.terms_available?.includes(t))
      if (!hasMatchingTerm) return false
    }
    // Negotiation filter
    if (filters.negotiationOnly && !k.open_to_negotiation) {
      return false
    }
    // Equipment filter
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

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 20,
    transition: 'box-shadow 0.2s, transform 0.2s',
    cursor: 'pointer',
  }

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    background: '#f3f4f6',
    color: '#374151',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 20, fontWeight: 700, color: '#10b981', textDecoration: 'none' }}>
            Find Me a Kitchen
          </Link>
          <Link href="/list-kitchen" style={{
            background: '#10b981', color: '#fff', padding: '10px 20px',
            borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}>
            List Your Kitchen — Free
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            Browse Commercial Kitchens
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16 }}>
            {filtered.length} kitchen{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
          {/* Filters Sidebar */}
          <aside>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, position: 'sticky', top: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Filters</h2>

              {/* City */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. London"
                  value={filters.city}
                  onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Kitchen Type */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Kitchen Type
                </label>
                <select
                  value={filters.kitchenType}
                  onChange={e => setFilters(f => ({ ...f, kitchenType: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                    borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#fff',
                  }}
                >
                  {KITCHEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Rental Terms */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                  Rental Terms
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TERM_FILTERS.map(term => (
                    <button
                      key={term.key}
                      onClick={() => toggleTerm(term.key)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                        border: filters.terms.includes(term.key) ? '1px solid #10b981' : '1px solid #d1d5db',
                        background: filters.terms.includes(term.key) ? '#ecfdf5' : '#fff',
                        color: filters.terms.includes(term.key) ? '#065f46' : '#374151',
                        cursor: 'pointer',
                      }}
                    >
                      {term.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open to Negotiation */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filters.negotiationOnly}
                    onChange={e => setFilters(f => ({ ...f, negotiationOnly: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: '#f59e0b' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                    Open to negotiation only
                  </span>
                </label>
              </div>

              {/* Equipment */}
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => setShowEquipmentFilter(!showEquipmentFilter)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                    borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#fff',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>Equipment {filters.equipment.length > 0 && `(${filters.equipment.length})`}</span>
                  <span>{showEquipmentFilter ? '▲' : '▼'}</span>
                </button>
                {showEquipmentFilter && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {EQUIPMENT_OPTIONS.map(item => (
                      <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={filters.equipment.includes(item)}
                          onChange={() => toggleEquipment(item)}
                          style={{ width: 16, height: 16, accentColor: '#10b981' }}
                        />
                        <span style={{ fontSize: 13, color: '#374151' }}>{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {(filters.city || filters.kitchenType !== 'All Types' || filters.terms.length > 0 || filters.equipment.length > 0 || filters.negotiationOnly) && (
                <button
                  onClick={() => setFilters({ city: '', kitchenType: 'All Types', terms: [], maxPrice: '', equipment: [], negotiationOnly: false })}
                  style={{
                    width: '100%', padding: '10px', border: 'none', borderRadius: 8,
                    background: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* Results */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
                Loading kitchens...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                  No kitchens found
                </h3>
                <p style={{ color: '#6b7280', marginBottom: 20 }}>
                  Try adjusting your filters or check back soon
                </p>
                <Link href="/list-kitchen" style={{
                  display: 'inline-block', background: '#10b981', color: '#fff',
                  padding: '12px 24px', borderRadius: 8, fontWeight: 600, textDecoration: 'none',
                }}>
                  List a kitchen
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {filtered.map(kitchen => (
                  <Link
                    key={kitchen.id}
                    href={`/kitchen/${kitchen.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={cardStyle}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.transform = 'none'
                      }}
                    >
                      {/* Kitchen Type Tag */}
                      <div style={{ marginBottom: 12 }}>
                        <span style={tagStyle}>{kitchen.kitchen_type || 'Commercial Kitchen'}</span>
                        {kitchen.open_to_negotiation && (
                          <span style={{ ...tagStyle, background: '#fef3c7', color: '#92400e', marginLeft: 8 }}>
                            Open to negotiation
                          </span>
                        )}
                      </div>

                      {/* Name & Location */}
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                        {kitchen.kitchen_name}
                      </h3>
                      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                        {kitchen.city}{kitchen.postcode ? `, ${kitchen.postcode.split(' ')[0]}` : ''}
                      </p>

                      {/* Price */}
                      <p style={{ fontSize: 16, fontWeight: 600, color: '#10b981', marginBottom: 12 }}>
                        {getLowestPrice(kitchen)}
                      </p>

                      {/* Terms Available */}
                      {kitchen.terms_available && kitchen.terms_available.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                          {kitchen.terms_available.map(term => (
                            <span key={term} style={{
                              padding: '3px 8px', background: '#ecfdf5', color: '#065f46',
                              borderRadius: 4, fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
                            }}>
                              {term === 'longTerm' ? 'Long-term' : term}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Equipment Preview */}
                      {kitchen.equipment && kitchen.equipment.length > 0 && (
                        <p style={{ fontSize: 12, color: '#9ca3af' }}>
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
    </main>
  )
}
