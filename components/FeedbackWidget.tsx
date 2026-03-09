'use client'

import { useState } from 'react'

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating && !message) return
    
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: 'fmak',
          page: typeof window !== 'undefined' ? window.location.pathname : '',
          rating,
          message,
          email,
        }),
      })
      setSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setRating(null)
        setMessage('')
        setEmail('')
      }, 2000)
    } catch (err) {
      console.error('Feedback error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#10b981',
          color: '#fff',
          border: 'none',
          borderRadius: 50,
          padding: '12px 20px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9998,
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        💬 Feedback
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 340,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{
            background: '#10b981',
            color: '#fff',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Send us feedback</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 20,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 20 }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🙏</div>
                <p style={{ fontWeight: 600, color: '#111', marginBottom: 4 }}>Thank you!</p>
                <p style={{ color: '#6b7280', fontSize: 14 }}>Your feedback helps us improve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Rating */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    How's your experience?
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { emoji: '😟', value: 'bad', label: 'Bad' },
                      { emoji: '😐', value: 'okay', label: 'Okay' },
                      { emoji: '😊', value: 'good', label: 'Good' },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRating(r.value)}
                        style={{
                          flex: 1,
                          padding: '12px 8px',
                          border: rating === r.value ? '2px solid #10b981' : '1px solid #e5e7eb',
                          borderRadius: 10,
                          background: rating === r.value ? '#ecfdf5' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{r.emoji}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    What can we improve?
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's working or what's not..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      resize: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Email (optional) */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    Email <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      padding: 12,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 14,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || (!rating && !message)}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: loading || (!rating && !message) ? '#9ca3af' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: loading || (!rating && !message) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
