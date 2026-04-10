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
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-M3PTV54F');`}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", process.env.NEXT_PUBLIC_CLARITY_ID || "CLARITY_PROJECT_ID");
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
