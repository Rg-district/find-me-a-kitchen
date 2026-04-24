import type { Metadata } from 'next'
import LicenceHelper from '@/components/LicenceHelper'

export const metadata: Metadata = {
  title: 'Street Food Licence Helper UK | Find Me a Kitchen',
  description: 'Find out exactly how to get a street food trading licence in your area. Step-by-step guides for all London boroughs and major UK cities including fees, documents required and direct application links.',
  keywords: ['street food licence UK', 'how to get a street food licence', 'street trading licence London', 'food trader licence', 'street food permit UK', 'council street trading licence'],
  openGraph: {
    title: 'Street Food Licence Helper UK | Find Me a Kitchen',
    description: 'Get your street food licence sorted. Personalised step-by-step guides for every London borough and major UK city.',
    type: 'website',
  },
}

export default function StreetFoodLicencePage() {
  return <LicenceHelper />
}
