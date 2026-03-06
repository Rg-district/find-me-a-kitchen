'use client'
import { useState } from 'react'

export default function ListKitchenPage() {
  const [form, setForm] = useState({ kitchenName: '', email: '', plan: 'basic' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 580, width: '100%' }}>

        {/* Plans */}
        <h1 style={{ fontFamily: 'serif', fontSize: 32, marginBottom: 8, textAlign: 'center' }}>List Your Kitchen</h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 40 }}>
          Get matched with vetted food businesses actively looking for kitchen space.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>
          {[
            { id: 'basic', name: 'Listed', price: '£49/mo', features: ['Standard listing', 'AI matching', 'Enquiry inbox', 'Monthly analytics'] },
            { id: 'pro',   name: 'Pro',    price: '£99/mo', features: ['Priority placement', 'Featured badge', 'Full analytics', 'Phone support'] },
          ].map(p => (
            <div
              key={p.id}
              onClick={() => setForm(f => ({ ...f, plan: p.id }))}
              style={{
                border: `2px solid ${form.plan === p.id ? '#6366f1' : '#1e293b'}`,
                borderRadius: 12, padding: 20, cursor: 'pointer',
                background: form.plan === p.id ? 'rgba(99,102,241,0.08)' : '#1e293b',
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>{p.price}</div>
              {p.features.map(f => (
                <div key={f} style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 4 }}>✓ {f}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Kitchen name</label>
            <input
              required value={form.kitchenName}
              onChange={e => setForm(f => ({ ...f, kitchenName: e.target.value }))}
              placeholder="e.g. Bermondsey Dark Kitchen"
              style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 15 }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Email address</label>
            <input
              required type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@kitchen.com"
              style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff', fontSize: 15 }}
            />
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px 20px',
              background: loading ? '#4f46e5' : '#6366f1',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 16, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Redirecting to payment...' : `List my kitchen — ${form.plan === 'pro' ? '£99/mo' : '£49/mo'}`}
          </button>
          <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 12 }}>
            Secure payment via Stripe · Cancel anytime
          </p>
        </form>
      </div>
    </main>
  )
}
