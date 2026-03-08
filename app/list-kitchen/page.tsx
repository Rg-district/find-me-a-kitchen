'use client'
// Stripe subscription flow preserved below — activate when monetisation launches
// import Stripe from 'stripe'

import { useState } from 'react'

const EQUIPMENT_OPTIONS = [
  'Commercial Oven', 'Hob / Range', 'Griddle', 'Fryer', 'Bain Marie',
  'Fridge', 'Freezer', 'Cold Room', 'Dishwasher', 'Extraction Hood',
  'Prep Tables', 'Sinks (2-bowl+)', 'Storage Shelving', 'Gas Supply',
  'Three-Phase Electric', 'Loading Bay',
]

const KITCHEN_TYPES = [
  'Dark Kitchen / Ghost Kitchen',
  'Shared Commercial Kitchen',
  'Commissary Kitchen',
  'Pop-up / Event Kitchen',
  'Restaurant Kitchen (off-hours)',
  'Other',
]

export default function ListKitchenPage() {
  const [form, setForm] = useState({
    businessName: '',
    kitchenName: '',
    kitchenType: '',
    address: '',
    postcode: '',
    city: '',
    capacity: '',
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    availableHours: '',
    equipment: [] as string[],
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleEquipment(item: string) {
    setForm(f => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter(e => e !== item)
        : [...f.equipment, item],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/list-kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Something went wrong — please try again')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            Kitchen submitted
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            We&apos;ll review your listing within 24 hours and have it live shortly. We&apos;ll email you at <strong>{form.contactEmail}</strong> once it&apos;s published.
          </p>
          <a href="/" style={{ display: 'inline-block', background: '#10b981', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
            Back to homepage
          </a>
        </div>
      </main>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: '#fff', border: '1px solid #d1d5db',
    borderRadius: 8, color: '#111827', fontSize: 15,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#374151', marginBottom: 6,
  }

  const sectionStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 12, padding: '24px', marginBottom: 20,
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f9fafb', padding: '40px 20px', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            List Your Kitchen — Free
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16 }}>
            Get matched with vetted food businesses looking for kitchen space. No upfront cost.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Business & Kitchen Details */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Kitchen Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Business name</label>
                <input required style={inputStyle} value={form.businessName}
                  onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                  placeholder="e.g. Bermondsey Kitchens Ltd" />
              </div>
              <div>
                <label style={labelStyle}>Kitchen name</label>
                <input required style={inputStyle} value={form.kitchenName}
                  onChange={e => setForm(f => ({ ...f, kitchenName: e.target.value }))}
                  placeholder="e.g. Bermondsey Dark Kitchen" />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Kitchen type</label>
              <select required style={inputStyle} value={form.kitchenType}
                onChange={e => setForm(f => ({ ...f, kitchenType: e.target.value }))}>
                <option value="">Select kitchen type</option>
                {KITCHEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Address</label>
              <input required style={inputStyle} value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Street address" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>City</label>
                <input required style={inputStyle} value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. London" />
              </div>
              <div>
                <label style={labelStyle}>Postcode</label>
                <input required style={inputStyle} value={form.postcode}
                  onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))}
                  placeholder="e.g. SE1 3PB" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Capacity (covers/day)</label>
                <input style={inputStyle} value={form.capacity} type="number"
                  onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                  placeholder="e.g. 200" />
              </div>
              <div>
                <label style={labelStyle}>Available hours</label>
                <input style={inputStyle} value={form.availableHours}
                  onChange={e => setForm(f => ({ ...f, availableHours: e.target.value }))}
                  placeholder="e.g. Mon–Fri 6am–10pm" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Pricing</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Price per day (£)</label>
                <input style={inputStyle} value={form.pricePerDay} type="number"
                  onChange={e => setForm(f => ({ ...f, pricePerDay: e.target.value }))}
                  placeholder="e.g. 120" />
              </div>
              <div>
                <label style={labelStyle}>Price per week (£)</label>
                <input style={inputStyle} value={form.pricePerWeek} type="number"
                  onChange={e => setForm(f => ({ ...f, pricePerWeek: e.target.value }))}
                  placeholder="e.g. 550" />
              </div>
              <div>
                <label style={labelStyle}>Price per month (£)</label>
                <input style={inputStyle} value={form.pricePerMonth} type="number"
                  onChange={e => setForm(f => ({ ...f, pricePerMonth: e.target.value }))}
                  placeholder="e.g. 1800" />
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Equipment available</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {EQUIPMENT_OPTIONS.map(item => (
                <label key={item} style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  background: form.equipment.includes(item) ? '#ecfdf5' : '#f9fafb',
                  border: `1px solid ${form.equipment.includes(item) ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
                  color: form.equipment.includes(item) ? '#065f46' : '#374151',
                  transition: 'all 0.15s',
                }}>
                  <input type="checkbox" style={{ display: 'none' }}
                    checked={form.equipment.includes(item)}
                    onChange={() => toggleEquipment(item)} />
                  {form.equipment.includes(item) ? '✓ ' : ''}{item}
                </label>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div style={sectionStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Your contact details</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full name</label>
              <input required style={inputStyle} value={form.contactName}
                onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                placeholder="Your name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Email address</label>
                <input required type="email" style={inputStyle} value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="you@kitchen.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone number</label>
                <input style={inputStyle} value={form.contactPhone}
                  onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="07700 900000" />
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px 20px',
            background: loading ? '#059669' : '#10b981',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
          }}>
            {loading ? 'Submitting...' : 'Submit my kitchen listing — Free'}
          </button>
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
            Free to list · No subscription required · We review within 24 hours
          </p>
        </form>
      </div>
    </main>
  )
}
