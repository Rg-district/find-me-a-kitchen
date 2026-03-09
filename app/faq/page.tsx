import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ & Policies — Find Me a Kitchen',
  description: 'Frequently asked questions and policies for Find Me a Kitchen — the UK\'s free commercial kitchen marketplace.',
}

export default function FAQPage() {
  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#111827', background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href="/">
          <img src="/logo.png" alt="Find Me a Kitchen" style={{ height: 40 }} />
        </Link>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: '24px' }}>
          <Link href="/browse" style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'none' }}>Browse</Link>
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

        {/* About */}
        <Section title="About Find Me a Kitchen">
          <QA q="What is Find Me a Kitchen?">
            Find Me a Kitchen is the UK&apos;s free marketplace for commercial kitchen space. We connect food businesses looking for kitchen space with kitchen owners who have capacity to rent. Think of us like Rightmove, but for commercial kitchens.
          </QA>
          <QA q="Is it really free?">
            Yes. It&apos;s completely free to list your kitchen and free to browse. We don&apos;t charge commission on rentals. Kitchen owners and renters connect directly and arrange terms between themselves.
          </QA>
          <QA q="How do you make money?">
            We&apos;re currently focused on building the best kitchen marketplace in the UK. In the future, we may offer optional premium features for kitchen operators, but the core listing and search functionality will always be free.
          </QA>
        </Section>

        {/* For Kitchen Searchers */}
        <Section title="For Kitchen Searchers">
          <QA q="How do I find a kitchen?">
            Use our <Link href="/browse" style={{ color: '#10b981' }}>Browse</Link> page to search kitchens by location, type, equipment, and rental terms. You can also use our AI-powered quiz on the homepage to get personalized recommendations based on your business needs.
          </QA>
          <QA q="How do I contact a kitchen owner?">
            Click on any kitchen listing to view full details. Click &quot;Show Contact Details&quot; to reveal the owner&apos;s email and phone number. You contact them directly to arrange viewings and discuss terms.
          </QA>
          <QA q="Do I need an account?">
            No. You can browse all kitchens and contact owners without creating an account.
          </QA>
          <QA q="Is there a fee to enquire?">
            No. Contacting kitchen owners is completely free. There are no enquiry fees or hidden charges.
          </QA>
        </Section>

        {/* For Kitchen Owners */}
        <Section title="For Kitchen Owners">
          <QA q="How do I list my kitchen?">
            Go to our <Link href="/list-kitchen" style={{ color: '#10b981' }}>List Your Kitchen</Link> page and fill out the form. Include details like location, equipment, pricing, and rental terms. Your listing will be reviewed and published within 24 hours.
          </QA>
          <QA q="What does it cost to list?">
            Nothing. Listing your kitchen is completely free. We don&apos;t charge any listing fees, subscription fees, or commission on rentals you arrange.
          </QA>
          <QA q="How do I get enquiries?">
            When someone is interested in your kitchen, they&apos;ll contact you directly using the email and phone number you provide. You handle all communication, viewings, and agreements directly with the renter.
          </QA>
          <QA q="Can I edit or remove my listing?">
            Yes. Contact us at <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981' }}>help@findmeakitchen.com</a> to update or remove your listing. We&apos;re working on self-service listing management.
          </QA>
        </Section>

        {/* How It Works */}
        <Section title="How It Works">
          <QA q="What happens after I contact a kitchen?">
            You and the kitchen owner arrange everything directly — viewings, terms, contracts, payments. Find Me a Kitchen is a discovery platform; we&apos;re not involved in the rental agreement itself.
          </QA>
          <QA q="Do you verify kitchens?">
            <span>We review all listings before they go live. Our review includes:</span>
            <ul style={{ paddingLeft: '20px', marginTop: '8px', lineHeight: 1.8 }}>
              <li>Checking the address corresponds to a real location</li>
              <li>Verifying contact details are valid</li>
              <li>Ensuring the listing contains accurate information</li>
            </ul>
            <p style={{ marginTop: '10px' }}>
              However, we recommend conducting your own due diligence before entering into any rental agreement. Visit the kitchen in person and verify certifications (food hygiene, gas safety, etc.) before committing.
            </p>
          </QA>
          <QA q="Are you involved in the rental agreement?">
            No. Find Me a Kitchen is a marketplace that connects kitchen owners and renters. We are not party to any agreement between you and a kitchen operator. All terms, payments, and contracts are arranged directly between parties.
          </QA>
        </Section>

        {/* Contact */}
        <Section title="Contact & Support">
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px 24px', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.8 }}>
              <strong>Email:</strong> <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981', textDecoration: 'none' }}>help@findmeakitchen.com</a><br />
              <strong>Response time:</strong> Within 1 business day (Monday–Friday, 9am–5pm GMT)
            </p>
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>
            &lsquo;Find Me a Kitchen&rsquo; is a trading name of <strong>Cater Vans UK Ltd</strong>, Company No. 15280523.<br />
            Registered office: 128 City Road, London, United Kingdom, EC1V 2NX.
          </p>
        </Section>

        {/* Legal */}
        <Section title="Legal & Privacy">
          <QA q="Who can use Find Me a Kitchen?">
            Find Me a Kitchen is intended for use by individuals and businesses based in the United Kingdom. Users must be 18 years of age or older.
          </QA>
          <QA q="Are you GDPR compliant?">
            Yes. Find Me a Kitchen complies with UK GDPR and the Data Protection Act 2018. We collect and process personal data only as necessary to provide our service. Full details are available in our <Link href="/privacy" style={{ color: '#10b981' }}>Privacy Policy</Link>.
          </QA>
          <QA q="What if I find an inaccurate listing?">
            Please report it to <a href="mailto:help@findmeakitchen.com" style={{ color: '#10b981' }}>help@findmeakitchen.com</a>. We take accuracy seriously and will investigate all reports.
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
