import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers'
import { cn } from "@/lib/utils";
import FeedbackWidget from '@/components/FeedbackWidget'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700','800'] })

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Find Me a Kitchen — AI Commercial Kitchen Matching',
  description: 'Find your perfect commercial kitchen in seconds. AI-powered matching for food businesses across the UK.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        {/* Microsoft Clarity - replace CLARITY_PROJECT_ID with your ID from clarity.microsoft.com */}
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
