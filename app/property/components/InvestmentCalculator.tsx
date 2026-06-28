'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Property } from '../types'

const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { maximumFractionDigits: 0 })

const fmtPct = (n: number) => n.toFixed(2) + '%'

export default function InvestmentCalculator({
  properties,
  initialProperty,
}: {
  properties: Property[]
  initialProperty: Property | null
}) {
  const available = properties.filter(p => p.status !== 'sold')
  const [selectedId, setSelectedId] = useState<string>(
    initialProperty?.id ?? available[0]?.id ?? ''
  )
  const [stakePercent, setStakePercent] = useState<number>(25)
  const [inputValue, setInputValue] = useState<string>('25')

  useEffect(() => {
    if (initialProperty) setSelectedId(initialProperty.id)
  }, [initialProperty])

  const property = properties.find(p => p.id === selectedId)

  const calc = useMemo(() => {
    if (!property) return null
    const stake = Math.min(100, Math.max(0, stakePercent))
    const investmentAmount = (property.currentValuation * stake) / 100
    const returnAtCompletion = (property.potentialValuation * stake) / 100
    const grossProfit = returnAtCompletion - investmentAmount
    const roi = (grossProfit / investmentAmount) * 100
    const annualisedRoi = ((1 + roi / 100) ** (12 / property.completionMonths) - 1) * 100
    return { stake, investmentAmount, returnAtCompletion, grossProfit, roi, annualisedRoi }
  }, [property, stakePercent])

  function handleSlider(v: number) {
    setStakePercent(v)
    setInputValue(String(v))
  }

  function handleInput(raw: string) {
    setInputValue(raw)
    const n = parseFloat(raw)
    if (!isNaN(n)) setStakePercent(Math.min(100, Math.max(0, n)))
  }

  if (!property || !calc) {
    return <p style={{ color: '#999', textAlign: 'center', padding: '60px 0' }}>No available properties.</p>
  }

  const uplift = property.potentialValuation - property.currentValuation
  const upliftPct = ((uplift / property.currentValuation) * 100).toFixed(0)

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Investment Calculator
        </h2>
        <p style={{ color: '#777', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
          Choose a property and select your investment stake. See exactly what you could receive when the renovation completes.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Left panel — inputs */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #ebebeb',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '20px', color: '#111' }}>
            1. Select Property
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {available.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: selectedId === p.id ? '#111' : '#e5e7eb',
                  background: selectedId === p.id ? '#111' : '#fff',
                  color: selectedId === p.id ? '#fff' : '#111',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.title}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '1px' }}>{p.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{fmt(p.currentValuation)}</div>
                  <div style={{
                    fontSize: '11px',
                    color: selectedId === p.id ? '#c9a96e' : '#16a34a',
                    fontWeight: 600,
                  }}>
                    → {fmt(p.potentialValuation)}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px', color: '#111' }}>
            2. Your Investment Stake
          </h3>
          <p style={{ fontSize: '13px', color: '#777', marginBottom: '16px', lineHeight: 1.5 }}>
            Set the percentage of the <strong>current property value</strong> you want to invest. Your return is the same percentage of the <strong>post-renovation valuation</strong>.
          </p>

          {/* Stake input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={inputValue}
              onChange={e => handleInput(e.target.value)}
              style={{
                width: '90px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '2px solid #111',
                fontSize: '18px',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#555' }}>%</span>
            <span style={{ fontSize: '14px', color: '#888' }}>= {fmt(calc.investmentAmount)} investment</span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={stakePercent}
            onChange={e => handleSlider(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#111', marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#bbb' }}>
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>

          {/* Quick select buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {[10, 25, 33, 50].map(v => (
              <button
                key={v}
                onClick={() => handleSlider(v)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid',
                  cursor: 'pointer',
                  borderColor: stakePercent === v ? '#111' : '#e5e7eb',
                  background: stakePercent === v ? '#111' : '#fff',
                  color: stakePercent === v ? '#fff' : '#555',
                }}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        {/* Right panel — results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Property summary */}
          <div style={{
            background: '#111',
            color: '#fff',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Selected Property</div>
                <div style={{ fontWeight: 700, fontSize: '18px' }}>{property.title}</div>
                <div style={{ color: '#888', fontSize: '13px' }}>{property.location}</div>
              </div>
              <div style={{
                background: 'rgba(201,169,110,0.15)',
                border: '1px solid rgba(201,169,110,0.3)',
                color: '#c9a96e',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
              }}>
                +{upliftPct}%<br />
                <span style={{ fontWeight: 400, fontSize: '10px' }}>uplift</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderTop: '1px solid #222', paddingTop: '16px' }}>
              <MiniStat label="Current Value" value={fmt(property.currentValuation)} color="#fff" />
              <MiniStat label="Reno Cost" value={fmt(property.renovationCost)} color="#888" />
              <MiniStat label="Post-Reno Value" value={fmt(property.potentialValuation)} color="#c9a96e" />
            </div>
          </div>

          {/* Results card */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #ebebeb',
          }}>
            <div style={{ fontSize: '13px', color: '#999', fontWeight: 500, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Investment Breakdown
            </div>

            <ResultRow
              label="Your investment"
              sub={`${calc.stake}% of ${fmt(property.currentValuation)}`}
              value={fmt(calc.investmentAmount)}
              color="#111"
              large
            />
            <div style={{ height: '1px', background: '#f0f0f0', margin: '14px 0' }} />
            <ResultRow
              label="Your return at completion"
              sub={`${calc.stake}% of post-reno value`}
              value={fmt(calc.returnAtCompletion)}
              color="#111"
            />
            <ResultRow
              label="Gross profit"
              sub="Return minus investment"
              value={fmt(calc.grossProfit)}
              color={calc.grossProfit >= 0 ? '#16a34a' : '#dc2626'}
            />

            {/* ROI highlight */}
            <div style={{
              background: calc.roi >= 0 ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
              border: `1px solid ${calc.roi >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: '12px',
              padding: '16px',
              marginTop: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Total ROI</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: calc.roi >= 0 ? '#16a34a' : '#dc2626', letterSpacing: '-0.5px' }}>
                  {fmtPct(calc.roi)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Annualised ROI</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: calc.annualisedRoi >= 0 ? '#16a34a' : '#dc2626', letterSpacing: '-0.5px' }}>
                  {fmtPct(calc.annualisedRoi)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>Timeline</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                background: '#f8f7f4',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  fontSize: '12px',
                  flex: 1,
                  textAlign: 'center',
                  borderRight: '1px solid #ebebeb',
                }}>
                  <div style={{ fontWeight: 700 }}>Today</div>
                  <div style={{ color: '#888', marginTop: '2px' }}>{fmt(calc.investmentAmount)}</div>
                </div>
                <div style={{ padding: '0 12px', color: '#c9a96e', fontWeight: 700, fontSize: '18px' }}>→</div>
                <div style={{
                  padding: '10px 14px',
                  fontSize: '12px',
                  flex: 1,
                  textAlign: 'center',
                  borderLeft: '1px solid #ebebeb',
                }}>
                  <div style={{ fontWeight: 700 }}>Month {property.completionMonths}</div>
                  <div style={{ color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>{fmt(calc.returnAtCompletion)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p style={{
            fontSize: '11px',
            color: '#bbb',
            lineHeight: 1.6,
            padding: '0 4px',
          }}>
            ⚠️ These figures are illustrative projections only and do not constitute financial advice. Property values and renovation costs may vary. Past performance does not guarantee future results. Please seek independent financial advice before investing.
          </p>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function ResultRow({
  label, sub, value, color, large,
}: {
  label: string; sub: string; value: string; color: string; large?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <div>
        <div style={{ fontSize: large ? '15px' : '14px', fontWeight: 500, color: '#333' }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '1px' }}>{sub}</div>
      </div>
      <div style={{ fontSize: large ? '18px' : '16px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
