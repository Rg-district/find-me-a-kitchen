'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, MapPin, PoundSterling } from 'lucide-react'

// Provider data - pulled from our database
const PROVIDERS: Record<string, Provider[]> = {
  'dark-kitchens': [
    { id: 'karma-kitchen', name: 'Karma Kitchen', cities: ['London'], priceRange: '£1,500-4,000/mo', website: 'https://karmakitchen.co', description: 'Londons largest dark kitchen operator with 100+ locations. Flexible terms from 1 month.' },
    { id: 'deliveroo-editions', name: 'Deliveroo Editions', cities: ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Liverpool', 'Brighton', 'Nottingham', 'Edinburgh'], priceRange: '£2,500-6,000/mo', website: 'https://restaurants.deliveroo.com/editions', description: 'Official Deliveroo dark kitchens with guaranteed delivery platform presence.' },
    { id: 'foodstars', name: 'FoodStars (CloudKitchens)', cities: ['London'], priceRange: '£1,800-4,500/mo', website: 'https://www.cloudkitchens.com', description: 'Affordable entry-level dark kitchen spaces. Good for testing delivery concepts.' },
    { id: 'one-kcn', name: 'One KCN', cities: ['London'], priceRange: '£1,800-5,000/mo', website: 'https://www.onekcn.com', description: 'Premium ghost kitchens in Fulham, SW6. Equipment financing available.' },
    { id: 'ready-kitchen', name: 'Ready Kitchen', cities: ['London'], priceRange: '£2,000-4,500/mo', website: 'https://www.readykitchen.co.uk', description: 'Turnkey dark kitchens in Canary Wharf. High delivery demand area.' },
    { id: 'chefs-lab', name: 'Chefs Lab', cities: ['Birmingham'], priceRange: '£1,500-4,000/mo', website: 'https://chefslab.co.uk', description: 'Commercial dark kitchens in Birmingham. Deliveroo & Uber Eats ready.' },
    { id: 'ghost-x-kitchens', name: 'Ghost x Kitchens', cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'], priceRange: '£1,800-4,500/mo', website: 'https://ghostxkitchens.co.uk', description: 'Modern dark kitchen spaces for digital-first food brands.' },
    { id: 'boxb-bristol', name: 'BoxB.', cities: ['Bristol'], priceRange: '£1,200-3,000/mo', website: 'https://www.boxb.co.uk', description: 'Central Bristol dark kitchens in modular shipping container units. Short-term contracts, built for delivery brands.' },
    { id: 'jacuna-kitchens', name: 'Jacuna Kitchens', cities: ['London', 'Birmingham', 'Leeds', 'Manchester', 'Bristol'], priceRange: '£2,500-6,000/mo', website: 'https://jacunakitchens.com', description: 'Growing dark kitchen network across major UK cities.' },
    { id: 'papi-kitchens', name: 'Papi Kitchens', cities: ['London'], priceRange: '£2,000-4,000/mo', website: 'https://papikitchens.com', description: 'East London dark kitchens with a community focus.' },
    { id: 'the-co-kitchens', name: 'The Co-Kitchens', cities: ['London'], priceRange: '£1,200-4,000/mo', website: 'https://theco-kitchens.com', description: 'Community-focused cloud kitchen. Great for R&D and product development.' },
    { id: 'growth-kitchen', name: 'Growth Kitchen', cities: ['London', 'Nationwide'], priceRange: '£2,000-5,000/mo', website: 'https://growthkitchen.com', description: 'Satellite kitchen network for established brands. Tortilla, Tai Kitchen partners.' },
  ],
  'shared-kitchens': [
    { id: 'mission-kitchen', name: 'Mission Kitchen', cities: ['London'], priceRange: '£15-45/hr', website: 'https://missionkitchen.org', description: 'Social enterprise offering affordable hourly kitchen access for food startups.' },
    { id: 'sharethere', name: 'ShareThere', cities: ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds'], priceRange: '£18-85/hr', website: 'https://sharethere.com', description: 'Book commercial kitchen space by the hour. Multiple locations.' },
    { id: 'sharedining', name: 'ShareDining', cities: ['London', 'Leeds'], priceRange: '£15-50/hr', website: 'https://sharedining.co.uk', description: 'Kitchen marketplace in schools, church halls, cafes. Affordable hourly rates.' },
    { id: 'n4-kitchen-hire', name: 'N4 Kitchen Hire', cities: ['London'], priceRange: '£100/hr', website: 'https://www.n4kitchenhire.co.uk', description: '5-star hygiene, 24hr access. North London. Ideal for market traders.' },
    { id: 'maida-hill-place', name: 'Maida Hill Place', cities: ['London'], priceRange: '£15-40/hr', website: 'https://www.maidahillplace.co.uk', description: 'Community kitchen in Westminster. Business development support included.' },
    { id: 'encore-kitchens', name: 'Encore Kitchens', cities: ['London', 'Birmingham', 'Manchester'], priceRange: '£150-400/day', website: 'https://encorekitchens.co.uk', description: 'Day-rate production kitchens. Professional facilities for serious producers.' },
    { id: 'northern-kitchen-hire', name: 'Northern Kitchen Hire', cities: ['Leeds'], priceRange: '£15-35/hr', website: 'https://ncass.org.uk/commercial-kitchen-spaces-to-rent', description: '2500 sq ft kitchens. Walk-in fridge, combi oven, brat pan.' },
    { id: 'ncass-kitchen', name: 'NCASS Production Kitchen', cities: ['Leeds'], priceRange: '£20-50/hr', website: 'https://ncass.org.uk', description: 'Professional production kitchen by the National Caterers Association.' },
    { id: 'fulham-kitchen', name: 'Fulham Kitchen', cities: ['London'], priceRange: '£20-50/hr', website: 'https://fulhamkitchen.co.uk', description: 'West London shared kitchen for caterers and food startups.' },
    { id: 'food-works-sw', name: 'Food Works SW', cities: ['Bristol'], priceRange: '£15-40/hr', website: 'https://foodworkssw.org', description: 'Bristol community kitchen supporting local food businesses.' },
  ],
  'mobile-units': [
    { id: 'amobox', name: 'Amobox', cities: ['Nationwide'], priceRange: '£35,000-95,000', website: 'https://amobox.com', description: 'Premium custom food truck and trailer conversions. Design-led.' },
    { id: 'tudor-trailers', name: 'Tudor Trailers', cities: ['Nationwide'], priceRange: '£15,000-45,000', website: 'https://tudortrailers.co.uk', description: 'Long-established UK catering trailer manufacturer. VCA approved.' },
    { id: 'jiffy-trucks', name: 'Jiffy Trucks', cities: ['Nationwide'], priceRange: '£18,000-55,000', website: 'https://cateringtrucks.co.uk', description: 'Specialist catering vehicle builder for hot food operations.' },
    { id: 'maxi-mover', name: 'Maxi Mover', cities: ['Nationwide'], priceRange: '£25,000-65,000', website: 'https://www.maximover.co.uk', description: 'Low-floor van specialists. Lightweight Hexlite materials. Direct from factory.' },
    { id: 'raccoon-vehicles', name: 'Raccoon Vehicles', cities: ['Nationwide'], priceRange: '£35,000-100,000', website: 'https://www.raccoon.co.uk', description: 'High-end bespoke vehicle conversions. Exhibition & sampling specialists.' },
    { id: '4sure-catering', name: '4Sure Catering', cities: ['Nationwide'], priceRange: '£15,000-60,000', website: 'https://4sure.co.uk', description: 'Established catering trailer and van manufacturer. Full product range.' },
    { id: 'ar-willis', name: 'A&R Willis', cities: ['Nationwide'], priceRange: '£12,000-45,000', website: 'https://arwilliscateringtrailers.co.uk', description: 'Family-run VCA-approved trailer manufacturer. 20+ years experience.' },
    { id: 'food-truck-masters', name: 'Food Truck Masters', cities: ['Nationwide'], priceRange: '£25,000-80,000', website: 'https://foodtruckmasters.com', description: 'Vintage food truck restoration specialists. Head-turning builds.' },
    { id: 'the-big-coffee', name: 'The Big Coffee', cities: ['Nationwide'], priceRange: '£15,000-55,000', website: 'https://thebigcoffee.com', description: 'Piaggio Ape and horsebox specialists. Coffee, pizza, artisan concepts.' },
    { id: 'towability', name: 'Towability', cities: ['Nationwide'], priceRange: '£20,000-65,000', website: 'https://towability.com', description: 'Citroen H-Van and vintage vehicle conversions. Retro designs.' },
    { id: 'karpatia-trucks', name: 'Karpatia Trucks', cities: ['Nationwide'], priceRange: '£12,000-45,000', website: 'https://karpatiatrucks.com', description: 'Horsebox conversion specialists with full business support package.' },
    { id: 'catering-units', name: 'Catering Units UK', cities: ['Nationwide'], priceRange: '£10,000-35,000', website: 'https://cateringunits.co.uk', description: 'Family business with 25+ years experience. Reliable builds.' },
    { id: 'coffee-latino', name: 'Coffee Latino', cities: ['Nationwide'], priceRange: '£8,000-35,000', website: 'https://coffeelatino.co.uk', description: 'Coffee-focused horsebox conversions. Great entry prices.' },
    { id: 'ghst-ktchn', name: 'Ghst Ktchn', cities: ['Nationwide'], priceRange: '£30,000-75,000', website: 'https://ghstktchn.com', description: 'Modern street food vehicle conversions. Instagram-worthy builds.' },
    { id: 'bistro-trailers', name: 'Bistro Trailers', cities: ['Nationwide'], priceRange: '£20,000-55,000', website: 'https://bistrotrailers.co.uk', description: 'Premium European-influenced designs. Artisan food operations.' },
    { id: 'pizza-trailer-co', name: 'Pizza Trailer Company', cities: ['Nationwide'], priceRange: '£18,000-50,000', website: 'https://pizzatrailercompany.co.uk', description: 'Specialist pizza trailer conversions. Wood-fired oven options.' },
    { id: 'catering-van-conversions', name: 'Catering Van Conversions', cities: ['Nationwide'], priceRange: '£15,000-50,000', website: 'https://cateringvanconversions.com', description: 'Custom-built catering vans. Good value pricing.' },
    { id: 'premier-catering', name: 'Premier Catering Manufacture', cities: ['Nationwide'], priceRange: '£18,000-55,000', website: 'https://commercialkitchencompany.co.uk', description: 'Specialist mobile catering van and trailer conversions.' },
    { id: 'mobile-retail-group', name: 'Mobile Retail Group', cities: ['Nationwide'], priceRange: '£20,000-70,000', website: 'https://mobileretailgroup.com', description: 'Premium mobile catering. Corporate and event specialists.' },
  ],
  'marketplaces': [
    { id: 'kitchen-space-rentals', name: 'Kitchen Space Rentals', cities: ['Nationwide'], priceRange: 'Various', website: 'https://kitchenspacerentals.com', description: '1,500+ commercial kitchens for rent across 34 UK cities. Directory.' },
    { id: 'ncass-classifieds', name: 'NCASS Classifieds', cities: ['Nationwide'], priceRange: 'Various', website: 'https://ncass.org.uk', description: 'National Caterers Association marketplace. Trusted industry body.' },
    { id: 'oya', name: 'Oya', cities: ['Nationwide'], priceRange: 'Various', website: 'https://www.oya.co.uk', description: 'UK property marketplace for food businesses. Kitchens, restaurants, takeaways.' },
    { id: 'dephna', name: 'Dephna', cities: ['London'], priceRange: 'Various', website: 'https://www.dephna.com', description: 'Kitchen and storage spaces across London. Multiple NW10 locations.' },
  ],
}

const CATEGORY_INFO: Record<string, { title: string; description: string; icon: string }> = {
  'dark-kitchens': {
    title: 'Dark Kitchens',
    description: 'Delivery-only kitchens designed for Deliveroo, Uber Eats, and Just Eat. No customer-facing space — just cooking and delivery.',
    icon: '🔥',
  },
  'shared-kitchens': {
    title: 'Shared Kitchens',
    description: 'Rent commercial kitchen space by the hour or day. Perfect for caterers, food startups, and production.',
    icon: '👨‍🍳',
  },
  'mobile-units': {
    title: 'Mobile Units',
    description: 'Food trucks, trailers, and van conversions. Buy or commission a custom mobile catering unit.',
    icon: '🚚',
  },
  'marketplaces': {
    title: 'Kitchen Marketplaces',
    description: 'Directories and platforms listing multiple kitchen spaces. Search and compare options.',
    icon: '🔍',
  },
}

interface Provider {
  id: string
  name: string
  cities: string[]
  priceRange: string
  website: string
  description: string
}

export default function CategoryPage() {
  const params = useParams()
  const category = params.category as string
  
  const providers = PROVIDERS[category] || []
  const info = CATEGORY_INFO[category]
  
  if (!info) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
          <Link href="/" className="text-emerald-600 hover:underline">Go back home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{info.icon}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{info.title}</h1>
              <p className="text-gray-600 mt-1">{info.description}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">{providers.length} providers</p>
        </div>
      </div>

      {/* Provider Grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <a
              key={provider.id}
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:border-emerald-200 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">
                  {provider.name}
                </h3>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{provider.description}</p>
              
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{provider.cities.slice(0, 3).join(', ')}{provider.cities.length > 3 ? ` +${provider.cities.length - 3}` : ''}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                  <PoundSterling className="w-4 h-4" />
                  <span>{provider.priceRange}</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-emerald-50 rounded-2xl p-6 text-center mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Not sure which is right for you?</h3>
          <p className="text-gray-600 mb-4">Answer a few questions and get personalised recommendations</p>
          <Link
            href="/match"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Find Your Perfect Kitchen
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Find Me a Kitchen. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
