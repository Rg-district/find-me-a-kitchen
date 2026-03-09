'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Kitchen {
  id: string
  kitchen_name: string
  business_name: string
  kitchen_type: string
  address: string
  city: string
  postcode: string
  capacity: number | null
  available_hours: string
  terms_available: string[]
  price_per_hour: number | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  price_long_term: string | null
  open_to_negotiation: boolean
  equipment: string[]
  contact_name: string
  contact_email: string
  contact_phone: string
  created_at: string
}

export default function KitchenDetailPage() {
  const params = useParams()
  const [kitchen, setKitchen] = useState<Kitchen | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContact, setShowContact] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchKitchen(params.id as string)
    }
  }, [params.id])

  async function fetchKitchen(id: string) {
    try {
      const res = await fetch(`/api/kitchen/${id}`)
      const data = await res.json()
      if (data.kitchen) {
        setKitchen(data.kitchen)
      }
    } catch (err) {
      console.error('Failed to fetch kitchen:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </main>
    )
  }

  if (!kitchen) {
    return (
      <main style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Kitchen not found</h1>
        <Link href="/browse" style={{ color: '#10b981', fontWeight: 600 }}>← Back to browse</Link>
      </main>
    )
  }

  const sectionStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  }

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    background: '#f3f4f6',
    color: '#374151',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 20, fontWeight: 700, color: '#10b981', textDecoration: 'none' }}>
            Find Me a Kitchen
          </Link>
          <Link href="/browse" style={{ color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>
            ← Back to browse
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
          {/* Main Content */}
          <div>
            {/* Title Section */}
            <div style={sectionStyle}>
              <div style={{ marginBottom: 16 }}>
                <span style={tagStyle}>{kitchen.kitchen_type || 'Commercial Kitchen'}</span>
                {kitchen.open_to_negotiation && (
                  <span style={{ ...tagStyle, background: '#fef3c7', color: '#92400e', marginLeft: 8 }}>
                    Open to negotiation
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                {kitchen.kitchen_name}
              </h1>
              {kitchen.business_name && (
                <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 8 }}>
                  by {kitchen.business_name}
                </p>
              )}
              <p style={{ fontSize: 15, color: '#374151' }}>
                📍 {kitchen.city}{kitchen.postcode ? `, ${kitchen.postcode}` : ''}
              </p>
            </div>

            {/* Pricing Section */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Pricing</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                {kitchen.price_per_hour && (
                  <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>£{kitchen.price_per_hour}</p>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>per hour</p>
                  </div>
                )}
                {kitchen.price_per_day && (
                  <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>£{kitchen.price_per_day}</p>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>per day</p>
                  </div>
                )}
                {kitchen.price_per_week && (
                  <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>£{kitchen.price_per_week}</p>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>per week</p>
                  </div>
                )}
                {kitchen.price_per_month && (
                  <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8, textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>£{kitchen.price_per_month}</p>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>per month</p>
                  </div>
                )}
              </div>
              {kitchen.terms_available?.includes('longTerm') && (
                <p style={{ marginTop: 16, padding: 12, background: '#ecfdf5', borderRadius: 8, fontSize: 14, color: '#065f46' }}>
                  📅 Long-term rentals (6+ months) available — contact for rates
                </p>
              )}
            </div>

            {/* Details Section */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {kitchen.capacity && (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Capacity</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{kitchen.capacity} covers/day</p>
                  </div>
                )}
                {kitchen.available_hours && (
                  <div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Available Hours</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{kitchen.available_hours}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Equipment Section */}
            {kitchen.equipment && kitchen.equipment.length > 0 && (
              <div style={sectionStyle}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Equipment Included</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {kitchen.equipment.map(item => (
                    <span key={item} style={{
                      padding: '8px 14px', background: '#ecfdf5', color: '#065f46',
                      borderRadius: 8, fontSize: 13, fontWeight: 500,
                    }}>
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Contact Card */}
          <div>
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
              padding: 24, position: 'sticky', top: 24,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
                Contact Owner
              </h2>

              {!showContact ? (
                <>
                  <button
                    onClick={() => setShowContact(true)}
                    style={{
                      width: '100%', padding: '14px 20px', background: '#10b981',
                      color: '#fff', border: 'none', borderRadius: 10,
                      fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      marginBottom: 12,
                    }}
                  >
                    Show Contact Details
                  </button>
                  <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
                    Contact the owner directly to arrange a viewing
                  </p>
                </>
              ) : (
                <div>
                  {kitchen.contact_name && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Contact Name</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{kitchen.contact_name}</p>
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Email</p>
                    <a
                      href={`mailto:${kitchen.contact_email}?subject=Enquiry about ${kitchen.kitchen_name}`}
                      style={{ fontSize: 15, fontWeight: 600, color: '#10b981', textDecoration: 'none' }}
                    >
                      {kitchen.contact_email}
                    </a>
                  </div>

                  {kitchen.contact_phone && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Phone</p>
                      <a
                        href={`tel:${kitchen.contact_phone}`}
                        style={{ fontSize: 15, fontWeight: 600, color: '#10b981', textDecoration: 'none' }}
                      >
                        {kitchen.contact_phone}
                      </a>
                    </div>
                  )}

                  <a
                    href={`mailto:${kitchen.contact_email}?subject=Enquiry about ${kitchen.kitchen_name}&body=Hi ${kitchen.contact_name || 'there'},%0D%0A%0D%0AI found your kitchen listing on Find Me a Kitchen and I'm interested in learning more.%0D%0A%0D%0ACould we arrange a viewing?%0D%0A%0D%0AThanks`}
                    style={{
                      display: 'block', width: '100%', padding: '14px 20px', background: '#111827',
                      color: '#fff', border: 'none', borderRadius: 10, textAlign: 'center',
                      fontSize: 15, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box',
                    }}
                  >
                    ✉️ Send Enquiry Email
                  </a>
                </div>
              )}

              <div style={{ marginTop: 20, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                  <strong>Tip:</strong> Mention your food business type and preferred rental terms when contacting the owner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
