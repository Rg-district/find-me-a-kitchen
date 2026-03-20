'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, MapPin, Search, ArrowLeft } from 'lucide-react'

// ════════════════════════════════════════════════════════════════
// COMBINED MARKETS + FESTIVALS DATABASE
// ════════════════════════════════════════════════════════════════

interface EventEntry {
  id: string
  name: string
  type: 'market' | 'festival' | 'aggregator'
  subtype: string
  city: string
  region: string
  dates: string
  costs: string
  cuisineMatch: string[]
  difficulty: 'Easy' | 'Moderate' | 'Competitive' | 'Very Competitive'
  applicationProcess: string
  fees: string
  requirements: string[]
  tips: string[]
  url: string
  email?: string
  attendance?: string
  description: string
}

const EVENTS: EventEntry[] = [
  // ═══ LONDON MARKETS ═══
  {
    id: 'borough-market',
    name: 'Borough Market',
    type: 'market',
    subtype: 'Indoor Market',
    city: 'London',
    region: 'London',
    dates: 'Year-round (Wed-Sat)',
    costs: '£500-2,000/week',
    cuisineMatch: ['any', 'artisan', 'international', 'british', 'bakery', 'seafood'],
    difficulty: 'Very Competitive',
    applicationProcess: 'Online application → tasting → trial day → waitlist. Expect 6-12 months.',
    fees: '£500-2,000/week depending on pitch size and location',
    requirements: ['Food hygiene Level 3', 'Public liability insurance £5M', 'Unique product offering', 'Professional presentation'],
    tips: ['Apply with something Borough doesn\'t already have', 'Photos and branding matter hugely', 'Start at smaller markets first to build a track record'],
    url: 'https://boroughmarket.org.uk/traders',
    description: 'London\'s most prestigious food market. 1,000+ years of history. Massive footfall but extremely competitive entry.'
  },
  {
    id: 'kerb',
    name: 'KERB',
    type: 'market',
    subtype: 'Street Food',
    city: 'London',
    region: 'London',
    dates: 'Year-round (multiple locations)',
    costs: '20-25% commission',
    cuisineMatch: ['any', 'street_food', 'international', 'fusion', 'asian', 'mexican', 'caribbean'],
    difficulty: 'Competitive',
    applicationProcess: 'Apply via website → cook-off audition → trial at a quieter site → full rotation.',
    fees: '20-25% of takings (no upfront pitch fee)',
    requirements: ['Food hygiene Level 2+', 'Public liability insurance', 'Strong brand identity', 'Pass cook-off audition'],
    tips: ['The cook-off is your moment — bring your A-game', 'They value personality and story as much as food', 'Follow them on socials and attend as a customer first'],
    url: 'https://www.kerbfood.com/apply',
    description: 'London\'s top street food collective. Multiple locations including King\'s Cross, Paddington, and Seven Dials.'
  },
  {
    id: 'mercato-metropolitano',
    name: 'Mercato Metropolitano',
    type: 'market',
    subtype: 'Food Hall',
    city: 'London',
    region: 'London',
    dates: 'Year-round (daily)',
    costs: '£2,000-5,000/month',
    cuisineMatch: ['any', 'italian', 'international', 'artisan', 'organic', 'vegan'],
    difficulty: 'Moderate',
    applicationProcess: 'Email or apply online → meeting → trial period.',
    fees: '£2,000-5,000/month rent + some commission arrangements',
    requirements: ['Sustainability focus preferred', 'Food hygiene certification', 'Insurance'],
    tips: ['They have a strong sustainability ethos — align with it', 'Elephant & Castle location has huge student footfall'],
    url: 'https://www.mercatometropolitano.com',
    email: 'info@mercatometropolitano.com',
    description: 'Community food market in Elephant & Castle with strong sustainability focus.'
  },
  {
    id: 'tooting-market',
    name: 'Tooting Market',
    type: 'market',
    subtype: 'Indoor Market',
    city: 'London',
    region: 'London',
    dates: 'Year-round (daily)',
    costs: '£800-2,000/month',
    cuisineMatch: ['any', 'international', 'caribbean', 'asian', 'african', 'street_food'],
    difficulty: 'Moderate',
    applicationProcess: 'Contact market management → viewing → lease negotiation.',
    fees: '£800-2,000/month depending on unit size',
    requirements: ['Food hygiene certification', 'Insurance', 'Fit-out costs (own equipment)'],
    tips: ['Very multicultural area — authentic cuisines do well', 'Lower rents than central London markets', 'Strong local community following'],
    url: 'https://tootingmarket.com',
    description: 'Vibrant south London market with diverse food stalls and strong community vibe.'
  },
  // ═══ MANCHESTER ═══
  {
    id: 'mackie-mayor',
    name: 'Mackie Mayor',
    type: 'market',
    subtype: 'Food Hall',
    city: 'Manchester',
    region: 'North West',
    dates: 'Year-round (daily)',
    costs: '£2,000-4,000/month',
    cuisineMatch: ['any', 'artisan', 'international', 'british', 'asian', 'bakery'],
    difficulty: 'Competitive',
    applicationProcess: 'Apply via GRUB Manchester network or direct approach.',
    fees: '£2,000-4,000/month plus service charges',
    requirements: ['Strong brand identity', 'Food hygiene certification', 'Insurance', 'Quality-first approach'],
    tips: ['Beautiful Grade II listed building — presentation matters', 'Part of the GRUB Manchester family'],
    url: 'https://mackiemayor.co.uk',
    description: 'Stunning Grade II listed food hall in Manchester\'s Northern Quarter.'
  },
  {
    id: 'altrincham-market',
    name: 'Altrincham Market',
    type: 'market',
    subtype: 'Indoor Market',
    city: 'Manchester',
    region: 'North West',
    dates: 'Year-round (Tue-Sun)',
    costs: '£600-1,500/month',
    cuisineMatch: ['any', 'artisan', 'british', 'bakery', 'organic'],
    difficulty: 'Moderate',
    applicationProcess: 'Contact market house directly → application → trial.',
    fees: '£600-1,500/month',
    requirements: ['Quality focus', 'Food hygiene', 'Insurance'],
    tips: ['Affluent area — premium products work well', 'The market that kickstarted Manchester\'s market revival'],
    url: 'https://altrinchammarket.co.uk',
    description: 'The market that started Manchester\'s food market revolution. Affluent suburb with strong foodie culture.'
  },
  // ═══ BIRMINGHAM ═══
  {
    id: 'digbeth-dining-club',
    name: 'Digbeth Dining Club',
    type: 'market',
    subtype: 'Street Food Events',
    city: 'Birmingham',
    region: 'West Midlands',
    dates: 'Weekly events (Fri-Sat)',
    costs: 'Commission-based (~20%)',
    cuisineMatch: ['any', 'street_food', 'international', 'fusion', 'bbq', 'asian'],
    difficulty: 'Moderate',
    applicationProcess: 'Apply via website or email → tasting → rotation.',
    fees: '~20% commission on takings',
    requirements: ['Street food setup', 'Insurance', 'Food hygiene'],
    tips: ['Birmingham\'s go-to street food event', 'Great stepping stone for new traders', 'Strong social media presence helps'],
    url: 'https://digbethdiningclub.com',
    email: 'hello@digbethdiningclub.com',
    description: 'Birmingham\'s original and best street food event. Weekly Friday night sessions in Digbeth.'
  },
  // ═══ LEEDS ═══
  {
    id: 'leeds-kirkgate',
    name: 'Leeds Kirkgate Market',
    type: 'market',
    subtype: 'Indoor Market',
    city: 'Leeds',
    region: 'Yorkshire',
    dates: 'Year-round (Mon-Sat)',
    costs: '£400-1,200/month',
    cuisineMatch: ['any', 'british', 'international', 'bakery', 'caribbean', 'asian'],
    difficulty: 'Moderate',
    applicationProcess: 'Contact Leeds Markets team → application → allocation.',
    fees: '£400-1,200/month (council-managed, affordable)',
    requirements: ['Food hygiene', 'Insurance', 'Market trader licence'],
    tips: ['Largest covered market in Europe', 'Very affordable compared to other cities', 'Strong daily footfall from city centre'],
    url: 'https://www.leeds.gov.uk/leedsmarkets',
    description: 'Europe\'s largest covered market. Affordable entry point in a major city.'
  },
  // ═══ BRISTOL ═══
  {
    id: 'st-nicholas-bristol',
    name: 'St Nicholas Market',
    type: 'market',
    subtype: 'Indoor Market',
    city: 'Bristol',
    region: 'South West',
    dates: 'Year-round (daily)',
    costs: '£500-1,500/month',
    cuisineMatch: ['any', 'street_food', 'international', 'vegan', 'organic', 'artisan'],
    difficulty: 'Competitive',
    applicationProcess: 'Contact Bristol City Council markets team → waitlist.',
    fees: '£500-1,500/month',
    requirements: ['Food hygiene', 'Insurance'],
    tips: ['Bristol has a very strong food scene', 'Vegan/vegetarian options do particularly well', 'The Wednesday market is the busiest'],
    url: 'https://stnicholasmarketbristol.co.uk',
    description: 'Bristol\'s historic market. Strong food culture city with high demand for quality traders.'
  },
  // ═══ EDINBURGH ═══
  {
    id: 'edinburgh-markets',
    name: 'Edinburgh Farmers\' Market',
    type: 'market',
    subtype: 'Farmers Market',
    city: 'Edinburgh',
    region: 'Scotland',
    dates: 'Every Saturday',
    costs: '£50-150/day',
    cuisineMatch: ['any', 'artisan', 'british', 'scottish', 'bakery', 'organic'],
    difficulty: 'Moderate',
    applicationProcess: 'Apply to Edinburgh Farmers\' Market CIC → assessment.',
    fees: '£50-150/day stall fee',
    requirements: ['Local/Scottish produce preferred', 'Food hygiene', 'Insurance'],
    tips: ['Tourist footfall excellent in summer', 'Castle Terrace location is premium', 'Scottish provenance is a selling point'],
    url: 'https://www.edinburghfarmersmarket.co.uk',
    description: 'Weekly farmers\' market at Castle Terrace with excellent tourist and local footfall.'
  },
  // ═══ FESTIVALS ═══
  {
    id: 'glastonbury',
    name: 'Glastonbury Festival',
    type: 'festival',
    subtype: 'Music Festival',
    city: 'Pilton, Somerset',
    region: 'South West',
    dates: 'Late June (5 days)',
    costs: '£3,000-20,000+ pitch fee',
    attendance: '210,000',
    cuisineMatch: ['any', 'street_food', 'vegan', 'international', 'bbq', 'mexican', 'asian'],
    difficulty: 'Very Competitive',
    applicationProcess: 'Apply September for following year → selection → deposit. 6-12 month lead time.',
    fees: '£3,000-20,000+ depending on pitch location and size',
    requirements: ['Extensive festival trading experience', 'Full catering setup', 'Gas safety certificates', 'Substantial insurance', 'Food hygiene Level 3'],
    tips: ['Apply in September the year before', 'Need proven festival track record', 'Revenue potential: £20,000-100,000+ over 5 days', 'The most prestigious festival pitch in the UK'],
    url: 'https://www.glastonburyfestivals.co.uk/information/trading/',
    description: 'The world\'s most famous music festival. Extremely competitive but potentially life-changing revenue.'
  },
  {
    id: 'boomtown',
    name: 'Boomtown Fair',
    type: 'festival',
    subtype: 'Music Festival',
    city: 'Winchester, Hampshire',
    region: 'South East',
    dates: 'August (5 days)',
    costs: '£1,500-8,000 pitch fee',
    attendance: '75,000',
    cuisineMatch: ['any', 'street_food', 'vegan', 'international', 'caribbean', 'mexican', 'asian'],
    difficulty: 'Competitive',
    applicationProcess: 'Online application opens January → selection by March.',
    fees: '£1,500-8,000 depending on district and pitch size',
    requirements: ['Festival experience preferred', 'Full catering setup', 'Insurance', 'Gas certificates'],
    tips: ['Known for quality food — they curate carefully', 'Different districts have different vibes and price points', 'Vegan options are hugely popular here'],
    url: 'https://www.boomtownfair.co.uk',
    description: 'Creative, immersive festival with strong food curation. Great for unique/themed food businesses.'
  },
  {
    id: 'reading-leeds',
    name: 'Reading & Leeds Festival',
    type: 'festival',
    subtype: 'Music Festival',
    city: 'Reading / Leeds',
    region: 'Multiple',
    dates: 'August Bank Holiday (3 days)',
    costs: '£2,000-10,000 pitch fee',
    attendance: '90,000 per site',
    cuisineMatch: ['any', 'street_food', 'fast_food', 'bbq', 'pizza', 'burgers'],
    difficulty: 'Competitive',
    applicationProcess: 'Apply through Festival Republic → selection.',
    fees: '£2,000-10,000+ per site',
    requirements: ['Commercial catering experience', 'Full setup', 'Insurance', 'Gas safety'],
    tips: ['Young crowd — affordable, fast food works best', 'Two sites means double the opportunity (and cost)', 'High volume, fast service is key'],
    url: 'https://www.readingfestival.com',
    description: 'Two-site festival (Reading + Leeds) with young audience. High volume potential.'
  },
  {
    id: 'taste-of-london',
    name: 'Taste of London',
    type: 'festival',
    subtype: 'Food Festival',
    city: 'London',
    region: 'London',
    dates: 'June & November',
    costs: '£2,000-15,000',
    attendance: '40,000',
    cuisineMatch: ['any', 'fine_dining', 'artisan', 'international', 'bakery', 'vegan'],
    difficulty: 'Very Competitive',
    applicationProcess: 'Apply via IMG events → curation → invite.',
    fees: '£2,000-15,000 depending on stand type',
    requirements: ['Established restaurant/brand', 'Premium quality', 'Strong brand identity'],
    tips: ['This is London\'s premium food festival', 'Best for established brands looking for exposure', 'Great for press and media coverage'],
    url: 'https://london.tastefestivals.com',
    description: 'London\'s premium food festival. Ideal for established brands seeking exposure and press.'
  },
  {
    id: 'great-british-food',
    name: 'Great British Food Festival',
    type: 'festival',
    subtype: 'Food Festival',
    city: 'Multiple venues',
    region: 'Nationwide',
    dates: 'March-October (touring)',
    costs: '£128-450/day',
    attendance: '5,000-15,000 per event',
    cuisineMatch: ['any', 'british', 'artisan', 'bakery', 'street_food', 'organic'],
    difficulty: 'Easy',
    applicationProcess: 'Apply online → simple approval → book dates.',
    fees: '£128-450/day depending on stand size',
    requirements: ['Food hygiene', 'Insurance', 'Own gazebo/setup'],
    tips: ['Great entry point for new traders', 'Multiple events nationwide = good for testing', 'Family audience — wholesome food works well', 'Affordable fees make this low-risk'],
    url: 'https://www.greatbritishfoodfestival.com/exhibit',
    description: 'Touring food festival visiting stately homes across the UK. Affordable and accessible entry point.'
  },
  {
    id: 'foodies-festival',
    name: 'Foodies Festival',
    type: 'festival',
    subtype: 'Food Festival',
    city: 'Multiple venues',
    region: 'Nationwide',
    dates: 'May-September',
    costs: '£200-800/day',
    attendance: '10,000-25,000 per event',
    cuisineMatch: ['any', 'artisan', 'international', 'street_food', 'bakery', 'vegan', 'organic'],
    difficulty: 'Moderate',
    applicationProcess: 'Apply online → selection → confirmation.',
    fees: '£200-800/day depending on event and stand',
    requirements: ['Food hygiene', 'Insurance', 'Professional setup'],
    tips: ['Multiple cities (Brighton, Edinburgh, London, etc)', 'Good middle-ground between small fairs and major festivals', 'Strong Instagram presence helps your application'],
    url: 'https://www.foodiesfestival.com/exhibit',
    description: 'Multi-city food festival series. Good step up from local markets into festival trading.'
  },
  // ═══ MORE LONDON MARKETS ═══
  {
    id: 'victoria-park-market',
    name: 'Victoria Park Market',
    type: 'market',
    subtype: 'Sunday Market',
    city: 'London',
    region: 'London',
    dates: 'Every Sunday 10am-4pm',
    costs: 'Contact for pricing',
    cuisineMatch: ['any', 'street_food', 'international', 'artisan', 'bakery', 'vegan'],
    difficulty: 'Moderate',
    applicationProcess: 'Apply via website trader area → submit menu/photos → selection.',
    fees: 'Contact market management for current rates',
    requirements: ['Food hygiene certification', 'Public liability insurance', 'Professional food photos'],
    tips: ['Beautiful East London park setting — great footfall in summer', 'Strong local community following', 'Separate forms for hot food vs produce traders'],
    url: 'http://victoriaparkmarket.com/trader-area',
    description: 'Weekly Sunday food market inside East London\'s most beautiful park. Strong community vibe.'
  },
  {
    id: 'maltby-street-market',
    name: 'Maltby Street Market',
    type: 'market',
    subtype: 'Street Food',
    city: 'London',
    region: 'London',
    dates: 'Every Saturday & Sunday',
    costs: 'Contact for pricing',
    cuisineMatch: ['any', 'street_food', 'international', 'artisan', 'fusion', 'bbq', 'mexican'],
    difficulty: 'Competitive',
    applicationProcess: 'Contact market team + apply for Southwark Council street trading licence.',
    fees: 'Stall fees + Southwark Council licence fee',
    requirements: ['Southwark Council street trading licence', 'Food hygiene', 'Insurance', 'Unique offering'],
    tips: ['Borough Market\'s cooler younger sibling', 'More intimate, curated feel', 'Railway arches create unique atmosphere', 'Less corporate than Borough — personality matters'],
    url: 'http://www.maltbystreetmarket.co.uk/traders',
    description: 'Curated street food market under Bermondsey\'s railway arches. Global flavours, artisan quality.'
  },
  {
    id: 'greenwich-market',
    name: 'Greenwich Market',
    type: 'market',
    subtype: 'Indoor Market',
    city: 'London',
    region: 'London',
    dates: 'Year-round (daily)',
    costs: 'Contact for pricing',
    cuisineMatch: ['any', 'street_food', 'international', 'asian', 'caribbean', 'artisan'],
    difficulty: 'Competitive',
    applicationProcess: 'Email menu + photos + insurance → appointment → trial. Apply online via website.',
    fees: 'Contact market management — limited capacity',
    requirements: ['Public liability insurance', 'Food hygiene certification', 'Menu and photos required with application', 'Creativity and originality valued'],
    tips: ['Huge tourist footfall from Greenwich attractions', 'They reply within two weeks', 'If rejected, you can reapply after 3 months', 'Original concepts stand out'],
    url: 'https://greenwichmarket.london/become-a-trader/apply-now/',
    description: 'Historic covered market in Greenwich with massive tourist footfall. Daily trading.'
  },
  {
    id: 'camden-market',
    name: 'Camden Market',
    type: 'market',
    subtype: 'Food Hall & Stalls',
    city: 'London',
    region: 'London',
    dates: 'Year-round (daily)',
    costs: '£15-70/day',
    cuisineMatch: ['any', 'street_food', 'international', 'asian', 'caribbean', 'mexican', 'vegan', 'fusion'],
    difficulty: 'Moderate',
    applicationProcess: 'Apply via camdenmarket.com/join-camden → curation team review → trial.',
    fees: '£15-30/day (Mon-Thu), £40-70/day (Fri-Sun) depending on location',
    requirements: ['Innovative food concept', 'Food hygiene', 'Insurance', 'Strong brand identity'],
    tips: ['One of London\'s most iconic markets — massive footfall', 'Multiple areas: East Yard, Market Hall, Lock Place', 'Weekday stalls are much cheaper — good for testing', 'They curate carefully — unique concepts win'],
    url: 'https://camdenmarket.com/join-camden',
    description: 'London\'s most iconic market. Multiple trading areas with affordable weekday rates.'
  },
  {
    id: 'southbank-food-market',
    name: 'Southbank Centre Food Market',
    type: 'market',
    subtype: 'Weekend Market',
    city: 'London',
    region: 'London',
    dates: 'Weekends + seasonal events',
    costs: 'Contact for pricing',
    cuisineMatch: ['any', 'street_food', 'international', 'artisan', 'vegan', 'fusion'],
    difficulty: 'Competitive',
    applicationProcess: 'Complete guest trade application form on Southbank Centre website.',
    fees: 'Contact Southbank Centre team for current rates',
    requirements: ['Food hygiene certification', 'Insurance', 'Innovative concept', 'Professional presentation'],
    tips: ['Premium South Bank location — massive tourist and theatre-goer footfall', 'Winter Market is a separate application with high revenue potential', 'They actively seek new and innovative traders'],
    url: 'https://www.southbankcentre.co.uk/food-and-drink/southbank-centre-food-market/',
    description: 'Weekend market on London\'s South Bank. Premium location with arts venue footfall.'
  },
  {
    id: 'brick-lane-upmarket',
    name: 'Brick Lane Upmarket',
    type: 'market',
    subtype: 'Food Hall',
    city: 'London',
    region: 'London',
    dates: 'Daily (Mon-Sun)',
    costs: 'Contact for pricing',
    cuisineMatch: ['any', 'street_food', 'international', 'asian', 'african', 'caribbean', 'mexican', 'fusion'],
    difficulty: 'Moderate',
    applicationProcess: 'Submit stall application via website enquiries page.',
    fees: 'Contact market management',
    requirements: ['Food hygiene', 'Insurance', 'Unique cuisine offering'],
    tips: ['Over 40 food traders — one of London\'s most diverse food halls', '20+ year history on Brick Lane', 'Ethiopian, Korean, Mexican, Caribbean all represented', 'Open daily now (not just Sundays)'],
    url: 'https://www.sundayupmarket.co.uk/enquiries/',
    description: 'Iconic Brick Lane food hall with 40+ international street food traders. Open daily.'
  },
  {
    id: 'old-spitalfields-market',
    name: 'Old Spitalfields Market',
    type: 'market',
    subtype: 'Indoor Market',
    city: 'London',
    region: 'London',
    dates: 'Year-round (daily)',
    costs: 'Contact for pricing',
    cuisineMatch: ['any', 'artisan', 'international', 'street_food', 'bakery'],
    difficulty: 'Very Competitive',
    applicationProcess: 'Share business details via website for consideration when vacancies arise.',
    fees: 'Premium location — rates available on enquiry',
    requirements: ['Established food business preferred', 'Strong brand', 'Food hygiene', 'Insurance'],
    tips: ['Currently no food vacancies — submit details for waiting list', 'Very prestigious East London market', 'When spots open, competition is fierce', 'Strong brand identity is essential'],
    url: 'https://oldspitalfieldsmarket.com/become-a-trader',
    description: 'Premium East London market. Limited food trader spots — join the waiting list.'
  },
  // ═══ MORE FESTIVALS ═══
  {
    id: 'abergavenny-food',
    name: 'Abergavenny Food Festival',
    type: 'festival',
    subtype: 'Food Festival',
    city: 'Abergavenny, Wales',
    region: 'South West',
    dates: 'September (2 days)',
    costs: 'Apply for pricing',
    attendance: '30,000',
    cuisineMatch: ['any', 'artisan', 'british', 'bakery', 'organic', 'street_food'],
    difficulty: 'Competitive',
    applicationProcess: 'Applications open on website — apply early as it sells out.',
    fees: 'Contact festival for current trader rates',
    requirements: ['Food hygiene', 'Insurance', 'Quality artisan produce preferred'],
    tips: ['One of the UK\'s most respected food festivals', 'Strong emphasis on quality and provenance', 'Great for artisan/producer brands', 'Applications for 2026 are NOW OPEN'],
    url: 'https://www.abergavennyfoodfestival.com/exhibitor-info/',
    description: 'One of the UK\'s most prestigious food festivals. Strong emphasis on quality and provenance.'
  },
  {
    id: 'latitude',
    name: 'Latitude Festival',
    type: 'festival',
    subtype: 'Music & Arts Festival',
    city: 'Henham Park, Suffolk',
    region: 'South East',
    dates: 'July (4 days)',
    costs: '£1,500-8,000',
    attendance: '40,000',
    cuisineMatch: ['any', 'street_food', 'artisan', 'vegan', 'international', 'fusion'],
    difficulty: 'Competitive',
    applicationProcess: 'Apply through festival website or via RB Vernon.',
    fees: '£1,500-8,000 depending on pitch',
    requirements: ['Festival trading experience', 'Full catering setup', 'Insurance', 'Gas certificates'],
    tips: ['Family-friendly festival — quality over fast food', 'Affluent audience willing to spend on good food', 'Arts/theatre crowd appreciates creative menus'],
    url: 'https://www.latitudefestival.com',
    description: 'Family-friendly arts festival in Suffolk. Affluent audience who value quality food.'
  },
  {
    id: 'camp-bestival',
    name: 'Camp Bestival',
    type: 'festival',
    subtype: 'Family Festival',
    city: 'Shropshire',
    region: 'West Midlands',
    dates: 'August (4 days)',
    costs: '£1,000-5,000',
    attendance: '30,000',
    cuisineMatch: ['any', 'street_food', 'british', 'bakery', 'vegan', 'pizza'],
    difficulty: 'Moderate',
    applicationProcess: 'Apply via festival website or RB Vernon.',
    fees: '£1,000-5,000 depending on pitch size',
    requirements: ['Family-appropriate menu', 'Food hygiene', 'Insurance', 'Gas safety'],
    tips: ['Family audience — kids menu options are essential', 'Wholesome, quality food does well', 'Less intense than adult festivals — good for newer traders'],
    url: 'https://campbestival.net',
    description: 'Family-focused festival. Great entry point for traders new to festival circuit.'
  },
  {
    id: 'rb-vernon',
    name: 'RB Vernon Events',
    type: 'aggregator',
    subtype: 'Festival Booking Agency',
    city: 'Multiple',
    region: 'Nationwide',
    dates: 'Year-round (festival season Apr-Sep)',
    costs: 'Varies by event',
    cuisineMatch: ['any', 'street_food', 'international', 'bbq', 'pizza', 'vegan'],
    difficulty: 'Moderate',
    applicationProcess: 'Apply on rbvernon.co.uk → upload documentation → allocation.',
    fees: 'Varies by festival and pitch size',
    requirements: ['Food hygiene registration (must state Registering Authority)', 'Insurance', 'Gas certificates', 'Documentation uploaded with application'],
    tips: ['Book multiple festivals through one agency', 'They handle allocation for major UK festivals', 'Documentation MUST be complete or application rejected', 'Bar concessions not accepted'],
    url: 'https://rbvernon.co.uk/',
    description: 'Major festival trading agency. One application can get you into multiple UK festivals.'
  },
  // ═══ AGGREGATORS / NETWORKS ═══
  {
    id: 'street-food-warehouse',
    name: 'Street Food Warehouse',
    type: 'aggregator',
    subtype: 'Event Network',
    city: 'Multiple',
    region: 'Nationwide',
    dates: 'Year-round events',
    costs: 'Commission-based',
    cuisineMatch: ['any', 'street_food', 'international', 'fusion', 'bbq', 'asian', 'mexican'],
    difficulty: 'Moderate',
    applicationProcess: 'Apply on website → tasting/interview → join rotation.',
    fees: 'Commission on sales (varies by event)',
    requirements: ['Street food setup', 'Insurance', 'Food hygiene'],
    tips: ['One application gets you access to multiple events', 'Great way to build festival experience', 'They handle all event logistics'],
    url: 'https://streetfoodwarehouse.co.uk/traders',
    description: 'Network organising street food events across the UK. One application, multiple events.'
  },
  {
    id: 'british-street-food',
    name: 'British Street Food Awards',
    type: 'aggregator',
    subtype: 'Competition + Events',
    city: 'Multiple',
    region: 'Nationwide',
    dates: 'Regional heats spring-summer, final September',
    costs: 'Entry fee varies',
    cuisineMatch: ['any', 'street_food', 'international', 'fusion', 'innovative'],
    difficulty: 'Competitive',
    applicationProcess: 'Enter via website → regional heat → national final.',
    fees: 'Entry fees vary by region',
    requirements: ['Operating street food business', 'Insurance', 'Food hygiene'],
    tips: ['Winning or placing = massive credibility boost', 'Great for PR and media coverage', 'Network with top UK street food traders'],
    url: 'https://britishstreetfood.co.uk',
    description: 'The UK\'s biggest street food competition. Incredible for credibility and exposure.'
  },
]

