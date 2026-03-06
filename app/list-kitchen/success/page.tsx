export default function SuccessPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
      <div>
        <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
        <h1 style={{ fontFamily: 'serif', fontSize: 32, marginBottom: 12 }}>You're listed!</h1>
        <p style={{ color: '#94a3b8', fontSize: 16, maxWidth: 400, margin: '0 auto 32px' }}>
          Your kitchen is now live on Find Me a Kitchen. You'll start receiving matched enquiries within 24 hours.
        </p>
        <a href="/" style={{ background: '#6366f1', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          Back to home
        </a>
      </div>
    </main>
  )
}
