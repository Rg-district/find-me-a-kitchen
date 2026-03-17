'use client'

import Link from 'next/link'

interface Festival {
  id: string
  name: string
  type: 'music' | 'food' | 'family' | 'multi'
  dates: string
  location: string
  attendance: string
  pitchCost: string
  applicationDeadline: string
  difficulty: 'Easy' | 'Moderate' | 'Competitive' | 'Very Competitive'
  applyUrl: string
  applyVia?: string
  description: string
  whatTheyLookFor: string[]
  tips: string[]
  warnings?: string[]
  cashless?: boolean
  sustainabilityFocus?: boolean
}

const FESTIVALS: Festival[] = [
  // MAJOR MUSIC FESTIVALS
  {
    id: 'glastonbury',
    name: 'Glastonbury Festival',
    type: 'music',
    dates: 'Late June (5 days)',
    location: 'Pilton, Somerset',
    attendance: '200,000+',
    pitchCost: '£5,000 - £20,000+ (depends on pitch size/location)',
    applicationDeadline: 'November 1st (year before)',
    difficulty: 'Very Competitive',
    applyUrl: 'https://www.glastonburyfestivals.co.uk/information/traders/',
    description: 'The UK\'s most iconic festival. Massive opportunity but extremely competitive — thousands apply for limited spots.',
    whatTheyLookFor: [
      'Unique, quality food — not generic festival fare',
      'Strong visual presentation and stall design',
      'Environmental responsibility',
      'Proven track record at other events',
      'Original concept that adds to festival diversity'
    ],
    tips: [
      'Apply by November 1st — no exceptions',
      'Photos are crucial — invest in professional shots of your setup',
      'They review every application on merit, not first-come-first-served',
      'Build experience at smaller festivals first',
      'Highlight any sustainability credentials'
    ],
    warnings: [
      'Pitch costs are significant — ensure you can handle the investment',
      'You need to be fully self-sufficient (power, water, waste)',
      'Competition is fierce — many established traders apply yearly'
    ]
  },
  {
    id: 'boomtown',
    name: 'Boomtown Fair',
    type: 'music',
    dates: 'August (12-16 Aug 2026)',
    location: 'Matterley Estate, Winchester',
    attendance: '70,000+',
    pitchCost: 'Revenue share model (lower upfront costs)',
    applicationDeadline: 'Early in the year — check website',
    difficulty: 'Competitive',
    applyUrl: 'https://www.boomtownfair.co.uk/get-involved/traders/',
    description: 'Immersive theatrical festival with strong sustainability ethos. Revenue share model makes it more accessible than fixed-fee festivals.',
    whatTheyLookFor: [
      'Character and uniqueness',
      'Quality food with creative presentation',
      'Sustainability focus — huge priority',
      'Ability to fit the festival\'s theatrical world',
      'Businesses that align with their values'
    ],
    tips: [
      'Trading days are Wed-Sun — must be set up by Tuesday',
      'Cashless festival — they provide the payment system',
      'Revenue share reduces upfront risk',
      'Sustainability isn\'t optional — it\'s core to their selection'
    ],
    cashless: true,
    sustainabilityFocus: true
  },
  {
    id: 'reading-leeds',
    name: 'Reading & Leeds Festival',
    type: 'music',
    dates: 'August Bank Holiday weekend',
    location: 'Reading / Leeds',
    attendance: '90,000+ (each site)',
    pitchCost: 'Via Central Catering / RB Vernon — varies',
    applicationDeadline: 'Applications open January-March',
    difficulty: 'Competitive',
    applyUrl: 'https://rbvernon.co.uk/',
    applyVia: 'RB Vernon Ltd or Central Catering',
    description: 'Major rock/indie festival with huge young audience. Apply through official catering partners.',
    whatTheyLookFor: [
      'High-volume capability — these are busy festivals',
      'Quick service food that appeals to young audience',
      'Competitive pricing',
      'Professional setup and operation',
      'Relevant documentation (food hygiene, insurance)'
    ],
    tips: [
      'Apply through RB Vernon or Central Catering — they curate the food offering',
      'Must upload all documentation with your application',
      'High volume = high potential earnings, but also high pressure',
      'Consider whether your concept suits a rock festival audience'
    ]
  },
  {
    id: 'latitude',
    name: 'Latitude Festival',
    type: 'multi',
    dates: 'July',
    location: 'Henham Park, Suffolk',
    attendance: '40,000+',
    pitchCost: 'Via RB Vernon — varies',
    applicationDeadline: 'Applications open January-March',
    difficulty: 'Moderate',
    applyUrl: 'https://rbvernon.co.uk/',
    applyVia: 'RB Vernon Ltd',
    description: 'Arts and music festival with more upmarket, family-friendly audience. Better fit for quality artisan food.',
    whatTheyLookFor: [
      'Quality over volume',
      'Artisan and interesting food concepts',
      'Good presentation',
      'Family-friendly options appreciated'
    ],
    tips: [
      'More relaxed than Reading/Leeds — quality matters more',
      'Audience willing to pay for good food',
      'Arts festival vibe — creative presentation helps',
      'Apply through RB Vernon'
    ]
  },
  {
    id: 'camp-bestival',
    name: 'Camp Bestival',
    type: 'family',
    dates: 'July-August',
    location: 'Dorset & Shropshire',
    attendance: '30,000+',
    pitchCost: 'Contact organisers — varies',
    applicationDeadline: 'Early in the year',
    difficulty: 'Moderate',
    applyUrl: 'https://dorset.campbestival.net/',
    description: 'Family-focused festival — great for food that appeals to kids and parents alike.',
    whatTheyLookFor: [
      'Family-friendly food options',
      'Healthy options alongside treats',
      'Good value for money',
      'Safe and clean operation'
    ],
    tips: [
      'Think about what parents want to feed their kids',
      'Healthy options do well here',
      'Price sensitivity — families on budget',
      'Registration form available on website'
    ]
  },

  // FOOD-FOCUSED FESTIVALS
  {
    id: 'taste-of-london',
    name: 'Taste of London',
    type: 'food',
    dates: 'June 17-21, 2026',
    location: 'Regent\'s Park, London',
    attendance: '50,000+',
    pitchCost: 'Premium — contact for pricing',
    applicationDeadline: 'Months in advance',
    difficulty: 'Very Competitive',
    applyUrl: 'https://london.tastefestivals.com/bring-your-brand-to-taste/',
    description: 'London\'s premier food festival. 120+ restaurant dishes, celebrity chefs, premium audience.',
    whatTheyLookFor: [
      'Restaurant-quality food',
      'Established reputation',
      'Premium presentation',
      'Brand that fits the Taste portfolio'
    ],
    tips: [
      'This is premium territory — established restaurants mainly',
      'Good for brands wanting trade + consumer exposure',
      'Audience is food-savvy and willing to spend',
      'Consider if you\'re at the right stage for this'
    ],
    warnings: [
      'Not entry-level — better suited to established restaurants',
      'High costs but premium audience'
    ]
  },
  {
    id: 'great-british-food-festival',
    name: 'Great British Food Festival',
    type: 'food',
    dates: 'Multiple events across summer',
    location: 'Stately homes across UK',
    attendance: '2,000-6,000 per day',
    pitchCost: 'From £128/day (3m outside pitch)',
    applicationDeadline: 'Rolling applications',
    difficulty: 'Easy',
    applyUrl: 'https://greatbritishfoodfestival.com/traders/',
    description: 'Touring food festival at beautiful venues. More accessible than major music festivals.',
    whatTheyLookFor: [
      'Quality local and artisan produce',
      'Street food vendors',
      'Gift stall traders',
      'Variety to complement existing lineup'
    ],
    tips: [
      'Multiple events = multiple opportunities',
      'Historic venues attract quality-focused visitors',
      'Good for building festival experience',
      'Lower barrier to entry than major festivals'
    ]
  },
  {
    id: 'foodies-festival',
    name: 'Foodies Festival',
    type: 'food',
    dates: 'Multiple events May-September',
    location: 'Multiple UK cities (9 festivals in 2026)',
    attendance: 'Varies by location',
    pitchCost: '£200 per square metre (space only)',
    applicationDeadline: 'Rolling',
    difficulty: 'Easy',
    applyUrl: 'https://foodiesfestival.com/exhibit-with-us/',
    description: 'UK\'s largest touring celebrity food & music festival. Present across the country.',
    whatTheyLookFor: [
      'Food traders',
      'Producers',
      'Drinks brands',
      'Artisan vendors'
    ],
    tips: [
      'Can book multiple events across summer',
      'Price per square metre — plan your space needs',
      'Power and storage available at extra cost',
      'Good national coverage'
    ],
    warnings: [
      'Mixed reviews from traders online — research carefully',
      'Calculate total costs including space, power, storage',
      'Check footfall figures for specific locations'
    ]
  },
  {
    id: 'british-street-food-awards',
    name: 'British Street Food Awards',
    type: 'food',
    dates: 'Regional heats summer, finals autumn',
    location: 'Various UK locations',
    attendance: 'Varies',
    pitchCost: 'Entry fee + taster dish costs',
    applicationDeadline: 'August 25th typically',
    difficulty: 'Competitive',
    applyUrl: 'https://britishstreetfood.co.uk/awards-2025/',
    description: 'Competition rather than traditional pitch. Win recognition, press coverage, and industry credibility.',
    whatTheyLookFor: [
      'Outstanding street food',
      'Original concepts',
      'Quality of dish at £6.50 price point',
      'Sustainability credentials (separate award)'
    ],
    tips: [
      'Not a pitch opportunity — it\'s a competition',
      'Great for credibility and press if you place',
      '2,000+ applicants — competition is fierce',
      'Winners get year-round PR benefit'
    ]
  },

  // AGGREGATORS & NETWORKS
  {
    id: 'street-food-warehouse',
    name: 'Street Food Warehouse',
    type: 'multi',
    dates: 'Year-round (festivals + private events)',
    location: 'Nationwide',
    attendance: 'Varies',
    pitchCost: 'Free to join database — event-specific costs',
    applicationDeadline: 'Ongoing',
    difficulty: 'Easy',
    applyUrl: 'https://streetfoodwarehouse.co.uk/apply-to-trade/',
    description: 'Database connecting traders to festivals, weddings, and corporate events. Good for year-round opportunities.',
    whatTheyLookFor: [
      'Quality street food traders',
      'Professional setup',
      'Flexibility for different event types'
    ],
    tips: [
      'Free to join their database',
      'They pitch you for suitable events',
      'Good for private events and weddings',
      'Helps fill gaps between festival season'
    ]
  },
  {
    id: 'rb-vernon',
    name: 'RB Vernon (Festival Aggregator)',
    type: 'multi',
    dates: 'Festival season',
    location: 'Major UK festivals',
    attendance: 'N/A — aggregator',
    pitchCost: 'Varies by festival',
    applicationDeadline: 'January-March for summer season',
    difficulty: 'Moderate',
    applyUrl: 'https://rbvernon.co.uk/',
    description: 'Curates food traders for major festivals including Latitude, Reading, Leeds, Wilderness. One application can open multiple doors.',
    whatTheyLookFor: [
      'Documentation in order (food hygiene, registering authority, insurance)',
      'Professional operation',
      'Suitable concept for specific festivals'
    ],
    tips: [
      'Apply early — January for summer festivals',
      'Must have all documentation ready to upload',
      'Registering Authority details are mandatory',
      'One portal for multiple major festivals'
    ]
  },
  {
    id: 'caterfest',
    name: 'Caterfest',
    type: 'multi',
    dates: 'Festival season',
    location: 'Major UK festivals',
    attendance: 'N/A — aggregator',
    pitchCost: 'Varies',
    applicationDeadline: 'Ongoing',
    difficulty: 'Moderate',
    applyUrl: 'https://www.caterfest.co.uk/',
    description: 'Works with promoters and caterers to place traders at major festivals. Both sides of the market.',
    whatTheyLookFor: [
      'Quality food offerings',
      'Professional caterers',
      'Variety and balance'
    ],
    tips: [
      'Good for both finding pitches and understanding what festivals want',
      'Work with them to find the right events for your concept'
    ]
  }
]

