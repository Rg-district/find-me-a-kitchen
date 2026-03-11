import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmuprcheuqnawtlzdyds.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Expanded provider database with more specific matching criteria
const PROVIDERS = [
  // DARK KITCHENS
  {
    id: 'karma-kitchen',
    name: 'Karma Kitchen',
    type: 'dark_kitchen',
    cities: ['London', 'Manchester', 'Birmingham'],
    priceMin: 3200,
    priceMax: 10000,
    priceUnit: 'month',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range', 'Extraction / Ventilation', 'Walk-in cold room', 'Prep tables'],
    features: ['24hr access', 'Flexible terms', 'Delivery partnerships', 'All utilities included'],
    bestForBusiness: ['delivery_only', 'dark_kitchen'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Indian', 'Caribbean', 'Chinese'],
    website: 'https://karmakitchen.co',
    description: 'Fully-equipped dark kitchen spaces with delivery platform partnerships. Ideal for established delivery brands looking to scale.'
  },
  {
    id: 'deliveroo-editions',
    name: 'Deliveroo Editions',
    type: 'dark_kitchen',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Glasgow', 'Liverpool', 'Nottingham'],
    priceMin: 4800,
    priceMax: 14000,
    priceUnit: 'month',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range', 'Extraction / Ventilation', 'Walk-in cold room'],
    features: ['Deliveroo partnership', 'High footfall areas', 'Marketing support', 'Data insights', 'Exclusive delivery zones'],
    bestForBusiness: ['delivery_only'],
    bestForScale: ['large', 'enterprise'],
    bestForBudget: ['5000+'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Pizza', 'Indian', 'Chinese', 'Mexican'],
    website: 'https://restaurants.deliveroo.com/en-gb/editions',
    description: 'Premium dark kitchen sites in high-demand delivery areas. Best for brands with proven track record seeking rapid expansion.'
  },
  {
    id: 'foodstars',
    name: 'FoodStars (CloudKitchens)',
    type: 'dark_kitchen',
    cities: ['London'],
    priceMin: 1800,
    priceMax: 4500,
    priceUnit: 'month',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range', 'Upright fridge', 'Upright freezer'],
    features: ['100+ London locations', 'Flexible contracts', 'Basic equipment included', 'Shared facilities'],
    bestForBusiness: ['delivery_only', 'starting'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Pizza', 'Healthy / Salads'],
    website: 'https://www.cloudkitchens.com',
    description: 'Affordable entry-level dark kitchen spaces across London. Good for testing delivery concepts with lower commitment.'
  },
  {
    id: 'jacuna-kitchens',
    name: 'Jacuna Kitchens',
    type: 'dark_kitchen',
    cities: ['London', 'Birmingham', 'Leeds', 'Manchester', 'Bristol'],
    priceMin: 2500,
    priceMax: 6000,
    priceUnit: 'month',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range', 'Extraction / Ventilation', 'Prep tables'],
    features: ['Multi-platform delivery', 'Flexible terms', '3-month minimum'],
    bestForBusiness: ['delivery_only'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['2000-5000'],
    cuisineStrength: ['Indian', 'Caribbean', 'Turkish / Kebabs', 'Chinese'],
    website: 'https://jacunakitchens.com',
    description: 'Growing dark kitchen network with sites across major UK cities. Good mid-range option for delivery brands.'
  },
  
  // SHARED KITCHENS
  {
    id: 'mission-kitchen',
    name: 'Mission Kitchen',
    type: 'shared_kitchen',
    cities: ['London'],
    priceMin: 15,
    priceMax: 45,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Prep tables', 'Storage shelving', 'Mixer', 'Food processor'],
    features: ['Social enterprise', 'Business support', 'Memberships available', 'Community focus', 'Training programmes'],
    bestForBusiness: ['starting', 'home', 'popup', 'catering', 'production'],
    bestForScale: ['small'],
    bestForBudget: ['under-500', '500-1000'],
    cuisineStrength: ['Desserts & Bakery', 'Healthy / Salads', 'Breakfast & Brunch', 'Coffee & Café'],
    website: 'https://missionkitchen.org',
    description: 'Social enterprise offering affordable hourly kitchen access. Perfect for food startups, home bakers scaling up, and caterers.'
  },
  {
    id: 'sharethere',
    name: 'ShareThere',
    type: 'shared_kitchen',
    cities: ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds'],
    priceMin: 18,
    priceMax: 85,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Prep tables', 'Storage', 'Upright fridge', 'Upright freezer'],
    features: ['Online booking', 'Flexible hours', 'Multiple locations', 'No long contracts'],
    bestForBusiness: ['starting', 'home', 'catering', 'popup'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['under-500', '500-1000', '1000-2000'],
    cuisineStrength: ['Desserts & Bakery', 'Breakfast & Brunch', 'Italian / Pasta', 'Healthy / Salads'],
    website: 'https://sharethere.com',
    description: 'Book commercial kitchen space by the hour across the UK. Ideal for caterers, pop-up chefs, and food producers needing flexible access.'
  },
  {
    id: 'the-kitchen-collective',
    name: 'The Kitchen Collective',
    type: 'shared_kitchen',
    cities: ['London'],
    priceMin: 20,
    priceMax: 60,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Mixer', 'Prep tables', 'Walk-in cold room'],
    features: ['Production focused', 'Food safety certified', 'Storage available'],
    bestForBusiness: ['production', 'catering', 'starting'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['500-1000', '1000-2000'],
    cuisineStrength: ['Desserts & Bakery', 'Healthy / Salads', 'Indian', 'Caribbean'],
    website: 'https://thekitchencollective.co.uk',
    description: 'Production-focused shared kitchen in London. Good for food producers and caterers needing regular kitchen time.'
  },
  {
    id: 'ncass-kitchen',
    name: 'NCASS Production Kitchen',
    type: 'shared_kitchen',
    cities: ['Birmingham'],
    priceMin: 50,
    priceMax: 150,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Deep fat fryers', 'Gas hobs / Range', 'Walk-in cold room', 'Blast chiller', 'Prep tables'],
    features: ['Industry body facility', 'Training available', 'Member discounts', 'Large scale production'],
    bestForBusiness: ['production', 'catering'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Fish & Chips', 'Breakfast & Brunch'],
    website: 'https://ncass.org.uk',
    description: 'Professional production kitchen run by the National Caterers Association. Ideal for large-scale food production and events.'
  },
  
  // MOBILE UNIT SUPPLIERS
  {
    id: 'amobox',
    name: 'Amobox',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 35000,
    priceMax: 95000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec'],
    features: ['Premium design', 'Bespoke builds', '10-16 week lead time', 'Award-winning designs'],
    bestForBusiness: ['mobile'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['5000+'],
    cuisineStrength: ['Burgers', 'Pizza', 'Coffee & Café', 'Desserts & Bakery'],
    website: 'https://amobox.com',
    description: 'Premium custom food truck and trailer conversions. For brands wanting a standout, design-led mobile unit.'
  },
  {
    id: 'jiffy-trucks',
    name: 'Jiffy Trucks',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 18000,
    priceMax: 55000,
    priceUnit: 'one_time',
    equipment: ['Bain maries', 'Deep fat fryers', 'Flat griddle / Plancha', 'Gas hobs / Range'],
    features: ['Hot & cold options', 'Snack trucks', 'Burger vans', 'Quick turnaround'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Fish & Chips', 'Breakfast & Brunch'],
    website: 'https://cateringtrucks.co.uk',
    description: 'Specialist catering vehicle builder for hot food operations. Good value for traditional street food setups.'
  },
  {
    id: 'mobile-catering-solutions',
    name: 'Mobile Catering Solutions',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 12000,
    priceMax: 40000,
    priceUnit: 'one_time',
    equipment: ['Deep fat fryers', 'Bain maries', 'Flat griddle / Plancha'],
    features: ['New and used units', 'Finance available', 'Quick delivery'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Breakfast & Brunch'],
    website: 'https://mobilecateringsolutions.co.uk',
    description: 'Affordable new and used catering trailers and vans. Good entry point for mobile food businesses.'
  },
  {
    id: 'ghst-ktchn',
    name: 'Ghst Ktchn',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 30000,
    priceMax: 75000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec', 'Deep fat fryers', 'Flat griddle / Plancha', 'Gas hobs / Range'],
    features: ['Contemporary designs', 'Street food specialists', 'Festival ready', 'Instagram-worthy builds'],
    bestForBusiness: ['mobile'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Pizza', 'Mexican', 'Coffee & Café', 'Desserts & Bakery'],
    website: 'https://ghstktchn.com',
    description: 'Modern street food vehicle conversions with contemporary aesthetic. Popular with festival vendors and urban food brands.'
  },
  {
    id: 'tudor-trailers',
    name: 'Tudor Trailers',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 15000,
    priceMax: 45000,
    priceUnit: 'one_time',
    equipment: ['Bain maries', 'Deep fat fryers', 'Flat griddle / Plancha', 'Commercial oven'],
    features: ['Established manufacturer', 'Wide range', 'Finance available', 'VCA approved'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Breakfast & Brunch', 'Coffee & Café'],
    website: 'https://tudortrailers.co.uk',
    description: 'Long-established UK catering trailer manufacturer. Reliable builds with proven track record and wide equipment options.'
  },
  {
    id: 'bistro-trailers',
    name: 'Bistro Trailers',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 20000,
    priceMax: 55000,
    priceUnit: 'one_time',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Deep fat fryers', 'Flat griddle / Plancha', 'Extraction / Ventilation'],
    features: ['High-end finishes', 'European style', 'Bespoke options', 'Quick turnaround'],
    bestForBusiness: ['mobile'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Pizza', 'Italian / Pasta', 'Coffee & Café', 'Breakfast & Brunch', 'Burgers'],
    website: 'https://bistrotrailers.co.uk',
    description: 'Premium catering trailers with European-influenced designs. Quality builds suited for artisan food operations.'
  },
  
  // MARKETPLACES
  {
    id: 'oya',
    name: 'Oya',
    type: 'marketplace',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Glasgow', 'Cardiff', 'Liverpool', 'Sheffield', 'Newcastle', 'Nottingham'],
    priceMin: 400,
    priceMax: 8000,
    priceUnit: 'month',
    equipment: ['Varies by listing'],
    features: ['Large selection', 'Direct contact', 'Compare options', 'Reviews available'],
    bestForBusiness: ['all'],
    bestForScale: ['all'],
    bestForBudget: ['all'],
    cuisineStrength: ['all'],
    website: 'https://oya.co.uk',
    description: 'UK marketplace for commercial kitchen rentals. Browse and compare options across the country.'
  },
  {
    id: 'kitchen-space-rentals',
    name: 'Kitchen Space Rentals',
    type: 'marketplace',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Glasgow', 'Liverpool', 'Sheffield', 'Newcastle', 'Nottingham', 'Cardiff', 'Belfast', 'Brighton'],
    priceMin: 15,
    priceMax: 200,
    priceUnit: 'hour',
    equipment: ['Varies by listing'],
    features: ['1500+ kitchens', '34 cities', 'Instant booking', 'Verified listings'],
    bestForBusiness: ['starting', 'catering', 'popup', 'production'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['under-500', '500-1000', '1000-2000'],
    cuisineStrength: ['all'],
    website: 'https://kitchenspacerentals.com',
    description: 'Large aggregator of commercial kitchen spaces across the UK. Good for finding hourly or daily rentals.'
  },
  {
    id: 'ncass-classifieds',
    name: 'NCASS Classifieds',
    type: 'marketplace',
    cities: ['Nationwide'],
    priceMin: 5000,
    priceMax: 45000,
    priceUnit: 'one_time',
    equipment: ['Varies'],
    features: ['Used equipment', 'Trailers', 'Vans', 'Industry trusted', 'Member listings'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['500-1000', '1000-2000', '2000-5000'],
    cuisineStrength: ['all'],
    website: 'https://ncass.org.uk/classified-adverts',
    description: 'Industry classifieds for used catering equipment and vehicles. Good for budget-conscious mobile operators.'
  },
  
  // PRODUCTION KITCHENS
  {
    id: 'fulham-kitchen',
    name: 'Fulham Kitchen',
    type: 'production_kitchen',
    cities: ['London'],
    priceMin: 2500,
    priceMax: 6000,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Walk-in cold room', 'Blast chiller', 'Mixer', 'Prep tables', 'Dishwasher'],
    features: ['24hr access', 'Large production space', 'Cold storage included', 'Loading bay'],
    bestForBusiness: ['production', 'catering'],
    bestForScale: ['medium', 'large', 'enterprise'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Desserts & Bakery', 'Healthy / Salads', 'Italian / Pasta'],
    website: 'https://fulhamkitchen.com',
    description: 'Dedicated production kitchen space in West London. Ideal for food manufacturers and large-scale catering.'
  },
  {
    id: 'food-works-sw',
    name: 'Food Works SW',
    type: 'production_kitchen',
    cities: ['Bristol', 'Exeter'],
    priceMin: 1800,
    priceMax: 4500,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Walk-in cold room', 'Prep tables', 'Storage shelving'],
    features: ['Food business incubator', 'Business support', 'Networking events'],
    bestForBusiness: ['production', 'starting'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Healthy / Salads', 'Desserts & Bakery', 'Coffee & Café'],
    website: 'https://foodworks-sw.co.uk',
    description: 'Food business incubator in the South West. Great for food startups needing production space plus business support.'
  }
]

function scoreProvider(provider: typeof PROVIDERS[0], formData: any): number {
  let score = 0
  let matchReasons: string[] = []
  
  // 1. LOCATION MATCH (0-40 points) - Critical factor
  const locationLower = formData.location.toLowerCase().trim()
  const locationMatch = provider.cities.some(city => {
    const cityLower = city.toLowerCase()
    return cityLower === locationLower || 
           cityLower.includes(locationLower) || 
           locationLower.includes(cityLower)
  })
  
  if (locationMatch) {
    score += 40
    matchReasons.push('location')
  } else if (provider.cities.includes('Nationwide')) {
    score += 20
    matchReasons.push('nationwide')
  } else {
    // No location match - significant penalty
    return 0 // Exclude providers that don't serve the area
  }
  
  // 2. BUSINESS TYPE MATCH (0-50 points) - Most important factor
  const businessType = formData.businessStatus === 'operating' 
    ? formData.currentUnit 
    : formData.plannedBusiness
  
  if (provider.bestForBusiness.includes(businessType)) {
    score += 50
    matchReasons.push('business_type')
  } else if (provider.bestForBusiness.includes('all')) {
    score += 25
  } else {
    // Check related business types
    const relatedTypes: Record<string, string[]> = {
      'delivery_only': ['dark_kitchen'],
      'mobile': ['food_van', 'popup'],
      'cafe': ['restaurant', 'starting'],
      'restaurant': ['cafe'],
      'catering': ['production', 'popup'],
      'production': ['catering'],
      'home': ['starting', 'popup'],
      'popup': ['home', 'starting', 'mobile'],
      'starting': ['home', 'popup'],
      'unsure': ['starting', 'home']
    }
    
    const related = relatedTypes[businessType] || []
    if (related.some(r => provider.bestForBusiness.includes(r))) {
      score += 20
    }
  }
  
  // 3. BUDGET MATCH (0-35 points)
  const budgetMap: Record<string, { monthly: number, key: string }> = {
    'Under £500/month': { monthly: 500, key: 'under-500' },
    '£500 - £1,000/month': { monthly: 1000, key: '500-1000' },
    '£1,000 - £2,000/month': { monthly: 2000, key: '1000-2000' },
    '£2,000 - £5,000/month': { monthly: 5000, key: '2000-5000' },
    '£5,000+/month': { monthly: 10000, key: '5000+' },
    'Not sure / Flexible': { monthly: 3000, key: 'flexible' }
  }
  
  const userBudgetInfo = budgetMap[formData.budget] || { monthly: 2000, key: 'flexible' }
  
  // Check if provider's budget category matches
  if (provider.bestForBudget.includes(userBudgetInfo.key) || provider.bestForBudget.includes('all')) {
    score += 35
    matchReasons.push('budget')
  } else {
    // Calculate actual price match
    let monthlyPrice = provider.priceMin
    if (provider.priceUnit === 'hour') monthlyPrice = provider.priceMin * 80 // 20hrs/week
    if (provider.priceUnit === 'week') monthlyPrice = provider.priceMin * 4
    
    if (provider.priceUnit !== 'one_time') {
      if (monthlyPrice <= userBudgetInfo.monthly) {
        score += 25
      } else if (monthlyPrice <= userBudgetInfo.monthly * 1.2) {
        score += 10 // Slightly over budget
      }
    } else {
      // One-time purchase (mobile units)
      if (businessType === 'mobile') {
        score += 30 // Relevant for mobile businesses
      }
    }
  }
  
  // 4. SCALE MATCH (0-30 points)
  const scaleMap: Record<string, string> = {
    'Under 20': 'small',
    '20-50': 'small',
    '50-100': 'medium',
    '100-200': 'medium',
    '200-500': 'large',
    '500+': 'enterprise',
    'Not sure yet': 'small'
  }
  const userScale = scaleMap[formData.dailyOutput] || 'small'
  
  if (provider.bestForScale.includes(userScale) || provider.bestForScale.includes('all')) {
    score += 30
    matchReasons.push('scale')
  } else {
    // Adjacent scale match
    const scaleOrder = ['small', 'medium', 'large', 'enterprise']
    const userIdx = scaleOrder.indexOf(userScale)
    const providerScales = provider.bestForScale.map(s => scaleOrder.indexOf(s))
    const minDiff = Math.min(...providerScales.map(p => Math.abs(p - userIdx)))
    if (minDiff === 1) score += 15
  }
  
  // 5. CUISINE MATCH (0-25 points)
  if (formData.cuisines && formData.cuisines.length > 0) {
    const cuisineMatches = formData.cuisines.filter((c: string) => 
      provider.cuisineStrength.includes(c) || provider.cuisineStrength.includes('all')
    ).length
    
    const cuisineScore = Math.min(25, cuisineMatches * 8)
    score += cuisineScore
    if (cuisineScore > 0) matchReasons.push('cuisine')
  }
  
  // 6. EQUIPMENT MATCH (0-20 points)
  if (formData.equipment && formData.equipment.length > 0) {
    const equipmentMatches = formData.equipment.filter((e: string) => 
      provider.equipment.some(pe => 
        pe.toLowerCase().includes(e.toLowerCase()) || 
        e.toLowerCase().includes(pe.toLowerCase())
      )
    ).length
    
    const equipmentScore = Math.min(20, equipmentMatches * 4)
    score += equipmentScore
    if (equipmentScore > 0) matchReasons.push('equipment')
  }
  
  // 7. EXPANSION PLANS BONUS (0-15 points)
  if (formData.expansionPlans) {
    if (formData.expansionPlans.includes('significant growth') && 
        (provider.bestForScale.includes('large') || provider.bestForScale.includes('enterprise'))) {
      score += 15
    } else if (formData.expansionPlans.includes('some growth') && 
               provider.bestForScale.includes('medium')) {
      score += 10
    }
  }
  
  return score
}

// Generate personalized benefits based on user data and provider type
function generateBenefits(provider: typeof PROVIDERS[0], formData: any): string[] {
  const benefits: string[] = []
  const businessType = formData.businessStatus === 'operating' 
    ? formData.currentUnit 
    : formData.plannedBusiness
  const userScale = formData.dailyOutput || 'Not sure yet'
  const userBudget = formData.budget || 'flexible'
  const cuisines = formData.cuisines || []
  const location = formData.location || ''
  const expansionPlans = formData.expansionPlans || ''
  
  // Dark Kitchen benefits
  if (provider.type === 'dark_kitchen') {
    if (businessType === 'delivery_only' || businessType === 'home') {
      benefits.push(`Perfect for delivery-only operations — no need to pay for customer-facing space`)
    }
    if (businessType === 'home') {
      benefits.push(`Scale up from home cooking with a professional, licensed kitchen`)
    }
    if (userScale.includes('100') || userScale.includes('200') || userScale.includes('500')) {
      benefits.push(`Built for high-volume output — handles ${userScale} orders/day comfortably`)
    }
    if (provider.features.some(f => f.toLowerCase().includes('delivery'))) {
      benefits.push(`Integrated delivery platform partnerships can boost your order volume`)
    }
    if (expansionPlans.includes('growth')) {
      benefits.push(`Easy to scale — add more shifts or move to larger unit as you grow`)
    }
    benefits.push(`All equipment included — no upfront equipment investment needed`)
    benefits.push(`Fully licensed and compliant — no planning permission headaches`)
  }
  
  // Shared Kitchen benefits
  if (provider.type === 'shared_kitchen') {
    if (businessType === 'starting' || businessType === 'home' || businessType === 'popup') {
      benefits.push(`Low-commitment entry — test your concept without long-term lease`)
    }
    if (userBudget.includes('Under') || userBudget.includes('500')) {
      benefits.push(`Pay only for hours you use — ideal for your budget`)
    }
    if (businessType === 'catering') {
      benefits.push(`Perfect for catering — book kitchen time around your event schedule`)
    }
    if (cuisines.includes('Desserts & Bakery')) {
      benefits.push(`Production-ready for baking — commercial ovens and prep space available`)
    }
    benefits.push(`No long-term commitment — scale up or down as needed`)
    if (provider.features.some(f => f.toLowerCase().includes('support') || f.toLowerCase().includes('training'))) {
      benefits.push(`Business support included — helpful when you're starting out`)
    }
  }
  
  // Mobile Unit benefits
  if (provider.type === 'mobile_supplier') {
    if (businessType === 'mobile' || businessType === 'popup') {
      benefits.push(`Own your unit outright — no ongoing rent payments`)
    }
    benefits.push(`Take your business anywhere — festivals, markets, events, pitches`)
    benefits.push(`Lower overheads than fixed premises — no rates, lower utilities`)
    if (cuisines.some(c => ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Coffee & Café'].includes(c))) {
      benefits.push(`Ideal setup for ${cuisines[0]} — high-demand street food category`)
    }
    if (expansionPlans.includes('growth')) {
      benefits.push(`Build your brand and customer base before committing to fixed premises`)
    }
    benefits.push(`Flexibility to test different locations and find your best spots`)
  }
  
  // Marketplace benefits
  if (provider.type === 'marketplace') {
    benefits.push(`Compare multiple options in ${location} — find the best fit for your needs`)
    benefits.push(`Direct contact with kitchen owners — negotiate terms that work for you`)
    if (userBudget.includes('Flexible') || userBudget.includes('Not sure')) {
      benefits.push(`Browse a range of price points to find what suits your budget`)
    }
    benefits.push(`See reviews and verified listings before committing`)
  }
  
  // Production Kitchen benefits
  if (provider.type === 'production_kitchen') {
    if (businessType === 'production' || businessType === 'catering') {
      benefits.push(`Purpose-built for food production at scale`)
    }
    if (userScale.includes('200') || userScale.includes('500')) {
      benefits.push(`Capacity for high-volume production — ${userScale} units/day`)
    }
    benefits.push(`Professional-grade equipment for consistent quality`)
    if (provider.features.some(f => f.toLowerCase().includes('storage') || f.toLowerCase().includes('cold'))) {
      benefits.push(`Cold storage included — essential for your production workflow`)
    }
  }
  
  // Return top 3-4 most relevant benefits
  return benefits.slice(0, 4)
}

// #12 - Generate match factors that influenced results
function generateMatchFactors(formData: any): string[] {
  const factors: string[] = []
  
  if (formData.location) factors.push(`📍 ${formData.location}`)
  
  const businessType = formData.businessStatus === 'operating' 
    ? formData.currentUnit 
    : formData.plannedBusiness
  const businessLabels: Record<string, string> = {
    'delivery_only': '🚚 Delivery-only',
    'mobile': '🚐 Mobile business',
    'home': '🏠 Home kitchen',
    'cafe': '☕ Café/takeaway',
    'restaurant': '🍽️ Restaurant',
    'catering': '🎉 Catering',
    'production': '🏭 Production',
    'starting': '🚀 New business',
    'popup': '⚡ Pop-up'
  }
  if (businessType && businessLabels[businessType]) {
    factors.push(businessLabels[businessType])
  }
  
  if (formData.budget) factors.push(`💰 ${formData.budget.replace('/month', '')}`)
  if (formData.dailyOutput && formData.dailyOutput !== 'Not sure yet') {
    factors.push(`📊 ${formData.dailyOutput} orders/day`)
  }
  if (formData.cuisines && formData.cuisines.length > 0) {
    factors.push(`🍴 ${formData.cuisines.slice(0, 2).join(', ')}`)
  }
  
  return factors.slice(0, 5)
}

// #3 - Generate location demand insight
function generateDemandInsight(formData: any): string | null {
  const location = formData.location?.toLowerCase() || ''
  const cuisines = formData.cuisines || []
  const businessType = formData.businessStatus === 'operating' 
    ? formData.currentUnit 
    : formData.plannedBusiness
  
  // Location-based insights
  const locationInsights: Record<string, Record<string, string>> = {
    'london': {
      'Caribbean': 'Delivery demand for Caribbean food in South and East London has grown 35% year-on-year. Strong opportunity.',
      'Indian': 'Indian cuisine remains highly competitive in London — consider a niche (e.g., South Indian, street food) to stand out.',
      'Burgers': 'Burger market is saturated in central London, but demand is growing in outer zones (E17, SE15, N17).',
      'Chicken & Chips': 'Chicken shops remain high-demand, especially in residential areas. Consider dark kitchen for lower overheads.',
      'Pizza': 'Artisan pizza is trending upward in London, especially sourdough and Neapolitan styles.',
      'Desserts & Bakery': 'Dessert delivery has doubled since 2023. Strong opportunity for specialist bakeries.',
      'default': 'London has high demand but intense competition. Differentiation is key to standing out.'
    },
    'manchester': {
      'Burgers': 'Manchester burger scene is booming, especially in Northern Quarter and Ancoats areas.',
      'Indian': 'Curry Mile competition is fierce — dark kitchens in South Manchester offer better margins.',
      'default': 'Manchester's food scene is growing fast. Good time to enter with the right concept.'
    },
    'birmingham': {
      'Indian': 'Birmingham has the UK's largest South Asian community — authentic cuisines do well here.',
      'Caribbean': 'Growing Caribbean food scene in Birmingham, especially in Handsworth and city centre.',
      'default': 'Birmingham's food delivery market is expanding rapidly with lower competition than London.'
    }
  }
  
  // Find matching insight
  for (const [city, insights] of Object.entries(locationInsights)) {
    if (location.includes(city)) {
      for (const cuisine of cuisines) {
        if (insights[cuisine]) return insights[cuisine]
      }
      return insights['default']
    }
  }
  
  // Generic insight for other locations
  if (businessType === 'delivery_only') {
    return 'Delivery-only models have lower overheads and can test demand before committing to premises.'
  }
  if (businessType === 'mobile') {
    return 'Mobile food businesses can test multiple locations to find their best spots before settling.'
  }
  
  return null
}

// #7 - Generate "Also Consider" alternative
function generateAlsoConsider(formData: any, topResultType: string): { type: string; reason: string } | null {
  const businessType = formData.businessStatus === 'operating' 
    ? formData.currentUnit 
    : formData.plannedBusiness
  const budget = formData.budget || ''
  
  // If they chose dark kitchen, suggest alternatives
  if (topResultType === 'dark_kitchen') {
    if (budget.includes('Under') || budget.includes('500')) {
      return {
        type: 'shared_kitchen',
        reason: 'On a tighter budget? A shared kitchen lets you pay by the hour while you build up orders — lower risk while testing your concept.'
      }
    }
    if (businessType === 'starting' || businessType === 'home') {
      return {
        type: 'shared_kitchen',
        reason: 'Just starting out? A shared kitchen gives you flexibility to scale hours up or down as you learn what works.'
      }
    }
  }
  
  // If they chose shared kitchen, suggest growth path
  if (topResultType === 'shared_kitchen') {
    if (formData.dailyOutput?.includes('100') || formData.dailyOutput?.includes('200')) {
      return {
        type: 'dark_kitchen',
        reason: 'At your volume, a dedicated dark kitchen could actually be more cost-effective than hourly rates — and gives you 24/7 access.'
      }
    }
  }
  
  // If they chose mobile, suggest testing first
  if (topResultType === 'mobile_supplier') {
    return {
      type: 'shared_kitchen',
      reason: 'Before investing in a van, consider testing your menu from a shared kitchen first. Lower risk way to validate demand.'
    }
  }
  
  // If looking at marketplace
  if (topResultType === 'marketplace') {
    return {
      type: 'direct_provider',
      reason: 'Marketplaces are great for comparing options, but going direct to providers like Karma Kitchen often gets you better terms.'
    }
  }
  
  return null
}

// #8 - Generate growth path recommendation
function generateGrowthPath(formData: any, topResultType: string): { current: string; next: string; trigger: string } | null {
  const businessType = formData.businessStatus === 'operating' 
    ? formData.currentUnit 
    : formData.plannedBusiness
  const dailyOutput = formData.dailyOutput || ''
  
  // Home → Shared → Dark Kitchen path
  if (businessType === 'home' || businessType === 'starting') {
    return {
      current: 'Shared Kitchen',
      next: 'Dark Kitchen',
      trigger: 'When you hit 50+ consistent daily orders, graduate to a dedicated unit'
    }
  }
  
  // Shared → Dark Kitchen path
  if (topResultType === 'shared_kitchen') {
    return {
      current: 'Shared Kitchen (hourly)',
      next: 'Dedicated Dark Kitchen',
      trigger: 'Move up when hourly costs exceed £1,500/month or you need 24/7 access'
    }
  }
  
  // Dark Kitchen → Multi-site path
  if (topResultType === 'dark_kitchen' && (dailyOutput.includes('200') || dailyOutput.includes('500'))) {
    return {
      current: 'Single Dark Kitchen',
      next: 'Multi-site Operation',
      trigger: 'Consider a second location when maxing out capacity or to cover new delivery zones'
    }
  }
  
  // Mobile → Fixed premises path
  if (topResultType === 'mobile_supplier') {
    return {
      current: 'Mobile Unit',
      next: 'Fixed Premises or Dark Kitchen',
      trigger: 'Once you\'ve built a loyal following and consistent revenue, consider a permanent base'
    }
  }
  
  return null
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json()
    
    // Save the match request
    const { data: matchData, error: matchError } = await supabase
      .from('fmak_matches')
      .insert({
        business_status: formData.businessStatus,
        current_unit: formData.currentUnit,
        planned_business: formData.plannedBusiness,
        cuisines: formData.cuisines,
        equipment: formData.equipment,
        staff_count: formData.staffCount,
        daily_output: formData.dailyOutput,
        expansion_plans: formData.expansionPlans,
        location: formData.location,
        budget: formData.budget,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (matchError) {
      console.error('Error saving match:', matchError)
    }
    
    // Score all providers
    const scoredProviders = PROVIDERS.map(provider => ({
      ...provider,
      score: scoreProvider(provider, formData)
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    
    // Calculate match percentage and generate personalized benefits
    const maxPossibleScore = 215 // Sum of all max scores
    const providersWithPercentage = scoredProviders.map(p => ({
      ...p,
      matchPercent: Math.round((p.score / maxPossibleScore) * 100),
      benefits: generateBenefits(p, formData)
    }))
    
    // Generate recommendation text with OpenAI
    let recommendation = ''
    try {
      const businessType = formData.businessStatus === 'operating' ? formData.currentUnit : formData.plannedBusiness
      const topProvider = providersWithPercentage[0]
      
      if (!topProvider) {
        recommendation = `We couldn't find providers matching all your criteria in ${formData.location}. Try broadening your search or contact us for personalised recommendations.`
      } else {
        const prompt = `You are a commercial kitchen expert. Based on these user needs, write 2-3 sentences recommending the best kitchen solution. Be specific and helpful. Do not mention AI. Be direct and practical.

User profile:
- Business type: ${businessType}
- Cuisines: ${formData.cuisines?.join(', ') || 'Not specified'}
- Equipment needed: ${formData.equipment?.slice(0, 5).join(', ') || 'Not specified'}
- Staff: ${formData.staffCount}
- Daily output: ${formData.dailyOutput}
- Location: ${formData.location}
- Budget: ${formData.budget}
- Expansion plans: ${formData.expansionPlans}

Top match: ${topProvider.name} (${topProvider.type.replace('_', ' ')}) - ${topProvider.matchPercent}% match
Second option: ${providersWithPercentage[1]?.name || 'N/A'}

Write a personalized recommendation explaining why the top match suits their specific needs. Mention one specific feature that makes it ideal for their situation.`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.7
        })
        
        recommendation = completion.choices[0]?.message?.content || ''
      }
    } catch (e) {
      console.error('OpenAI error:', e)
      const topProvider = providersWithPercentage[0]
      recommendation = topProvider 
        ? `Based on your ${formData.cuisines?.[0] || 'food'} business in ${formData.location}, ${topProvider.name} is your best match at ${topProvider.matchPercent}%. They offer ${topProvider.features[0].toLowerCase()} which suits your ${formData.budget} budget.`
        : `We couldn't find an exact match for your criteria. Browse our marketplace options or contact us for help.`
    }
    
    // Save results
    const matchId = matchData?.id || `temp_${Date.now()}`
    
    // Generate intelligence data
    const topResultType = providersWithPercentage[0]?.type || ''
    const matchFactors = generateMatchFactors(formData)
    const demandInsight = generateDemandInsight(formData)
    const alsoConsider = generateAlsoConsider(formData, topResultType)
    const growthPath = generateGrowthPath(formData, topResultType)
    
    // Build full response
    const fullMatchData = {
      results: providersWithPercentage,
      recommendation,
      matchFactors,
      demandInsight,
      alsoConsider,
      growthPath,
      userProfile: {
        location: formData.location,
        businessType: formData.businessStatus === 'operating' ? formData.currentUnit : formData.plannedBusiness,
        budget: formData.budget,
        scale: formData.dailyOutput,
        cuisines: formData.cuisines
      }
    }
    
    if (matchData?.id) {
      await supabase
        .from('fmak_matches')
        .update({
          results: providersWithPercentage,
          recommendation,
          match_factors: matchFactors,
          demand_insight: demandInsight
        })
        .eq('id', matchData.id)
    }
    
    return NextResponse.json({
      success: true,
      matchId,
      ...fullMatchData
    })
    
  } catch (error) {
    console.error('Match error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
