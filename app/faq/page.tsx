import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ & Policies — Find Me a Kitchen',
  description: 'Frequently asked questions, refund policy, cancellation policy, and legal information for Find Me a Kitchen.',
}

export default function FAQPage() {
  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#111827', background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '18px', color: '#111827', textDecoration: 'none' }}>
          Find Me a <span style={{ color: '#10b981' }}>Kitchen</span>
        </Link>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: '24px' }}>
          <Link href="/" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>Browse</Link>
          <Link href="/list-kitchen" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>List your kitchen</Link>
        </nav>
      </header>

      {/* Hero */}
      <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '48px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>FAQ &amp; Policies</h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Everything you need to know about using Find Me a Kitchen</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Contact */}
        <Section title="Contact & Support">
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 24px', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.8 }}>
              <strong>Email:</strong> <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981', textDecoration: 'none' }}>help@findmeakitchen.com</a><br />
              <strong>Contact form:</strong> <Link href="/contact" style={{ color: '#10b981', textDecoration: 'none' }}>findmeakitchen.com/contact</Link><br />
              <strong>Response time:</strong> Within 1 business day (Monday–Friday, 9am–5pm GMT)
            </p>
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>
            &lsquo;Find Me a Kitchen&rsquo; is a trading name of <strong>Cater Vans UK Ltd</strong>, Company No. 15280523.<br />
            Registered office: 128 City Road, London, United Kingdom, EC1V 2NX.
          </p>
        </Section>

        {/* Billing */}
        <Section title="Subscriptions & Billing">
          <QA q="How does billing work?">
            Find Me a Kitchen operates on a monthly subscription basis. Your subscription begins on the date you sign up and renews automatically every 30 days. You will be charged the applicable subscription fee on each renewal date.
          </QA>
          <QA q="What payment methods do you accept?">
            We accept all major credit and debit cards (Visa, Mastercard, American Express) processed securely via Stripe.
          </QA>
          <QA q="Is there a free trial?">
            There is no free trial. Subscriptions begin immediately upon sign-up. We offer a <strong>14-day money-back guarantee</strong> for new subscribers — if you&apos;re not satisfied within the first 14 days, contact us at{' '}
            <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981' }}>help@findmeakitchen.com</a> for a full refund.
          </QA>
        </Section>

        {/* Cancellation */}
        <Section title="Cancellation Policy">
          <QA q="Can I cancel my subscription at any time?">
            Yes. You may cancel your subscription at any time with no cancellation fee. To cancel, log in to your account and navigate to Settings → Subscription → Cancel, or email{' '}
            <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981' }}>help@findmeakitchen.com</a>.
          </QA>
          <QA q="What happens after I cancel?">
            Your access will continue until the end of your current billing period. You will not be charged again after cancellation. No partial refunds are issued for unused days in a billing period.
          </QA>
          <QA q="Is there a minimum contract?">
            No. Find Me a Kitchen is a rolling monthly subscription with no minimum commitment. Cancel any time.
          </QA>
        </Section>

        {/* Refunds */}
        <Section title="Refund & Dispute Policy">
          <QA q="Do you offer refunds?">
            <span>We offer refunds in the following circumstances:</span>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', lineHeight: 1.8 }}>
              <li>You were charged in error (e.g. duplicate payment)</li>
              <li>You cancel within 7 days of your initial subscription payment and have not used the service</li>
              <li>A technical fault prevented you from accessing the service for a significant portion of your billing period</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              Refund requests must be submitted to <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981' }}>help@findmeakitchen.com</a> within 14 days of the charge. Approved refunds are processed within 5–10 business days to your original payment method.
            </p>
          </QA>
          <QA q="What if I have a billing dispute?">
            Please contact us at <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981' }}>help@findmeakitchen.com</a> before initiating a chargeback with your bank. We are committed to resolving billing issues promptly and fairly.
          </QA>
        </Section>

        {/* Physical Goods */}
        <Section title="Physical Goods">
          <QA q="Do you sell physical products?">
            No. Find Me a Kitchen is a digital service only. We do not sell or ship any physical goods. No returns policy applies.
          </QA>
        </Section>

        {/* Legal */}
        <Section title="Legal & Restrictions">
          <QA q="Who can use Find Me a Kitchen?">
            Find Me a Kitchen is intended for use by individuals and businesses based in the United Kingdom. Users must be 18 years of age or older and must have the legal authority to enter into agreements on behalf of their business (if applicable).
          </QA>
          <QA q="Are there any export restrictions?">
            Find Me a Kitchen is a UK-based digital service. Access from outside the United Kingdom is not restricted, however the kitchen listings and services are currently focused on the UK market. International users are welcome to browse but availability of listings outside the UK is limited.
          </QA>
          <QA q="Are you GDPR compliant?">
            Yes. Find Me a Kitchen complies with UK GDPR and the Data Protection Act 2018. We collect and process personal data only as necessary to provide our service. Full details are available in our <Link href="/privacy" style={{ color: '#10b981' }}>Privacy Policy</Link>.
          </QA>
        </Section>

        {/* Promotions */}
        <Section title="Promotions & Offers">
          <QA q="General promotion terms">
            <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
              <li>Promotional pricing is available to new subscribers only unless explicitly stated otherwise</li>
              <li>Discount codes are single-use and non-transferable</li>
              <li>Promotions cannot be combined with other offers</li>
              <li>Find Me a Kitchen reserves the right to withdraw or modify a promotion at any time without prior notice</li>
              <li>Where a promotional period ends, your subscription will continue at the standard rate unless cancelled</li>
              <li>No cash alternative is available for any promotion</li>
            </ul>
          </QA>
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '20px 24px', marginTop: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#065f46', marginBottom: '10px' }}>🎁 Launch Offer — Free listing for the first 30 kitchens</h4>
            <ul style={{ fontSize: '13px', color: '#047857', paddingLeft: '18px', lineHeight: 1.8 }}>
              <li>Available to kitchen operators only (not searchers)</li>
              <li>One free listing per business</li>
              <li>The free listing remains active subject to our standard listing terms</li>
              <li>Find Me a Kitchen reserves the right to close this offer once 30 listings have been claimed</li>
              <li>No cash alternative is available</li>
            </ul>
          </div>
        </Section>

        {/* Kitchen Listings */}
        <Section title="Kitchen Listings">
          <QA q={<>How are kitchens verified? <span style={{ display: 'inline-block', background: '#d1fae5', color: '#065f46', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', marginLeft: '6px' }}>Verified ✓</span></>}>
            <span>All kitchen listings submitted to Find Me a Kitchen are reviewed by our team before going live. Our verification process includes:</span>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', lineHeight: 1.8 }}>
              <li><strong>Address check</strong> — we confirm the address corresponds to a real, physical location</li>
              <li><strong>Contact number check</strong> — we verify a valid UK telephone number is provided</li>
              <li><strong>Business identity check</strong> — we cross-reference the business name against Companies House to confirm it is a registered UK company or trading name</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              Listings that pass all three checks are marked with a Verified ✓ badge. We recommend users still conduct their own due diligence before entering into any agreement with a kitchen operator. Find Me a Kitchen is not party to any agreement between users and kitchen operators.
            </p>
          </QA>
          <QA q="What happens if a kitchen listing is inaccurate?">
            Find Me a Kitchen acts as a platform connecting users with kitchen operators. We are not party to any agreement between a user and a kitchen operator and accept no liability for the accuracy of listings, pricing, or availability. If you encounter an inaccurate or fraudulent listing, please report it to{' '}
            <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981' }}>help@findmeakitchen.com</a>.
          </QA>
        </Section>

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '48px' }}>Last updated: March 2026</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '48px' }}>
      <h2 style={{
        fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: '#10b981', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #d1fae5'
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function QA({ q, children }: { q: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {q}
      </h3>
      <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#374151' }}>
        {children}
      </div>
    </div>
  )
}
