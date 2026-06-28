'use client'

import { useState } from 'react'
import type { Property } from '../types'

const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { maximumFractionDigits: 0 })

const statusLabel: Record<Property['status'], string> = {
  available: 'Available',
  under_offer: 'Under Offer',
  sold: 'Sold',
}

const statusColor: Record<Property['status'], { bg: string; color: string }> = {
  available: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  under_offer: { bg: 'rgba(234,179,8,0.12)', color: '#a16207' },
  sold: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
}

type Filter = 'all' | 'available' | 'under_offer' | 'sold'

export default function PropertyGrid({
  properties,
  onCalculate,
}: {
  properties: Property[]
  onCalculate: (p: Property) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = filter === 'all' ? properties : properties.filter(p => p.status === filter)

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#777', marginRight: '4px' }}>Filter:</span>
        {(['all', 'available', 'under_offer', 'sold'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderColor: filter === f ? '#111' : '#e5e7eb',
              background: filter === f ? '#111' : '#fff',
              color: filter === f ? '#fff' : '#555',
            }}
          >
            {f === 'all' ? 'All' : statusLabel[f as Property['status']]}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#999' }}>
          {visible.length} {visible.length === 1 ? 'property' : 'properties'}
        </span>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px',
      }}>
        {visible.map(p => (
          <PropertyCard key={p.id} property={p} onCalculate={onCalculate} />
        ))}
      </div>
    </div>
  )
}

function PropertyCard({
  property: p,
  onCalculate,
}: {
  property: Property
  onCalculate: (p: Property) => void
}) {
  const uplift = p.potentialValuation - p.currentValuation
  const upliftPct = ((uplift / p.currentValuation) * 100).toFixed(0)
  const sc = statusColor[p.status]

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #ebebeb',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Image placeholder */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: '48px', opacity: 0.15 }}>🏚️</div>
        {/* Uplift badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(201,169,110,0.95)',
          color: '#111',
          fontSize: '12px',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '20px',
        }}>
          +{upliftPct}% potential
        </div>
        {/* Status badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: sc.bg,
          color: sc.color,
          fontSize: '11px',
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: '20px',
          backdropFilter: 'blur(4px)',
          border: `1px solid ${sc.color}33`,
        }}>
          {statusLabel[p.status]}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px', marginBottom: '2px' }}>
            {p.title}
          </h3>
          <p style={{ fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📍</span> {p.location}
          </p>
        </div>

        <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '16px' }}>
          {p.description}
        </p>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '12px', color: '#888' }}>
          <span>🛏 {p.bedrooms} bed</span>
          <span>📐 {p.sqft.toLocaleString()} sqft</span>
          <span>🗓 {p.completionMonths}mo est.</span>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {p.tags.map(t => (
            <span key={t} style={{
              fontSize: '11px',
              background: '#f3f4f6',
              color: '#555',
              padding: '2px 8px',
              borderRadius: '4px',
            }}>{t}</span>
          ))}
        </div>

        {/* Valuation block */}
        <div style={{
          background: '#f8f7f4',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          textAlign: 'center',
        }}>
          <ValLine label="Current Value" value={fmt(p.currentValuation)} color="#111" />
          <ValLine label="Reno Cost" value={fmt(p.renovationCost)} color="#666" />
          <ValLine label="Post-Reno Value" value={fmt(p.potentialValuation)} color="#16a34a" />
        </div>

        {/* Uplift summary */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(201,169,110,0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(201,169,110,0.2)',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '12px', color: '#666' }}>Gross uplift</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#8b6914' }}>
            {fmt(uplift)} <span style={{ fontSize: '12px', fontWeight: 500 }}>({upliftPct}%)</span>
          </span>
        </div>

        <button
          onClick={() => onCalculate(p)}
          disabled={p.status === 'sold'}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            cursor: p.status === 'sold' ? 'not-allowed' : 'pointer',
            background: p.status === 'sold' ? '#e5e7eb' : '#111',
            color: p.status === 'sold' ? '#9ca3af' : '#fff',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'background 0.15s',
            marginTop: 'auto',
          }}
        >
          {p.status === 'sold' ? 'Sold' : 'Calculate My Return →'}
        </button>
      </div>
    </div>
  )
}

function ValLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