const difficultyColors = {
  'Easy': 'bg-green-100 text-green-800',
  'Moderate': 'bg-yellow-100 text-yellow-800',
  'Competitive': 'bg-orange-100 text-orange-800',
  'Very Competitive': 'bg-red-100 text-red-800'
}

const typeLabels = {
  'music': '🎵 Music Festival',
  'food': '🍽️ Food Festival',
  'family': '👨‍👩‍👧 Family Festival',
  'multi': '🎪 Multi/Aggregator'
}

const typeColors = {
  'music': 'bg-purple-100 text-purple-800',
  'food': 'bg-orange-100 text-orange-800',
  'family': 'bg-blue-100 text-blue-800',
  'multi': 'bg-gray-100 text-gray-800'
}

export default function FestivalsPage() {
  const musicFestivals = FESTIVALS.filter(f => f.type === 'music')
  const foodFestivals = FESTIVALS.filter(f => f.type === 'food')
  const familyFestivals = FESTIVALS.filter(f => f.type === 'family')
  const aggregators = FESTIVALS.filter(f => f.type === 'multi')

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
      <section className="bg-gradient-to-b from-purple-600 to-purple-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">UK Festival Trading Guide</h1>
          <p className="text-xl text-purple-100">
            How to get a food pitch at UK festivals — from Glastonbury to local food fairs. Application tips, costs, and what organisers look for.
          </p>
        </div>
      </section>

      {/* Season Warning */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">Festival Season is Seasonal!</h3>
              <p className="text-yellow-700 mt-1">
                Most UK festivals run <strong>May-September</strong>. Applications often open <strong>6-12 months before</strong> the event.
                If you're reading this in summer, you're likely applying for <em>next year's</em> festivals.
              </p>
              <p className="text-yellow-700 mt-2">
                <strong>Key deadline:</strong> Glastonbury applications close November 1st for the following June.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Guide */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Before You Apply: Festival Trading Essentials</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">📋 What You'll Need</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Food Hygiene Level 2 certificate (minimum)</li>
                <li>• Public Liability Insurance (typically £5M)</li>
                <li>• Products Liability Insurance</li>
                <li>• Food business registration with local authority</li>
                <li>• Gas Safe certificate (if using LPG)</li>
                <li>• Fire extinguisher and safety equipment</li>
                <li>• Professional photos of your setup</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">💡 Tips for Success</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Start with smaller festivals to build track record</li>
                <li>• Invest in great photos — they make or break applications</li>
                <li>• Apply early — many festivals are first-qualified-served</li>
                <li>• Calculate ALL costs before committing (pitch + fuel + stock + staff)</li>
                <li>• Have a wet weather backup plan</li>
                <li>• Join NCASS for support and advice</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Music Festivals */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <span>🎵</span> Major Music Festivals
        </h2>
        <div className="space-y-6">
          {musicFestivals.map(festival => (
            <FestivalCard key={festival.id} festival={festival} />
          ))}
        </div>
      </section>

      {/* Food Festivals */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <span>🍽️</span> Food Festivals
        </h2>
        <div className="space-y-6">
          {foodFestivals.map(festival => (
            <FestivalCard key={festival.id} festival={festival} />
          ))}
        </div>
      </section>

      {/* Family Festivals */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <span>👨‍👩‍👧</span> Family Festivals
        </h2>
        <div className="space-y-6">
          {familyFestivals.map(festival => (
            <FestivalCard key={festival.id} festival={festival} />
          ))}
        </div>
      </section>

      {/* Aggregators */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <span>🎪</span> Festival Networks & Aggregators
        </h2>
        <p className="text-gray-600 mb-6">
          These organisations connect traders with multiple festivals. One application can open doors to several events.
        </p>
        <div className="space-y-6">
          {aggregators.map(festival => (
            <FestivalCard key={festival.id} festival={festival} />
          ))}
        </div>
      </section>

      {/* Application Timeline */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📅 Typical Application Timeline</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-24 flex-shrink-0 font-medium text-purple-600">Sept-Nov</div>
              <div className="text-gray-600">Major festival applications open (Glastonbury, etc.)</div>
            </div>
            <div className="flex gap-4">
              <div className="w-24 flex-shrink-0 font-medium text-purple-600">Jan-Mar</div>
              <div className="text-gray-600">RB Vernon and aggregator applications for summer season</div>
            </div>
            <div className="flex gap-4">
              <div className="w-24 flex-shrink-0 font-medium text-purple-600">Mar-Apr</div>
              <div className="text-gray-600">Confirmations and contracts signed</div>
            </div>
            <div className="flex gap-4">
              <div className="w-24 flex-shrink-0 font-medium text-purple-600">May-Sept</div>
              <div className="text-gray-600">Festival season! 🎉</div>
            </div>
            <div className="flex gap-4">
              <div className="w-24 flex-shrink-0 font-medium text-purple-600">Sept-Oct</div>
              <div className="text-gray-600">Review season — what worked, what didn't. Plan for next year.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Need a kitchen to prep before festivals?</h2>
          <p className="text-purple-100 mb-6">
            Find production kitchens, commissary spaces, and prep facilities across the UK.
          </p>
          <Link
            href="/match"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            Find a Kitchen
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>© 2026 Find Me a Kitchen. All rights reserved.</p>
          <p className="mt-2 text-sm">
            Festival dates and costs change annually. Always verify with organisers before applying.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FestivalCard({ festival }: { festival: Festival }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{festival.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[festival.type]}`}>
                {typeLabels[festival.type]}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[festival.difficulty]}`}>
                {festival.difficulty}
              </span>
              {festival.cashless && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  💳 Cashless
                </span>
              )}
              {festival.sustainabilityFocus && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🌱 Eco Focus
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-gray-600">{festival.description}</p>
      </div>

      {/* Key Info */}
      <div className="p-6 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-500">📅 When</div>
          <div className="font-medium text-gray-900">{festival.dates}</div>
        </div>
        <div>
          <div className="text-gray-500">📍 Where</div>
          <div className="font-medium text-gray-900">{festival.location}</div>
        </div>
        <div>
          <div className="text-gray-500">👥 Attendance</div>
          <div className="font-medium text-gray-900">{festival.attendance}</div>
        </div>
        <div>
          <div className="text-gray-500">💰 Pitch Cost</div>
          <div className="font-medium text-gray-900">{festival.pitchCost}</div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 grid md:grid-cols-2 gap-6">
        {/* What They Look For */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">What They Look For</h4>
          <ul className="space-y-1.5">
            {festival.whatTheyLookFor.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-purple-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Tips</h4>
          <ul className="space-y-1.5">
            {festival.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-yellow-500">💡</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Warnings */}
      {festival.warnings && festival.warnings.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Things to Consider</h4>
            <ul className="space-y-1">
              {festival.warnings.map((warning, i) => (
                <li key={i} className="text-sm text-red-700">{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Application Info */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm text-gray-500">
            <strong>Deadline:</strong> {festival.applicationDeadline}
            {festival.applyVia && <span className="ml-2">• Apply via: {festival.applyVia}</span>}
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div className="px-6 pb-6">
        <a
          href={festival.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Apply / Learn More
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