// ════════════════════════════════════════════════════════════════
// REGIONS
// ════════════════════════════════════════════════════════════════

const REGIONS = [
  'Any',
  'London',
  'South East',
  'South West',
  'North West',
  'West Midlands',
  'Yorkshire',
  'Scotland',
  'Nationwide'
]

const CUISINE_OPTIONS = [
  { value: 'any', label: 'Any Cuisine' },
  { value: 'street_food', label: 'Street Food' },
  { value: 'international', label: 'International' },
  { value: 'british', label: 'British / Traditional' },
  { value: 'asian', label: 'Asian' },
  { value: 'mexican', label: 'Mexican / Latin' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'bbq', label: 'BBQ / Grill' },
  { value: 'bakery', label: 'Bakery / Pastry' },
  { value: 'vegan', label: 'Vegan / Plant-Based' },
  { value: 'artisan', label: 'Artisan / Specialty' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'fusion', label: 'Fusion' },
]

const EVENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'market', label: 'Markets & Food Halls' },
  { value: 'festival', label: 'Festivals' },
  { value: 'aggregator', label: 'Event Networks' },
]

const BUDGET_OPTIONS = [
  { value: 'any', label: 'Any Budget' },
  { value: 'low', label: 'Under £500/event' },
  { value: 'mid', label: '£500-2,000' },
  { value: 'high', label: '£2,000-10,000' },
  { value: 'premium', label: '£10,000+' },
]

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export default function FindEventsPage() {
  const [step, setStep] = useState(0)
  const [region, setRegion] = useState('Any')
  const [cuisine, setCuisine] = useState('any')
  const [eventType, setEventType] = useState('all')
  const [budget, setBudget] = useState('any')
  const [experience, setExperience] = useState('any')
  const [results, setResults] = useState<EventEntry[]>([])
  const [showResults, setShowResults] = useState(false)
  const [expandedResult, setExpandedResult] = useState<string | null>(null)

  const steps = [
    { title: 'Where are you based?', subtitle: 'We\'ll find events near you' },
    { title: 'What do you serve?', subtitle: 'Match with the right events' },
    { title: 'What type of event?', subtitle: 'Markets, festivals, or both' },
    { title: 'What\'s your budget?', subtitle: 'Pitch fees and costs' },
    { title: 'Your experience level?', subtitle: 'We\'ll match your readiness' },
  ]

  function findMatches() {
    let matches = [...EVENTS]

    // Filter by region
    if (region !== 'Any') {
      matches = matches.filter(e => 
        e.region === region || e.region === 'Nationwide' || e.region === 'Multiple'
      )
    }

    // Filter by cuisine
    if (cuisine !== 'any') {
      matches = matches.filter(e => 
        e.cuisineMatch.includes(cuisine) || e.cuisineMatch.includes('any')
      )
    }

    // Filter by event type
    if (eventType !== 'all') {
      matches = matches.filter(e => e.type === eventType)
    }

    // Filter by budget
    if (budget !== 'any') {
      matches = matches.filter(e => {
        const costStr = e.costs.toLowerCase()
        const feeStr = e.fees.toLowerCase()
        const combined = costStr + ' ' + feeStr
        
        // Extract rough numbers
        const nums = combined.match(/[\d,]+/g)?.map(n => parseInt(n.replace(',', ''))) || []
        const minCost = nums.length > 0 ? Math.min(...nums) : 0
        
        switch(budget) {
          case 'low': return minCost < 500
          case 'mid': return minCost >= 200 && minCost <= 2000
          case 'high': return minCost >= 1000 && minCost <= 10000
          case 'premium': return minCost >= 5000
          default: return true
        }
      })
    }

    // Filter by experience
    if (experience === 'beginner') {
      matches = matches.filter(e => 
        e.difficulty === 'Easy' || e.difficulty === 'Moderate'
      )
    } else if (experience === 'intermediate') {
      matches = matches.filter(e => 
        e.difficulty !== 'Very Competitive'
      )
    }

    // Sort: easier first for beginners, competitive first for experienced
    if (experience === 'beginner') {
      const order = { 'Easy': 0, 'Moderate': 1, 'Competitive': 2, 'Very Competitive': 3 }
      matches.sort((a, b) => order[a.difficulty] - order[b.difficulty])
    }

    setResults(matches)
    setShowResults(true)
  }

  function getDifficultyColor(d: string) {
    switch(d) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700'
      case 'Moderate': return 'bg-amber-100 text-amber-700'
      case 'Competitive': return 'bg-orange-100 text-orange-700'
      case 'Very Competitive': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  function getTypeIcon(type: string) {
    switch(type) {
      case 'market': return '🏪'
      case 'festival': return '🎪'
      case 'aggregator': return '🔗'
      default: return '📍'
    }
  }

  // ═══ RESULTS VIEW ═══
  if (showResults) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
        <nav className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setShowResults(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-gray-900">Your Matches</h1>
            <span className="text-sm text-gray-500 ml-auto">{results.length} found</span>
          </div>
        </nav>

        <main className="px-4 py-6 max-w-2xl mx-auto">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">🔍</p>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No exact matches</h2>
              <p className="text-gray-600 mb-6">Try widening your search criteria</p>
              <button
                onClick={() => setShowResults(false)}
                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium"
              >
                Adjust Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map(event => (
                <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedResult(expandedResult === event.id ? null : event.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{getTypeIcon(event.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900">{event.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(event.difficulty)}`}>
                            {event.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{event.city} · {event.subtype}</p>
                        <p className="text-sm font-medium text-emerald-600 mt-1">{event.costs}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedResult === event.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {expandedResult === event.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                      <p className="text-sm text-gray-600">{event.description}</p>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Dates</h4>
                        <p className="text-sm text-gray-800">{event.dates}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Fees</h4>
                        <p className="text-sm text-gray-800">{event.fees}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">How to Apply</h4>
                        <p className="text-sm text-gray-800">{event.applicationProcess}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Requirements</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {event.requirements.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-gray-400 mt-1">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Tips</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {event.tips.map((t, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-1">💡</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-gray-900 text-white text-center py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          Visit Website →
                        </a>
                        {event.email && (
                          <a
                            href={`mailto:${event.email}`}
                            className="flex-1 border border-gray-300 text-gray-700 text-center py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            Email Them
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // ═══ QUESTIONNAIRE VIEW ═══
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <nav className="px-4 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-900">Market & Festival Finder</h1>
        </div>
      </nav>

      <main className="px-4 py-8 max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">{steps[step].title}</h2>
        <p className="text-gray-500 text-sm mb-6">{steps[step].subtitle}</p>

        {/* Step 0: Region */}
        {step === 0 && (
          <div className="space-y-2">
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => { setRegion(r); setStep(1) }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  region === r ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">{r}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Cuisine */}
        {step === 1 && (
          <div className="space-y-2">
            {CUISINE_OPTIONS.map(c => (
              <button
                key={c.value}
                onClick={() => { setCuisine(c.value); setStep(2) }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  cuisine === c.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="font-medium text-gray-900">{c.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Event Type */}
        {step === 2 && (
          <div className="space-y-2">
            {EVENT_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => { setEventType(t.value); setStep(3) }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  eventType === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.value === 'market' ? '🏪' : t.value === 'festival' ? '🎪' : t.value === 'aggregator' ? '🔗' : '📍'}</span>
                  <span className="font-medium text-gray-900">{t.label}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="space-y-2">
            {BUDGET_OPTIONS.map(b => (
              <button
                key={b.value}
                onClick={() => { setBudget(b.value); setStep(4) }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  budget === b.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="font-medium text-gray-900">{b.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Experience */}
        {step === 4 && (
          <div className="space-y-2">
            {[
              { value: 'beginner', label: 'New to this', desc: 'First time trading at markets/festivals' },
              { value: 'intermediate', label: 'Some experience', desc: 'Done a few markets or events' },
              { value: 'experienced', label: 'Experienced trader', desc: 'Regular market/festival trader' },
              { value: 'any', label: 'Show me everything', desc: 'All difficulty levels' },
            ].map(e => (
              <button
                key={e.value}
                onClick={() => { setExperience(e.value); findMatches() }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  experience === e.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{e.label}</div>
                <div className="text-sm text-gray-500">{e.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Back button */}
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mt-6 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        )}
      </main>
    </div>
  )
}
