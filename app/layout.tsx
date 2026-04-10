import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers'
import { cn } from "@/lib/utils";
import FeedbackWidget from '@/components/FeedbackWidget'

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700','800'], variable: '--font-sans' })

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  metadataBase: new URL('https://www.findmeakitchen.com'),
  title: 'Find Me a Kitchen — AI Commercial Kitchen Matching',
  description: 'Find your perfect commercial kitchen in seconds. AI-powered matching for food businesses across the UK.',
  alternates: {
    canonical: 'https://www.findmeakitchen.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <head>
        {/* WebSite + SearchAction schema for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Find Me a Kitchen",
            "url": "https://www.findmeakitchen.com",
            "description": "Find commercial kitchen space across the UK. Search dark kitchens, shared kitchens, production kitchens and more.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.findmeakitchen.com/match?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }) }}
        />
        {/* GA4 Direct — GTM bypassed (tags flagged by Google malware scanner) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GP324NBFEJ"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GP324NBFEJ', {
              page_path: window.location.pathname,
              send_page_view: true
            });
            window._gtag = gtag;
          `}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vt9iurewr1");
          `}
        </Script>
      </head>
      <body className={inter.className}>
        {/* GTM noscript fallback */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M3PTV54F" height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>
        {children}
        <FeedbackWidget />
        <footer style={{
          textAlign: 'center',
          padding: '24px 16px',
          fontSize: '11px',
          color: '#9ca3af',
          borderTop: '1px solid #f3f4f6',
          marginTop: '48px'
        }}>
          'Find Me a Kitchen' is a trading name of Cater Vans UK Ltd, Company No. 15280523.
          &nbsp;·&nbsp;
          <a href="/faq" style={{ color: '#9ca3af', textDecoration: 'underline' }}>FAQ &amp; Policies</a>
          &nbsp;·&nbsp;
          <a href="/privacy" style={{ color: '#9ca3af', textDecoration: 'underline' }}>Privacy Policy</a>
        </footer>
      </body>
    </html>
  )
}
