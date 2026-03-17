'use client'

import Link from 'next/link'

interface Market {
  id: string
  name: string
  city: string
  type: 'food_hall' | 'indoor_market' | 'street_food' | 'farmers_market' | 'pop_up'
  difficulty: 'Easy' | 'Moderate' | 'Competitive' | 'Very Competitive'
  costs: string
  steps: string[]
  requirements: string[]
  tips: string[]
  applyUrl: string
  applyEmail?: string
  description: string
  realistic: string
}

const MARKETS: Market[] = [
  // LONDON
  {
    id: 'borough-market',
    name: 'Borough Market',
    city: 'London',
    type: 'indoor_market',
    difficulty: 'Very Competitive',
    costs: '£500-2000/week (varies by pitch)',
    steps: [
      'Watch their trader video on the website',
      'Complete expression of interest form',
      'Wait for contact IF your concept fits their gaps',
      'Invited to formal application stage',
      'Trial period before permanent spot'
    ],
    requirements: [
      'Strong provenance story',
      'Sustainability focus',
      'Unique product not already at market',
      'Food hygiene Level 2 minimum',
      '£5M public liability insurance'
    ],
    tips: [
      'They rarely have openings — check their specific opportunities page',
      'Seasonal/British produce is prioritised',
      'Don\'t apply if you\'re a reseller — they want makers and producers',
      'Build your brand elsewhere first, then approach'
    ],
    applyUrl: 'https://boroughmarket.org.uk/become-a-trader/',
    description: 'London\'s most prestigious food market. Premium positioning, massive footfall, but highly selective.',
    realistic: 'Only for established, differentiated food businesses with a strong story. Not for beginners.'
  },
  {
    id: 'kerb-inkerbator',
    name: 'KERB InKERBator',
    city: 'London',
    type: 'street_food',
    difficulty: 'Moderate',
    costs: 'Programme fee ~£500 + pitch fees during trading',
    steps: [
      'Check application window (quarterly intakes)',
      'Complete online application with photos, menu, concept',
      'Attend tasting/interview if shortlisted',
      'Join 8-week programme with mentorship',
      'Graduate to full KERB membership'
    ],
    requirements: [
      'Original food concept',
      'Passion and ambition',
      'Ability to take feedback',
      'Basic food business setup (or willingness to learn)',
      'Time commitment for 8-week programme'
    ],
    tips: [
      '78% of participants graduate — good odds if you get in',
      'Strong visuals matter — invest in good photos',
      'Show personality and passion in your application',
      'Graduates can trade at Seven Dials Market and other KERB locations'
    ],
    applyUrl: 'https://www.kerbfood.com/inkerbator/',
    description: 'London\'s premier street food incubator. 8-week programme with mentorship, market access, and a clear path to success.',
    realistic: 'Excellent option for passionate beginners who are coachable and committed. Structured and supportive.'
  },
  {
    id: 'mercato-metropolitano',
    name: 'Mercato Metropolitano',
    city: 'London',
    type: 'food_hall',
    difficulty: 'Moderate',
    costs: '£2,000-6,000/month',
    steps: [
      'Visit the market to understand the vibe',
      'Complete online trader application form',
      'Describe your concept and why it fits MM',
      'Await review from their team',
      'If successful, discuss terms and space'
    ],
    requirements: [
      'Authentic, artisanal food concept',
      'Sustainability focus (they\'re big on this)',
      'Quality ingredients and sourcing story',
      'Food hygiene certification',
      'Public liability insurance'
    ],
    tips: [
      'They prioritise sustainable and community-focused businesses',
      'Italian/Mediterranean concepts fit well but they want diversity',
      'Sites in Elephant & Castle and Mayfair — different vibes',
      'Be clear about what makes your concept unique'
    ],
    applyUrl: 'https://mercatometropolitano.com/traders-apply/',
    description: 'London\'s first sustainable community food market. Community-focused, artisanal traders.',
    realistic: 'Good for unique concepts with a sustainability angle. Apply with a clear vision.'
  },
  {
    id: 'tooting-market',
    name: 'Tooting Market',
    city: 'London',
    type: 'indoor_market',
    difficulty: 'Easy',
    costs: '£120-300/week',
    steps: [
      'Email admin@tootingmarket.com with your concept',
      'Arrange to visit and meet the market manager',
      'Discuss available spaces and terms',
      'Agree lease and move in'
    ],
    requirements: [
      'Food hygiene certification',
      'Public liability insurance',
      'Fits the market\'s diverse, community vibe'
    ],
    tips: [
      'Much less competitive than Borough Market',
      'Great multicultural food scene already',
      'Good for testing concepts before bigger markets',
      'Strong local community support'
    ],
    applyUrl: 'https://tootingmarket.com',
    applyEmail: 'admin@tootingmarket.com',
    description: 'Vibrant South London indoor market with diverse food traders. Affordable and accessible.',
    realistic: 'Excellent entry point. Affordable, straightforward application, genuine opportunity for newcomers.'
  },
  {
    id: 'camden-market',
    name: 'Camden Market',
    city: 'London',
    type: 'indoor_market',
    difficulty: 'Competitive',
    costs: '£200-800/week (varies by location within market)',
    steps: [
      'Visit camdenmarket.com/join-camden',
      'Complete the online application form',
      'Provide photos and details of your concept',
      'Email bookings@camdenmarket.com for stall enquiries',
      'Await response and potential tasting'
    ],
    requirements: [
      'Innovative and exciting food concept',
      'Food hygiene certification',
      'Public liability insurance',
      'Ability to fit Camden\'s eclectic vibe'
    ],
    tips: [
      'They curate carefully — uniqueness matters',
      'Weekend trading is busiest (and most competitive to get)',
      'Consider weekday spots to build a track record',
      'Camden has different zones — research which fits your concept'
    ],
    applyUrl: 'https://camdenmarket.com/join-camden',
    applyEmail: 'bookings@camdenmarket.com',
    description: 'Iconic London market with massive footfall. Mix of street food, restaurants, and stalls.',
    realistic: 'Competitive but achievable with a unique concept. More accessible than Borough Market.'
  },
  {
    id: 'greenwich-market',
    name: 'Greenwich Market',
    city: 'London',
    type: 'indoor_market',
    difficulty: 'Moderate',
    costs: '£50-150/day (casual), higher for regular spots',
    steps: [
      'Email menu and photos to market management',
      'Arrange one-to-one meeting if suitable',
      'Invited for exhibition day trading',
      'Assessed on grading system (quality, uniqueness, presentation)',
      'Progress to regular trading if successful'
    ],
    requirements: [
      'Unique, original products (no imports/reselling)',
      'High quality and presentation standards',
      'Food hygiene certification',
      'Public liability insurance'
    ],
    tips: [
      'They use a grading system — presentation matters',
      'UK-made/designed products rated highest',
      'Casual spots available to test before committing',
      'Strong tourist footfall but also locals'
    ],
    applyUrl: 'https://greenwichmarket.london/become-a-trader/',
    description: 'Historic covered market with strong creative and artisan focus. Tourist and local mix.',
    realistic: 'Achievable with quality product and good presentation. Casual trading available to test.'
  },
  {
    id: 'appear-here',
    name: 'Appear Here',
    city: 'Nationwide',
    type: 'pop_up',
    difficulty: 'Easy',
    costs: '£500-5,000/week (varies hugely by location)',
    steps: [
      'Browse spaces on appearhere.co.uk',
      'Filter by food & beverage, location, budget',
      'Click to enquire or instant book',
      'Agree terms with landlord via platform',
      'Move in — it\'s like Airbnb for retail'
    ],
    requirements: [
      'Varies by specific space',
      'Some spaces are move-in ready, others need fit-out',
      'Food hygiene certification for any food concept',
      'Public liability insurance'
    ],
    tips: [
      'Great for testing locations and concepts',
      'Short-term rentals from 1 day to 1 year',
      'Use filters to find food-ready spaces',
      'Book during quieter periods for better rates'
    ],
    applyUrl: 'https://www.appearhere.co.uk/',
    description: 'UK\'s leading marketplace for short-term retail and food spaces. Book online, flexible terms.',
    realistic: 'Very accessible — if you have budget, you can book instantly. Perfect for pop-ups and tests.'
  },

  // MANCHESTER
  {
    id: 'mackie-mayor',
    name: 'Mackie Mayor',
    city: 'Manchester',
    type: 'food_hall',
    difficulty: 'Very Competitive',
    costs: 'Undisclosed (premium)',
    steps: [
      'No public application form',
      'Build reputation elsewhere first',
      'Network at Manchester food events',
      'Approach via industry connections',
      'They typically headhunt successful traders'
    ],
    requirements: [
      'Established track record',
      'Exceptional food quality',
      'Strong brand and following',
      'Fits curated trader lineup'
    ],
    tips: [
      'Same owners as Altrincham Market — prove yourself there first',
      'They turn down 90%+ of approaches',
      'Focus on building your brand, let them come to you',
      'Manchester food scene is tight-knit — get known'
    ],
    applyUrl: 'https://mackiemayor.co.uk/',
    description: 'Premium Manchester food hall in Grade II listed building. Curated trader lineup, high standards.',
    realistic: 'Not for beginners. Build your reputation elsewhere, then approach or wait to be approached.'
  },
  {
    id: 'altrincham-market',
    name: 'Altrincham Market House',
    city: 'Manchester',
    type: 'food_hall',
    difficulty: 'Competitive',
    costs: 'Undisclosed',
    steps: [
      'Contact via website or market management',
      'Demonstrate quality and uniqueness',
      'Potential tasting or interview',
      'Discussion of available spaces'
    ],
    requirements: [
      'High-quality, original food concept',
      'Fits the artisan market vibe',
      'Food hygiene certification',
      'Public liability insurance'
    ],
    tips: [
      'Same management as Mackie Mayor',
      'Award-winning market — standards are high',
      'Success here can lead to Mackie Mayor opportunity',
      'Local/British sourcing valued'
    ],
    applyUrl: 'https://altrinchammarket.co.uk/',
    description: 'Award-winning food market that kickstarted Manchester\'s food hall revolution.',
    realistic: 'Competitive but more accessible than Mackie Mayor. Good stepping stone.'
  },

  // BIRMINGHAM
  {
    id: 'digbeth-dining-club',
    name: 'Digbeth Dining Club',
    city: 'Birmingham',
    type: 'street_food',
    difficulty: 'Competitive',
    costs: 'Pitch fees per event',
    steps: [
      'Apply via their website',
      'Submit concept, photos, menu',
      'Quality-focused selection process',
      'Invited to trade at events if successful'
    ],
    requirements: [
      'High-quality street food',
      'Original concept',
      'Professional setup and presentation',
      'Food hygiene certification'
    ],
    tips: [
      'They reject 75% of applications — quality is everything',
      'Midlands-based traders preferred but not required',
      'Build social following to strengthen application',
      'They\'re expanding to new venues — opportunities growing'
    ],
    applyUrl: 'https://digbethdiningclub.com/',
    description: 'Multi-award-winning street food events showcasing the best independent traders.',
    realistic: 'Competitive but achievable with a strong concept. Great platform if you get in.'
  },

  // LEEDS
  {
    id: 'kirkgate-market',
    name: 'Leeds Kirkgate Market',
    city: 'Leeds',
    type: 'indoor_market',
    difficulty: 'Easy',
    costs: 'Varies by stall size — new trader incentive available',
    steps: [
      'Submit enquiry form on Leeds Markets website',
      'Await contact from market management',
      'Discuss available spaces and terms',
      'Take advantage of new trader incentive (2 weeks half price, 2 weeks free)'
    ],
    requirements: [
      'Food hygiene certification',
      'Public liability insurance',
      'Complements existing trader mix'
    ],
    tips: [
      'One of the largest indoor markets in Europe — lots of footfall',
      'New trader incentive is excellent — low-risk way to test',
      'Council-run so process is straightforward',
      'Mix of permanent and casual trading available'
    ],
    applyUrl: 'https://markets.leeds.gov.uk/trade-our-markets/trade-kirkgate-market',
    applyEmail: 'markets@leeds.gov.uk',
    description: 'Historic and iconic Leeds market. Council-run with transparent application process.',
    realistic: 'Very accessible. New trader incentives make this low-risk for testing.'
  },

  // BRISTOL
  {
    id: 'st-nicholas-market',
    name: 'St Nicholas Market',
    city: 'Bristol',
    type: 'indoor_market',
    difficulty: 'Moderate',
    costs: 'Contact for pricing',
    steps: [
      'Review trading opportunities on Bristol Council website',
      'Decide which market suits you (Street Food, Indies, Corn Exchange)',
      'Complete application form',
      'Provide Level 2 hygiene certificate',
      'Await review and space allocation'
    ],
    requirements: [
      'Level 2 Food Hygiene certificate (mandatory before application)',
      'Original concept (not duplicating existing traders)',
      'Public liability insurance',
      'Food trailer/vehicle for street food pitches'
    ],
    tips: [
      'Multiple market types — research which fits your concept',
      'Street Food Market has weekly pitches available',
      'Historic venue in prime Bristol location',
      'Council-run with clear application process'
    ],
    applyUrl: 'https://www.bristol.gov.uk/st-nicholas-markets/trade-with-us',
    description: 'Bristol\'s iconic indoor market with street food, indie traders, and farmers market.',
    realistic: 'Accessible with the right concept. Council process is transparent.'
  },

  // LIVERPOOL
  {
    id: 'baltic-market',
    name: 'Baltic Market',
    city: 'Liverpool',
    type: 'street_food',
    difficulty: 'Competitive',
    costs: 'Undisclosed (revenue share typical)',
    steps: [
      'Research current trader lineup to identify gaps',
      'Contact via website or social media',
      'Submit concept and sample photos',
      'Potential tasting if shortlisted',
      'Negotiate terms if successful'
    ],
    requirements: [
      'High-quality street food concept',
      'Originality — must add something new',
      'Food hygiene certification',
      'Ability to handle busy weekend service'
    ],
    tips: [
      'Liverpool\'s first street food market — standards are high',
      'All traders are independent — community feel',
      'Weekends are packed — need to handle volume',
      'Also check Liverpool Council markets for alternatives'
    ],
    applyUrl: 'https://www.balticmarket.co.uk/',
    description: 'Liverpool\'s first and most popular street food market. Independent traders, great atmosphere.',
    realistic: 'Competitive but achievable. Need a strong concept that fills a gap.'
  },

  // EDINBURGH
  {
    id: 'stockbridge-market',
    name: 'Stockbridge Market',
    city: 'Edinburgh',
    type: 'farmers_market',
    difficulty: 'Moderate',
    costs: 'Contact for stall fees',
    steps: [
      'Visit the "Want to be a trader" page on their website',
      'Email traderstall@aol.com with your concept',
      'Include photos and menu details',
      'Arrange to meet market management',
      'Trial trading day if suitable'
    ],
    requirements: [
      'Quality artisan or food products',
      'Fits farmers market/artisan vibe',
      'Food hygiene certification',
      'Professional setup'
    ],
    tips: [
      'Same management runs Leith and Grassmarket markets',
      'Sundays only (Stockbridge) — manage your week accordingly',
      'Strong local and tourist footfall',
      'Success here can lead to spots at their other markets'
    ],
    applyUrl: 'https://www.stockbridgemarket.com/',
    applyEmail: 'traderstall@aol.com',
    description: 'Popular Edinburgh Sunday market. Artisan food, crafts, and street food.',
    realistic: 'Accessible for quality food traders. Email directly to enquire.'
  }
]

