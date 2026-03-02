import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'] })

export const metadata: Metadata = {
  title: 'Find Me a Kitchen — AI Kitchen Matching',
  description: 'Find your perfect commercial kitchen in seconds. AI-powered matching for food businesses across the UK.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
