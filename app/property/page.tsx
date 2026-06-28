'use client'

import { useState } from 'react'
import PropertyGrid from './components/PropertyGrid'
import InvestmentCalculator from './components/InvestmentCalculator'
import { properties } from './data'
import type { Property } from './types'

export default function PropertyPage() {
  const [activeTab, setActiveTab] = useState<'properties' | 'calculator'>('properties')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  function handleCalculate(property: Property) {
    setSelectedProperty(property)
    setActiveTab('calculator')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4' }}>
      {/* Header */}
      <header style={{
        background: '#111',
        color: '#fff',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        borderBottom: '1px solid #222',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #c9a96e, #8b6914)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: '#fff',
          }}>R</div>
          <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.3px' }}>
            Rg District <span style={{ color: '#c9a96e', fontWeight: 400 }}>Properties</span>
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '4px' }}>
          {(['properties', 'calculator'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: activeTab === tab ? '#c9a96e' : 'transparent',
                color: activeTab === tab ? '#111' : '#aaa',
              }}
            >
              {tab === 'properties' ? 'Properties' : 'Calculator'}
            </button>
          ))}
        </nav>
      </header>

      {/* Hero */}
      {activeTab === 'properties' && (
        <div style={{
          background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
          padding: '72px 24px 56px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(201,169,110,0.15)',
            color: '#c9a96e',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(201,169,110,0.3)',
            marginBottom: '20px',
          }}>
            Derelict to Desirable
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-1px',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            Invest in Property.<br />
            <span style={{ color: '#c9a96e' }}>Profit from Potential.</span>
          </h1>
          <p style={{ color: '#999', fontSize: '16px', maxWidth: '500px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            We acquire derelict properties, renovate them to a high specification, and sell at significant uplift. Browse our current portfolio and calculate your investment return.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Stat label="Properties Completed" value="47+" />
            <Stat label="Avg. Uplift" value="68%" />
            <Stat label="Investor Returns" value="£12M+" />
          </div>
        </div>
      )}

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {activeTab === 'properties' ? (
          <PropertyGrid properties={properties} onCalculate={handleCalculate} />
        ) : (
          <InvestmentCalculator
            properties={properties}
            initialProperty={selectedProperty}
          />
        )}
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '16px 28px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '26px', fontWeight: 800, color: '#c9a96e', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#777', marginTop: '2px', letterSpacing: '0.3px' }}>{label}</div>
    </div>
  )
}