const difficultyColors = {
  'Easy': 'bg-green-100 text-green-800',
  'Moderate': 'bg-yellow-100 text-yellow-800',
  'Competitive': 'bg-orange-100 text-orange-800',
  'Very Competitive': 'bg-red-100 text-red-800'
}

const typeLabels = {
  'food_hall': 'Food Hall',
  'indoor_market': 'Indoor Market',
  'street_food': 'Street Food',
  'farmers_market': 'Farmers Market',
  'pop_up': 'Pop-up Spaces'
}

export default function MarketsPage() {
  const cities = [...new Set(MARKETS.map(m => m.city))].sort()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Find Me a Kitchen
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">UK Food Markets Guide</h1>
          <p className="text-xl text-emerald-100">
            How to get a stall at the UK's best food markets — honest advice on accessibility, costs, and application processes.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Before You Apply</h2>
          <p className="text-gray-600 mb-4">
            Not all markets are equally accessible. Some (like Borough Market) are extremely competitive and rarely have openings. 
            Others (like Leeds Kirkgate) actively welcome new traders with incentives.
          </p>
          <p className="text-gray-600">
            We've researched each market to give you <strong>realistic expectations</strong> about your chances and the steps involved. 
            Use our difficulty ratings to find markets that match your stage.
          </p>
        </div>
      </section>

      {/* Difficulty Key */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors['Easy']}`}>Easy</span>
            <span className="text-sm text-gray-500">Good for beginners</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors['Moderate']}`}>Moderate</span>
            <span className="text-sm text-gray-500">Achievable with prep</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors['Competitive']}`}>Competitive</span>
            <span className="text-sm text-gray-500">Need strong concept</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors['Very Competitive']}`}>Very Competitive</span>
            <span className="text-sm text-gray-500">Established traders only</span>
          </div>
        </div>
      </section>

      {/* Markets by City */}
      {cities.map(city => (
        <section key={city} className="max-w-4xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">{city}</h2>
          <div className="space-y-6">
            {MARKETS.filter(m => m.city === city).map(market => (
              <div key={market.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Market Header */}
                <div className="p-6 border-b">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{market.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-sm text-gray-500">{typeLabels[market.type]}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[market.difficulty]}`}>
                          {market.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Costs</div>
                      <div className="font-medium text-gray-900">{market.costs}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-600">{market.description}</p>
                </div>

                {/* Details */}
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  {/* Steps */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Steps to Apply</h4>
                    <ol className="space-y-2">
                      {market.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-600">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
                    <ul className="space-y-1.5">
                      {market.requirements.map((req, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-600">
                          <span className="text-emerald-500">✓</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tips */}
                <div className="px-6 pb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Tips for Success</h4>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {market.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-yellow-500">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Realistic Assessment */}
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Is it realistic?</h4>
                    <p className="text-sm text-gray-600">{market.realistic}</p>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="px-6 pb-6">
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={market.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Visit Website
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    {market.applyEmail && (
                      <a
                        href={`mailto:${market.applyEmail}`}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Email: {market.applyEmail}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-emerald-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Not sure which market is right for you?</h2>
          <p className="text-emerald-100 mb-6">
            Take our quick quiz and we'll recommend the best kitchen spaces and markets for your business.
          </p>
          <Link
            href="/match"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
          >
            Find Your Perfect Space
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>© 2026 Find Me a Kitchen. All rights reserved.</p>
          <p className="mt-2 text-sm">
            Information is researched and updated regularly but please verify with markets directly before applying.
          </p>
        </div>
      </footer>
    </div>
  )
}
