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
    website: 'https://www.jacuna.co.uk',
    description: 'Growing dark kitchen network with sites across major UK cities. Good mid-range option for delivery brands.'
  },
  {
    id: 'chefs-lab',
    name: 'Chefs Lab',
    type: 'dark_kitchen',
    cities: ['Birmingham'],
    priceMin: 1500,
    priceMax: 4000,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Deep fat fryers', 'Extraction / Ventilation', 'Prep tables'],
    features: ['Deliveroo & Uber Eats ready', 'Flexible terms', 'WhatsApp support', 'Ghost kitchen setup'],
    bestForBusiness: ['delivery_only', 'dark_kitchen'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Indian', 'Caribbean', 'Chinese'],
    website: 'https://chefslab.co.uk',
    phone: '0121 227 8568',
    description: 'Commercial dark kitchens in Birmingham. Purpose-built for Deliveroo, Uber Eats, and ghost kitchen operations. Central location with flexible rental terms.'
  },
  {
    id: 'ready-kitchen',
    name: 'Ready Kitchen',
    type: 'dark_kitchen',
    cities: ['London'],
    priceMin: 2000,
    priceMax: 4500,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Deep fat fryers', 'Extraction / Ventilation', 'Prep tables', 'Upright fridge'],
    features: ['Canary Wharf location', 'Turnkey solution', 'Delivery-only', 'High demand area', 'Online ordering tech'],
    bestForBusiness: ['delivery_only', 'dark_kitchen'],
    bestForScale: ['small', 'medium', 'large'],
    bestForBudget: ['2000-5000'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Indian', 'Chinese', 'Healthy / Salads'],
    website: 'https://www.readykitchen.co.uk',
    description: 'Turnkey dark kitchens in Canary Wharf — one of London\'s highest delivery demand areas. Designed for online ordering and delivery. Low-risk, flexible setup.'
  },
  {
    id: 'titus-cics',
    name: 'Titus by CSUK',
    type: 'dark_kitchen',
    cities: ['Nationwide'],
    priceMin: 1500,
    priceMax: 5000,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Extraction / Ventilation', 'Prep tables', 'Modular setup'],
    features: ['Modular kitchens', 'Dark kitchen hubs', 'Bespoke builds available', 'National chains welcome', 'Rolling or fixed terms'],
    bestForBusiness: ['delivery_only', 'dark_kitchen', 'production'],
    bestForScale: ['small', 'medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['all'],
    website: 'https://cics.space/modular-construction/cloud-and-dark-kitchen-manufacture/',
    description: 'Titus (part of CSUK Group) offers dark kitchen hubs around the UK with rolling or fixed-term memberships. They manufacture modular cloud kitchens for startups and national chains.'
  },
  {
    id: 'one-kcn',
    name: 'One KCN',
    type: 'dark_kitchen',
    cities: ['London'],
    priceMin: 1800,
    priceMax: 5000,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Deep fat fryers', 'Extraction / Ventilation', 'Prep tables', 'Upright fridge', 'Upright freezer'],
    features: ['State-of-the-art', 'Equipment packages available', 'SW6 premium location', '30 years catering experience', 'High-speed internet', 'Fire & security'],
    bestForBusiness: ['delivery_only', 'dark_kitchen', 'catering', 'production'],
    bestForScale: ['small', 'medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Indian', 'Chinese', 'Burgers', 'Healthy / Salads', 'Mediterranean', 'Caribbean'],
    website: 'https://www.onekcn.com',
    description: 'Premium ghost kitchens in Fulham, SW6. 7 high-end kitchens in one of London\'s highest delivery demand areas. Equipment financing available. 30 years industry experience.'
  },
  {
    id: 'the-co-kitchens',
    name: 'The Co-Kitchens',
    type: 'shared_kitchen',
    cities: ['London'],
    priceMin: 1200,
    priceMax: 4000,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Prep tables', 'Storage shelving', 'Upright fridge', 'Upright freezer'],
    features: ['Community focused', 'Natural lighting', 'Flexible hours', 'R&D friendly', 'Bring your own equipment'],
    bestForBusiness: ['starting', 'production', 'catering', 'dark_kitchen'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Desserts & Bakery', 'Healthy / Salads', 'Mediterranean', 'Italian / Pasta'],
    website: 'https://theco-kitchens.com',
    description: 'Community-focused cloud kitchen with great natural lighting and flexible hours. Popular for R&D, product development, and growing food brands. Highly rated by users.'
  },
  {
    id: 'sharedining',
    name: 'ShareDining',
    type: 'shared_kitchen',
    cities: ['London', 'Leeds'],
    priceMin: 15,
    priceMax: 50,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Prep tables', 'Upright fridge'],
    features: ['Schools & church halls', 'Cafes & restaurants', 'Flexible hourly', 'Online booking', 'Affordable'],
    bestForBusiness: ['starting', 'home', 'catering', 'popup', 'production'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['under-500', '500-1000', '1000-2000'],
    cuisineStrength: ['all'],
    website: 'https://sharedining.co.uk',
    description: 'Kitchen marketplace listing spaces in schools, church halls, cafes and restaurants. Flexible hourly booking at affordable rates across London and Leeds.'
  },
  {
    id: 'n4-kitchen-hire',
    name: 'N4 Kitchen Hire',
    type: 'shared_kitchen',
    cities: ['London'],
    priceMin: 15,
    priceMax: 35,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Prep tables', 'Upright fridge', 'Upright freezer'],
    features: ['5-star hygiene rating', '24hr access', 'Loading bays', 'Free parking', 'Free WiFi', 'Short & long term'],
    bestForBusiness: ['starting', 'catering', 'popup', 'production', 'delivery_only'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['under-500', '500-1000'],
    cuisineStrength: ['Burgers', 'Indian', 'Caribbean', 'Chinese', 'Desserts & Bakery'],
    website: 'https://www.n4kitchenhire.co.uk',
    description: 'Affordable hourly kitchen hire in North London (N4). 5-star hygiene, 24hr access, 4 miles from central London. Ideal for market traders, delivery restaurants, and food producers.'
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
    website: 'https://sharethere.co',
    description: 'Book commercial kitchen space by the hour across the UK. Ideal for caterers, pop-up chefs, and food producers needing flexible access.'
  },
  // The Kitchen Collective REMOVED (Mar 2026) - website thekitchencollective.co.uk doesn't exist, tkcollective.co is NZ not UK
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
  // Mobile Catering Solutions REMOVED - website doesn't exist (Mar 2026)
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
    cuisineStrength: ['Healthy / Salads', 'Desserts & Bakery', 'Coffee & Cafe'],
    website: 'https://foodworks-sw.co.uk',
    description: 'Food business incubator in the South West. Great for food startups needing production space plus business support.'
  },
  
  // ADDITIONAL DARK KITCHENS
  {
    id: 'dephna',
    name: 'Dephna',
    type: 'dark_kitchen',
    cities: ['London'],
    priceMin: 1500,
    priceMax: 4000,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Walk-in cold room', 'Prep tables', 'Storage shelving'],
    features: ['8 London locations', 'Since 1972', 'Cold storage available', 'Flexible terms'],
    bestForBusiness: ['delivery_only', 'production', 'catering'],
    bestForScale: ['small', 'medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['all'],
    website: 'https://dephna.com',
    description: 'Established London kitchen provider since 1972. Eight locations across North West London. Reliable and experienced.'
  },
  // Peckham Levels Kitchen REMOVED (Mar 2026) - event venue, not commercial kitchen hire
  {
    id: 'maida-hill-place',
    name: 'Maida Hill Place',
    type: 'shared_kitchen',
    cities: ['London'],
    priceMin: 15,
    priceMax: 40,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Mixer', 'Prep tables'],
    features: ['Westminster location', 'Business development', 'Affordable rates', 'Community kitchen'],
    bestForBusiness: ['starting', 'home', 'popup'],
    bestForScale: ['small'],
    bestForBudget: ['under-500', '500-1000'],
    cuisineStrength: ['Desserts & Bakery', 'Caribbean', 'Healthy / Salads'],
    website: 'https://www.maidahillplace.co.uk',
    description: 'Community kitchen in Westminster supporting food startups. Low overheads and business development support included.'
  },
  {
    id: 'encore-kitchens',
    name: 'Encore Kitchens',
    type: 'shared_kitchen',
    cities: ['London', 'Birmingham', 'Manchester'],
    priceMin: 150,
    priceMax: 400,
    priceUnit: 'day',
    equipment: ['Commercial oven', 'Walk-in cold room', 'Blast chiller', 'Prep tables', 'Mixer'],
    features: ['Day rate available', 'Multiple London sites', 'Large production spaces', 'Professional grade'],
    bestForBusiness: ['production', 'catering'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['all'],
    website: 'https://encorekitchens.co.uk',
    description: 'Day-rate production kitchens across London, Birmingham and Manchester. Professional facilities for serious producers.'
  },
  
  // ADDITIONAL MOBILE SUPPLIERS
  {
    id: 'ar-willis',
    name: 'A&R Willis',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 12000,
    priceMax: 45000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec', 'VCA approved'],
    features: ['VCA approved', '20+ years experience', 'Family run', 'Container conversions'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Breakfast & Brunch'],
    website: 'https://arwilliscateringtrailers.co.uk',
    description: 'Family-run VCA-approved trailer manufacturer with 20+ years experience. Quality builds at fair prices.'
  },
  {
    id: 'towability',
    name: 'Towability',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 20000,
    priceMax: 65000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec'],
    features: ['Citroen H-Van specialists', 'Vintage conversions', 'Eye-catching designs'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Coffee & Cafe', 'Pizza', 'Desserts & Bakery', 'Burgers'],
    website: 'https://towability.com',
    description: 'Specialists in Citroen H-Van and vintage vehicle conversions. Stand-out retro designs that draw crowds.'
  },
  {
    id: 'maxi-mover',
    name: 'Maxi Mover',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 25000,
    priceMax: 65000,
    priceUnit: 'one_time',
    equipment: ['Low-floor van base', 'Lightweight construction', 'Custom spec available'],
    features: ['Low-floor van specialists', 'Direct from manufacturer', 'Maximum payload', 'Hexlite lightweight materials', 'Type approved'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium', 'large'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Coffee & Café', 'Pizza'],
    website: 'https://www.maximover.co.uk',
    description: 'UK low-floor van manufacturer specialising in catering conversions. Revolutionary lightweight Hexlite materials maximise payload. Deal direct with factory.'
  },
  {
    id: 'raccoon-vehicles',
    name: 'Raccoon Vehicles',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 35000,
    priceMax: 100000,
    priceUnit: 'one_time',
    equipment: ['Bespoke to spec', 'Premium materials', 'Full branding'],
    features: ['Premium bespoke builds', 'Exhibition vehicles', 'Sample trucks', 'Roadshow specialists', 'Full design service'],
    bestForBusiness: ['mobile'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['5000+'],
    cuisineStrength: ['all'],
    website: 'https://www.raccoon.co.uk',
    description: 'High-end bespoke vehicle conversions for brands that demand excellence. Street food, exhibition, sampling — premium builds with full design service.'
  },
  {
    id: '4sure-catering',
    name: '4Sure Catering',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 15000,
    priceMax: 60000,
    priceUnit: 'one_time',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range', 'Flat griddle / Plancha', 'Bain maries'],
    features: ['Trailers & vans', 'Full range', 'Established manufacturer', 'Detailed specs available', 'Finance options'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Breakfast & Brunch', 'Coffee & Café'],
    website: 'https://4sure.co.uk',
    description: 'Established catering trailer and van manufacturer with full product range. Detailed specs and guidance for new and experienced operators.'
  },
  {
    id: 'catering-units',
    name: 'Catering Units UK',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 10000,
    priceMax: 35000,
    priceUnit: 'one_time',
    equipment: ['Bain maries', 'Deep fat fryers', 'Flat griddle / Plancha'],
    features: ['25+ years experience', 'Family business', 'All sectors covered'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Breakfast & Brunch'],
    website: 'https://cateringunits.co.uk',
    description: 'Established family business with 25+ years in catering unit manufacturing. Reliable builds for all budgets.'
  },
  {
    id: 'food-truck-masters',
    name: 'Food Truck Masters',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 25000,
    priceMax: 80000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec'],
    features: ['Vintage specialists', 'Full restoration', 'Unique vehicles'],
    bestForBusiness: ['mobile'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Coffee & Cafe', 'Pizza', 'Desserts & Bakery'],
    website: 'https://foodtruckmasters.com',
    description: 'Vintage food truck restoration specialists. Hand-picked unique vehicles transformed into head-turning mobile kitchens.'
  },
  {
    id: 'catering-van-conversions',
    name: 'Catering Van Conversions',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 15000,
    priceMax: 50000,
    priceUnit: 'one_time',
    equipment: ['Deep fat fryers', 'Flat griddle / Plancha', 'Bain maries', 'Commercial oven'],
    features: ['Bespoke builds', 'Quick turnaround', 'All van types'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Indian', 'Caribbean'],
    website: 'https://cateringvanconversions.com',
    description: 'Custom-built catering vans designed for your specific needs. Professional builds with good value pricing.'
  },
  {
    id: 'premier-catering',
    name: 'Premier Catering Manufacture',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 18000,
    priceMax: 55000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec', 'Deep fat fryers', 'Gas hobs / Range'],
    features: ['Full conversions', 'Trailer specialists', 'Commercial grade'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium', 'large'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Pizza'],
    website: 'https://commercialkitchencompany.co.uk',
    description: 'Specialist mobile catering van and trailer conversions. Commercial-grade builds for serious operators.'
  },
  
  // REGIONAL SHARED KITCHENS - AUDIT (Mar 2026)
  // Baltic Kitchen Liverpool REMOVED - kitchen fitters, not commercial kitchen rental
  // Sheffield Kitchen Collective REMOVED - website doesn't exist
  // Nottingham Food Hub REMOVED - website doesn't exist
  // Edinburgh Food Studio REMOVED - supper club/events, not commercial rental
  // Glasgow Kitchen Incubator REMOVED - website doesn't exist
  // Cardiff Food Factory REMOVED - website doesn't exist
  // Leeds Food Works REMOVED - website doesn't exist
  // Newcastle Kitchen Hub REMOVED - website doesn't exist
  
  // ADDITIONAL DARK KITCHENS
  {
    id: 'ghost-x-kitchens',
    name: 'Ghost x Kitchens',
    type: 'dark_kitchen',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'],
    priceMin: 1800,
    priceMax: 4500,
    priceUnit: 'month',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range', 'Extraction / Ventilation'],
    features: ['Modern facilities', 'Flexible terms', 'Delivery platform support', 'Digital-first approach'],
    bestForBusiness: ['delivery_only', 'dark_kitchen'],
    bestForScale: ['small', 'medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Pizza', 'Indian', 'Chinese'],
    website: 'https://ghostxkitchens.co.uk',
    description: 'Modern dark kitchen spaces for digital-first food brands. From startups to national chains.'
  },
  
  // MORE BRISTOL/SOUTHWEST KITCHENS
  {
    id: 'cooking-it-bristol',
    name: 'Cooking It',
    type: 'shared_kitchen',
    cities: ['Bristol'],
    priceMin: 15,
    priceMax: 45,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Prep tables', 'Upright fridge', 'Upright freezer'],
    features: ['Event space', 'Filming available', 'Pop-up ready', 'Ghost kitchen use'],
    bestForBusiness: ['starting', 'popup', 'catering', 'production'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['under-500', '500-1000', '1000-2000'],
    cuisineStrength: ['all'],
    website: 'https://cookingit.co.uk',
    description: 'Versatile commercial kitchen in Bristol for production, filming, pop-ups and ghost kitchen use.'
  },
  {
    id: 'cloud-kingdom-bristol',
    name: 'Cloud Kingdom Kitchen',
    type: 'shared_kitchen',
    cities: ['Bristol'],
    priceMin: 12,
    priceMax: 35,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Prep tables', 'Storage'],
    features: ['Central location', 'Affordable', 'Flexible hours'],
    bestForBusiness: ['starting', 'catering', 'popup'],
    bestForScale: ['small'],
    bestForBudget: ['under-500', '500-1000'],
    cuisineStrength: ['all'],
    website: 'https://cloudkingdomkitchenhire.co.uk',
    description: 'Affordable commercial kitchen and prep space in central Bristol. Flexible hourly hire.'
  },
  {
    id: 'coexist-bristol',
    name: 'Coexist Community Kitchen',
    type: 'shared_kitchen',
    cities: ['Bristol'],
    priceMin: 10,
    priceMax: 30,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Prep tables', 'Upright fridge'],
    features: ['Community focused', 'Workshops', 'Affordable', 'Social enterprise'],
    bestForBusiness: ['starting', 'catering', 'popup'],
    bestForScale: ['small'],
    bestForBudget: ['under-500', '500-1000'],
    cuisineStrength: ['all'],
    website: 'https://www.coexistcommunitykitchen.org',
    description: 'Community kitchen supporting local food businesses. Every hire supports community meals and classes.'
  },
  
  // MORE NORTHERN KITCHENS
  {
    id: 'centre-for-life-newcastle',
    name: 'Centre for Life Kitchen',
    type: 'shared_kitchen',
    cities: ['Newcastle'],
    priceMin: 20,
    priceMax: 50,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Dishwasher', 'Prep tables', 'Walk-in cold room'],
    features: ['City centre', '140 sqm space', 'Modern equipment', 'Professional grade'],
    bestForBusiness: ['production', 'catering', 'popup'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['all'],
    website: 'https://life.org.uk',
    description: 'Large 140sqm professional kitchen in Newcastle city centre. Modern equipment and excellent facilities.'
  },
  {
    id: 'encore-kitchens-manchester',
    name: 'Encore Kitchens Manchester',
    type: 'dark_kitchen',
    cities: ['Manchester'],
    priceMin: 1500,
    priceMax: 5000,
    priceUnit: 'month',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Deep fat fryers', 'Extraction / Ventilation', 'Walk-in cold room', 'Prep tables'],
    features: ['Delivery focused', '25+ UK locations', 'Flexible terms', 'Distribution support'],
    bestForBusiness: ['delivery_only', 'dark_kitchen', 'production'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['1000-2000', '2000-5000', '5000+'],
    cuisineStrength: ['Burgers', 'Chicken & Chips', 'Indian', 'Chinese', 'all'],
    website: 'https://www.encorekitchens.co.uk',
    description: 'Part of the UK\'s largest commercial kitchen network with 550+ kitchens. Delivery kitchens, CPUs and distribution centres across Manchester.'
  },
  
  // SPECIALTY MOBILE SUPPLIERS
  {
    id: 'the-big-coffee',
    name: 'The Big Coffee',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 15000,
    priceMax: 55000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec', 'Piaggio specialists'],
    features: ['Piaggio Ape specialists', 'Horsebox conversions', 'Pizza trailers', 'UK warranty'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000', '5000+'],
    cuisineStrength: ['Coffee & Cafe', 'Pizza', 'Desserts & Bakery'],
    website: 'https://thebigcoffee.com',
    description: 'Specialists in Piaggio Ape and horsebox conversions. Perfect for coffee, pizza and artisan concepts.'
  },
  {
    id: 'karpatia-trucks',
    name: 'Karpatia Trucks',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 12000,
    priceMax: 45000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec'],
    features: ['Horsebox specialists', 'Financing available', 'Website included', 'Business support'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['1000-2000', '2000-5000'],
    cuisineStrength: ['Coffee & Cafe', 'Desserts & Bakery', 'Pizza'],
    website: 'https://karpatiatrucks.com',
    description: 'Horsebox conversion specialists with full business support package including financing and website.'
  },
  {
    id: 'mobile-retail-group',
    name: 'Mobile Retail Group',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 20000,
    priceMax: 70000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec'],
    features: ['Premium builds', 'Full branding', 'Trailer conversions', 'Corporate clients'],
    bestForBusiness: ['mobile'],
    bestForScale: ['medium', 'large'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Coffee & Cafe', 'Pizza', 'Burgers', 'Desserts & Bakery'],
    website: 'https://mobileretailgroup.com',
    description: 'Premium mobile catering conversions with full branding packages. Corporate and event specialists.'
  },
  {
    id: 'coffee-latino',
    name: 'Coffee Latino',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 8000,
    priceMax: 35000,
    priceUnit: 'one_time',
    equipment: ['Coffee machines', 'Custom fit-out'],
    features: ['Horsebox specialists', 'Coffee focus', 'Supply your own vehicle option'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['500-1000', '1000-2000', '2000-5000'],
    cuisineStrength: ['Coffee & Cafe'],
    website: 'https://coffeelatino.co.uk',
    description: 'Coffee-focused horsebox conversions. Supply your own vehicle or buy complete. Great entry prices.'
  },
  {
    id: 'pizza-trailer-co',
    name: 'Wood Fired Pizza Ovens UK',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 18000,
    priceMax: 50000,
    priceUnit: 'one_time',
    equipment: ['Pizza oven', 'Custom built to spec'],
    features: ['Wood-fired specialists', 'Trailer builds', 'Van conversions', 'Training included'],
    bestForBusiness: ['mobile'],
    bestForScale: ['small', 'medium'],
    bestForBudget: ['2000-5000', '5000+'],
    cuisineStrength: ['Pizza'],
    website: 'https://wood-fired-pizza-ovens.co.uk/mobile-pizza-ovens/',
    description: 'Specialist pizza trailer and van conversions with wood-fired oven options. Training included.'
  },
  
  // MORE LONDON KITCHENS
  // The Mazi Project REMOVED (Mar 2026) - event/supper club venue, not commercial food production
  // Brixton Kitchen Hub REMOVED (Mar 2026) - website no longer active
]

function scoreProvider(provider: typeof PROVIDERS[0], formData: any): number {
  let score = 0
  let matchReasons: string[] = []
  
  // 0. SPACE TYPE FILTER - Exclude incompatible provider types
  const spaceType = formData.spaceType
  if (spaceType) {
    // Customer-facing: exclude dark kitchens and production-only spaces
    if (spaceType === 'customer_facing') {
      if (provider.type === 'dark_kitchen' || provider.type === 'production_kitchen') {
        return 0 // Exclude - they want customer-facing, not production
      }
    }
    // Production only: prioritize dark kitchens and production kitchens
    if (spaceType === 'production_only') {
      if (provider.type === 'retail_space' || provider.type === 'food_hall') {
        return 0 // Exclude retail/food hall for production-only users
      }
    }
    // Mobile unit: only show mobile suppliers
    if (spaceType === 'mobile_unit') {
      if (provider.type !== 'mobile_supplier') {
        return 0 // Only mobile suppliers for mobile unit seekers
      }
    }
    // Both: allow all types
  }
  
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
  // Check if user selected a one-time purchase budget (mobile unit buyer)
  const isPurchaseBudget = formData.budget?.includes('one-time purchase')
  
  const budgetMap: Record<string, { monthly: number, key: string, purchase?: number }> = {
    'Under £500/month': { monthly: 500, key: 'under-500' },
    '£500 - £1,000/month': { monthly: 1000, key: '500-1000' },
    '£1,000 - £2,000/month': { monthly: 2000, key: '1000-2000' },
    '£2,000 - £5,000/month': { monthly: 5000, key: '2000-5000' },
    '£5,000+/month': { monthly: 10000, key: '5000+' },
    '💰 £15,000 - £25,000 (one-time purchase)': { monthly: 0, key: 'purchase-15-25k', purchase: 25000 },
    '💰 £25,000 - £50,000 (one-time purchase)': { monthly: 0, key: 'purchase-25-50k', purchase: 50000 },
    '💰 £50,000+ (one-time purchase)': { monthly: 0, key: 'purchase-50k+', purchase: 75000 },
    'Not sure / Flexible': { monthly: 3000, key: 'flexible' }
  }
  
  const userBudgetInfo = budgetMap[formData.budget] || { monthly: 2000, key: 'flexible' }
  
  // If user selected purchase budget, ONLY show mobile suppliers
  if (isPurchaseBudget) {
    if (provider.type === 'mobile_supplier' && provider.priceUnit === 'one_time') {
      // Check if provider's price is within user's purchase budget
      if (userBudgetInfo.purchase && provider.priceMax <= userBudgetInfo.purchase * 1.2) {
        score += 35
        matchReasons.push('purchase_budget')
      } else if (userBudgetInfo.purchase && provider.priceMin <= userBudgetInfo.purchase) {
        score += 25
        matchReasons.push('purchase_budget')
      } else {
        score += 10 // Mobile supplier but maybe out of budget
      }
    } else {
      // Not a mobile supplier - heavily penalize for purchase budget users
      score -= 50
    }
  } else {
    // Monthly budget logic (exclude mobile suppliers for monthly budgets unless mobile business)
    if (provider.priceUnit === 'one_time' && businessType !== 'mobile') {
      // One-time purchase providers should score low for monthly budget users
      score += 5
    } else {
      // Calculate actual monthly price for comparison
      let monthlyPrice = provider.priceMin
      if (provider.priceUnit === 'hour') monthlyPrice = provider.priceMin * 80 // 20hrs/week estimate
      if (provider.priceUnit === 'week') monthlyPrice = provider.priceMin * 4
      if (provider.priceUnit === 'day') monthlyPrice = provider.priceMin * 20 // 5 days/week estimate
      
      // STRICT budget matching - provider's MIN price must fit user's MAX budget
      // Budget is CRITICAL - should heavily influence results
      if (provider.priceUnit !== 'one_time') {
        if (monthlyPrice <= userBudgetInfo.monthly) {
          // Provider fits within budget - full points
          score += 50
          matchReasons.push('budget')
        } else if (monthlyPrice <= userBudgetInfo.monthly * 1.2) {
          // Slightly over budget (up to 20% over) - some points
          score += 15
        } else if (monthlyPrice <= userBudgetInfo.monthly * 1.5) {
          // Significantly over budget (20-50% over) - no bonus
          score += 0
        } else {
          // Way over budget - HEAVY PENALTY
          score -= 40
        }
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
  
  // 8. MARKETPLACE PENALTY - Marketplaces should rank below direct providers
  // They're useful as fallback options but shouldn't beat a well-matched kitchen
  if (provider.type === 'marketplace') {
    score -= 50 // Significant penalty - marketplaces should be last resort
  }
  
  return score
}

// Generate explicit "Why This Match" reasoning tied to user's specific inputs
function generateWhyThisMatch(provider: typeof PROVIDERS[0], formData: any): string {
  const businessType = formData.businessStatus === 'operating' 
    ? formData.currentUnit 
    : formData.plannedBusiness
  const location = formData.location || 'your area'
  const budget = formData.budget || ''
  const cuisines = formData.cuisines || []
  const dailyOutput = formData.dailyOutput || ''
  const staffCount = formData.staffCount || ''
  const expansionPlans = formData.expansionPlans || ''
  
  const reasons: string[] = []
  
  // Location reasoning
  if (provider.cities.includes('Nationwide')) {
    reasons.push(`operate nationwide so can serve you in ${location}`)
  } else {
    reasons.push(`have facilities in ${location}`)
  }
  
  // Business type reasoning
  const businessLabels: Record<string, string> = {
    'delivery_only': 'delivery-only brand',
    'mobile': 'mobile food business',
    'home': 'home-based business looking to scale',
    'cafe': 'cafe or takeaway',
    'restaurant': 'restaurant',
    'catering': 'catering operation',
    'production': 'food production business',
    'starting': 'new food business',
    'popup': 'pop-up concept',
    'dark_kitchen': 'existing dark kitchen operation'
  }
  const businessLabel = businessLabels[businessType] || 'food business'
  
  if (provider.type === 'dark_kitchen') {
    reasons.push(`dark kitchens are ideal for your ${businessLabel} - you only pay for kitchen space, not customer-facing premises`)
  } else if (provider.type === 'shared_kitchen') {
    reasons.push(`shared kitchens give you the flexibility a ${businessLabel} needs - pay for what you use, scale when ready`)
  } else if (provider.type === 'mobile_supplier') {
    reasons.push(`a mobile unit lets your ${businessLabel} go where the customers are - festivals, markets, events`)
  } else if (provider.type === 'production_kitchen') {
    reasons.push(`production kitchens are built for the volume your ${businessLabel} requires`)
  }
  
  // Budget reasoning - only claim budget fit if it actually fits
  if (budget && provider.priceUnit !== 'one_time') {
    const budgetMaxMap: Record<string, number> = {
      'Under £500/month': 500,
      '£500 - £1,000/month': 1000,
      '£1,000 - £2,000/month': 2000,
      '£2,000 - £5,000/month': 5000,
      '£5,000+/month': 15000
    }
    const userMaxBudget = budgetMaxMap[budget] || 3000
    
    let monthlyPrice = provider.priceMin
    if (provider.priceUnit === 'hour') monthlyPrice = provider.priceMin * 80
    if (provider.priceUnit === 'week') monthlyPrice = provider.priceMin * 4
    if (provider.priceUnit === 'day') monthlyPrice = provider.priceMin * 20
    
    if (monthlyPrice <= userMaxBudget) {
      // Actually fits the budget - can claim this
      reasons.push(`pricing from ${provider.priceUnit === 'hour' ? '£' + provider.priceMin + '/hour' : '£' + provider.priceMin + '/' + provider.priceUnit} fits within your budget`)
    } else if (monthlyPrice <= userMaxBudget * 1.3) {
      // Slightly over - be honest
      reasons.push(`pricing starts at £${provider.priceMin}/${provider.priceUnit} - slightly above your budget but worth considering`)
    }
    // If way over budget, don't mention budget at all - focus on other reasons
  }
  
  // Cuisine reasoning
  if (cuisines.length > 0 && provider.cuisineStrength.some((c: string) => cuisines.includes(c))) {
    const matchedCuisines = cuisines.filter((c: string) => provider.cuisineStrength.includes(c))
    reasons.push(`their kitchens are well-suited for ${matchedCuisines.join(' and ')} - the equipment and setup match your needs`)
  }
  
  // Scale reasoning
  if (dailyOutput) {
    if (dailyOutput.includes('Under 20') || dailyOutput.includes('20-50')) {
      if (provider.type === 'shared_kitchen') {
        reasons.push(`at ${dailyOutput} orders/day, hourly rental is more cost-effective than a dedicated space`)
      }
    } else if (dailyOutput.includes('100') || dailyOutput.includes('200') || dailyOutput.includes('500')) {
      if (provider.type === 'dark_kitchen') {
        reasons.push(`with ${dailyOutput} orders/day, you need dedicated space - shared kitchens would limit your capacity`)
      }
    }
  }
  
  // Expansion reasoning
  if (expansionPlans.includes('significant growth')) {
    reasons.push(`they can accommodate your growth plans with larger units or additional locations`)
  }
  
  // Build the explanation
  const mainReason = reasons.slice(0, 3).join(', ')
  return `We matched you with ${provider.name} because they ${mainReason}.`
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
      benefits.push(`Perfect for delivery-only operations - no need to pay for customer-facing space`)
    }
    if (businessType === 'home') {
      benefits.push(`Scale up from home cooking with a professional, licensed kitchen`)
    }
    if (userScale.includes('100') || userScale.includes('200') || userScale.includes('500')) {
      benefits.push(`Built for high-volume output - handles ${userScale} orders/day comfortably`)
    }
    if (provider.features.some(f => f.toLowerCase().includes('delivery'))) {
      benefits.push(`Integrated delivery platform partnerships can boost your order volume`)
    }
    if (expansionPlans.includes('growth')) {
      benefits.push(`Easy to scale - add more shifts or move to larger unit as you grow`)
    }
    benefits.push(`All equipment included - no upfront equipment investment needed`)
    benefits.push(`Fully licensed and compliant - no planning permission headaches`)
  }
  
  // Shared Kitchen benefits
  if (provider.type === 'shared_kitchen') {
    if (businessType === 'starting' || businessType === 'home' || businessType === 'popup') {
      benefits.push(`Low-commitment entry - test your concept without long-term lease`)
    }
    if (userBudget.includes('Under') || userBudget.includes('500')) {
      benefits.push(`Pay only for hours you use - ideal for your budget`)
    }
    if (businessType === 'catering') {
      benefits.push(`Perfect for catering - book kitchen time around your event schedule`)
    }
    if (cuisines.includes('Desserts & Bakery')) {
      benefits.push(`Production-ready for baking - commercial ovens and prep space available`)
    }
    benefits.push(`No long-term commitment - scale up or down as needed`)
    if (provider.features.some(f => f.toLowerCase().includes('support') || f.toLowerCase().includes('training'))) {
      benefits.push(`Business support included - helpful when you're starting out`)
    }
  }
  
  // Mobile Unit benefits
  if (provider.type === 'mobile_supplier') {
    if (businessType === 'mobile' || businessType === 'popup') {
      benefits.push(`Own your unit outright - no ongoing rent payments`)
    }
    benefits.push(`Take your business anywhere - festivals, markets, events, pitches`)
    benefits.push(`Lower overheads than fixed premises - no rates, lower utilities`)
    if (cuisines.some((c: string) => ['Burgers', 'Fish & Chips', 'Chicken & Chips', 'Coffee & Cafe'].includes(c))) {
      benefits.push(`Ideal setup for ${cuisines[0]} - high-demand street food category`)
    }
    if (expansionPlans.includes('growth')) {
      benefits.push(`Build your brand and customer base before committing to fixed premises`)
    }
    benefits.push(`Flexibility to test different locations and find your best spots`)
  }
  
  // Marketplace benefits
  if (provider.type === 'marketplace') {
    benefits.push(`Compare multiple options in ${location} - find the best fit for your needs`)
    benefits.push(`Direct contact with kitchen owners - negotiate terms that work for you`)
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
      benefits.push(`Capacity for high-volume production - ${userScale} units/day`)
    }
    benefits.push(`Professional-grade equipment for consistent quality`)
    if (provider.features.some(f => f.toLowerCase().includes('storage') || f.toLowerCase().includes('cold'))) {
      benefits.push(`Cold storage included - essential for your production workflow`)
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
      'Indian': 'Indian cuisine remains highly competitive in London - consider a niche (e.g., South Indian, street food) to stand out.',
      'Burgers': 'Burger market is saturated in central London, but demand is growing in outer zones (E17, SE15, N17).',
      'Chicken & Chips': 'Chicken shops remain high-demand, especially in residential areas. Consider dark kitchen for lower overheads.',
      'Pizza': 'Artisan pizza is trending upward in London, especially sourdough and Neapolitan styles.',
      'Desserts & Bakery': 'Dessert delivery has doubled since 2023. Strong opportunity for specialist bakeries.',
      'default': 'London has high demand but intense competition. Differentiation is key to standing out.'
    },
    'manchester': {
      'Burgers': 'Manchester burger scene is booming, especially in Northern Quarter and Ancoats areas.',
      'Indian': 'Curry Mile competition is fierce - dark kitchens in South Manchester offer better margins.',
      'default': 'Manchester food scene is growing fast. Good time to enter with the right concept.'
    },
    'birmingham': {
      'Indian': 'Birmingham has the UK largest South Asian community - authentic cuisines do well here.',
      'Caribbean': 'Growing Caribbean food scene in Birmingham, especially in Handsworth and city centre.',
      'default': 'Birmingham food delivery market is expanding rapidly with lower competition than London.'
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
        reason: 'On a tighter budget? A shared kitchen lets you pay by the hour while you build up orders - lower risk while testing your concept.'
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
        reason: 'At your volume, a dedicated dark kitchen could actually be more cost-effective than hourly rates - and gives you 24/7 access.'
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

// #8 - Generate match confidence with detailed breakdown
function generateMatchConfidence(score: number, maxScore: number, rank: number): { 
  level: 'excellent' | 'strong' | 'good' | 'fair'; 
  percentage: number;
  breakdown: string;
  badge?: string;
} {
  const percentage = Math.round((score / maxScore) * 100)
  
  if (percentage >= 70 && rank === 0) {
    return {
      level: 'excellent',
      percentage,
      breakdown: 'Location, budget, business type, and equipment all align well',
      badge: '🏆 Top Match'
    }
  } else if (percentage >= 55) {
    return {
      level: 'strong',
      percentage,
      breakdown: 'Strong match on key criteria with minor trade-offs',
      badge: rank < 2 ? '✅ Recommended' : undefined
    }
  } else if (percentage >= 40) {
    return {
      level: 'good',
      percentage,
      breakdown: 'Good option worth exploring — check specific features',
    }
  } else {
    return {
      level: 'fair',
      percentage,
      breakdown: 'Partial match — may require compromise on some requirements',
    }
  }
}

// #9 - Generate negotiation tips based on provider and user situation
function generateNegotiationTips(provider: any, formData: any): string[] {
  const tips: string[] = []
  const budget = formData.budget || ''
  const businessStatus = formData.businessStatus || ''
  
  // Budget-based tips
  if (budget.includes('Under') || budget.includes('500') || budget.includes('1000')) {
    tips.push('Ask about introductory rates for new businesses')
    tips.push('Enquire about off-peak hours discounts')
  }
  
  // Provider type tips
  if (provider.type === 'dark_kitchen') {
    tips.push('Ask if equipment is included or extra')
    tips.push('Negotiate utilities inclusion in the rent')
    tips.push('Request a rent-free setup period (typically 1-2 weeks)')
    if (provider.priceMin > 2000) {
      tips.push('Multi-month commitments often unlock 10-15% discounts')
    }
  }
  
  if (provider.type === 'shared_kitchen') {
    tips.push('Ask about block booking discounts (10+ hours/week)')
    tips.push('Enquire about storage lockers to avoid transport costs')
    tips.push('Check if overnight refrigeration is included')
  }
  
  if (provider.type === 'mobile_supplier') {
    tips.push('Get a full spec breakdown before comparing quotes')
    tips.push('Ask about finance/lease-to-own options')
    tips.push('Request references from previous customers')
    tips.push('Negotiate a warranty extension')
  }
  
  // New business tips
  if (businessStatus === 'planning') {
    tips.push('Mention you\'re starting out — many providers offer startup packages')
  }
  
  // Location tips
  if (formData.location?.toLowerCase().includes('london')) {
    tips.push('Competition is high in London — providers may negotiate to fill capacity')
  }
  
  return tips.slice(0, 4)
}

// #10 - Generate risk flags / warnings
function generateRiskFlags(provider: any, formData: any): string[] {
  const flags: string[] = []
  const dailyOutput = formData.dailyOutput || ''
  const budget = formData.budget || ''
  
  // Budget risk - more comprehensive check
  const budgetMaxMap: Record<string, number> = {
    'Under £500/month': 500,
    '£500 - £1,000/month': 1000,
    '£1,000 - £2,000/month': 2000,
    '£2,000 - £5,000/month': 5000,
    '£5,000+/month': 15000
  }
  const userMaxBudget = budgetMaxMap[budget] || 3000
  
  // Calculate provider's effective monthly cost
  let providerMonthly = provider.priceMin
  if (provider.priceUnit === 'hour') providerMonthly = provider.priceMin * 80
  if (provider.priceUnit === 'day') providerMonthly = provider.priceMin * 20
  if (provider.priceUnit === 'week') providerMonthly = provider.priceMin * 4
  
  if (provider.priceUnit !== 'one_time' && providerMonthly > userMaxBudget) {
    const overBy = Math.round(((providerMonthly - userMaxBudget) / userMaxBudget) * 100)
    flags.push(`⚠️ Starts at £${providerMonthly}/mo — ${overBy}% above your budget`)
  }
  
  // Scale mismatch
  if (provider.bestForScale?.includes('large') && !provider.bestForScale?.includes('small')) {
    if (dailyOutput.includes('Under') || dailyOutput.includes('50')) {
      flags.push('⚠️ Designed for high-volume operations — may be overkill for your scale')
    }
  }
  
  // Premium pricing warning
  if (provider.priceMin > 5000) {
    flags.push('💰 Premium pricing — ensure ROI works for your business model')
  }
  
  // Limited availability
  if (provider.cities?.length === 1) {
    flags.push('📍 Single location only — limited expansion options')
  }
  
  // Mobile-specific risks
  if (provider.type === 'mobile_supplier') {
    if (provider.priceMin > 40000) {
      flags.push('💰 Significant investment — consider leasing options')
    }
    flags.push('📋 Check local licensing requirements before ordering')
  }
  
  return flags.slice(0, 3)
}

// #11 - Generate timing advice
function generateTimingAdvice(formData: any): string | null {
  const month = new Date().getMonth()
  const businessStatus = formData.businessStatus
  
  // Seasonal advice
  if (month >= 0 && month <= 2) { // Jan-Mar
    return '📅 Q1 is typically slower for kitchen providers — good time to negotiate better rates'
  }
  if (month >= 3 && month <= 5) { // Apr-Jun
    return '📅 Summer prep season — kitchens filling up. Book viewings soon if launching for summer'
  }
  if (month >= 6 && month <= 8) { // Jul-Sep
    return '📅 Peak season demand — expect less flexibility on terms. Consider autumn start for better deals'
  }
  if (month >= 9 && month <= 11) { // Oct-Dec
    return '📅 Holiday season rush then January dip — negotiate now for January start dates'
  }
  
  return null
}

// #12 - Generate cost saving tip
function generateCostSavingTip(formData: any, topProvider: any): string | null {
  if (!topProvider) return null
  
  const budget = formData.budget || ''
  const providerType = topProvider.type
  
  if (providerType === 'dark_kitchen') {
    if (topProvider.priceMin > 3000) {
      return '💡 Tip: Ask about shared prep areas — can reduce rent by 15-20% vs private kitchen'
    }
    return '💡 Tip: Negotiate utilities inclusion — can save £200-400/month in hidden costs'
  }
  
  if (providerType === 'shared_kitchen') {
    return '💡 Tip: Block-book 20+ hours/week for best hourly rates. Most kitchens offer 10-20% off'
  }
  
  if (providerType === 'mobile_supplier') {
    return '💡 Tip: Finance over 3-5 years keeps monthly costs manageable. Compare lease vs buy'
  }
  
  if (budget.includes('Under') || budget.includes('500')) {
    return '💡 Tip: Church halls and school kitchens often rent for £15-20/hr — ask ShareDining or ShareThere'
  }
  
  return null
}

// #13 - Generate similar users insight
function generateSimilarUsersInsight(formData: any, topProvider: any): string | null {
  const cuisines = formData.cuisines || []
  const businessType = formData.businessStatus === 'operating' 
    ? formData.currentUnit 
    : formData.plannedBusiness
  
  const insights: Record<string, string> = {
    'delivery_only': '73% of delivery-only businesses in our data chose dark kitchens over shared spaces',
    'mobile': '68% of mobile vendors test their concept in shared kitchens first',
    'catering': 'Caterers typically need 15-25 hours/week of kitchen access',
    'home': '82% of home bakers scaling up start with hourly shared kitchen access',
    'starting': 'New businesses average 3 months in shared kitchens before upgrading to dedicated space',
    'production': 'Food producers typically need dedicated cold storage — verify before signing'
  }
  
  return insights[businessType] || null
}

// #8 - Generate growth path recommendation - MUST match topResultType
function generateGrowthPath(formData: any, topResultType: string): { current: string; next: string; trigger: string } | null {
  const dailyOutput = formData.dailyOutput || ''
  
  // Mobile → Fixed premises path (check FIRST based on topResultType)
  if (topResultType === 'mobile_supplier') {
    return {
      current: 'Mobile Unit',
      next: 'Fixed Premises or Dark Kitchen',
      trigger: 'Once you\'ve built a loyal following and consistent revenue, consider a permanent base'
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
  if (topResultType === 'dark_kitchen') {
    if (dailyOutput.includes('200') || dailyOutput.includes('500')) {
      return {
        current: 'Single Dark Kitchen',
        next: 'Multi-site Operation',
        trigger: 'Consider a second location when maxing out capacity or to cover new delivery zones'
      }
    }
    return {
      current: 'Dark Kitchen',
      next: 'Multi-Location or Own Premises',
      trigger: 'When you\'re ready to expand your delivery zones or build a flagship location'
    }
  }
  
  // Production Kitchen path
  if (topResultType === 'production_kitchen') {
    return {
      current: 'Production Kitchen',
      next: 'Larger Facility or Multiple Units',
      trigger: 'When capacity is maxed or you need regional distribution hubs'
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
        space_type: formData.spaceType,
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
    
    // Calculate match percentage and generate personalized content
    const maxPossibleScore = 215 // Sum of all max scores
    const providersWithPercentage = scoredProviders.map((p, index) => {
      const matchPercent = Math.round((p.score / maxPossibleScore) * 100)
      return {
        ...p,
        matchPercent,
        matchConfidence: generateMatchConfidence(p.score, maxPossibleScore, index),
        benefits: generateBenefits(p, formData),
        whyThisMatch: generateWhyThisMatch(p, formData),
        negotiationTips: generateNegotiationTips(p, formData),
        riskFlags: generateRiskFlags(p, formData)
      }
    })
    
    // Generate recommendation text with OpenAI
    let recommendation = ''
    try {
      const businessType = formData.businessStatus === 'operating' ? formData.currentUnit : formData.plannedBusiness
      const topProvider = providersWithPercentage[0]
      
      if (!topProvider) {
        recommendation = `We couldn't find providers matching all your criteria in ${formData.location}. Try broadening your search or contact us for personalised recommendations.`
      } else {
        // Calculate if provider actually fits budget
        const budgetMaxMap: Record<string, number> = {
          'Under £500/month': 500,
          '£500 - £1,000/month': 1000,
          '£1,000 - £2,000/month': 2000,
          '£2,000 - £5,000/month': 5000,
          '£5,000+/month': 15000
        }
        const userMaxBudget = budgetMaxMap[formData.budget] || 3000
        const providerMin = topProvider.priceMin
        const budgetFits = providerMin <= userMaxBudget
        const budgetWarning = !budgetFits ? `IMPORTANT: The provider's minimum price (£${providerMin}/month) EXCEEDS the user's budget (${formData.budget}). Do NOT claim it fits their budget. Instead, acknowledge it may be a stretch or mention they should confirm pricing.` : ''
        
        const prompt = `You are a commercial kitchen expert. Based on these user needs, write 2-3 sentences recommending the best kitchen solution. Be specific and helpful. Do not mention AI. Be direct and practical.

${budgetWarning}

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
Provider pricing: From £${topProvider.priceMin}/${topProvider.priceUnit}
Provider locations: ${topProvider.cities.join(', ')}
Second option: ${providersWithPercentage[1]?.name || 'N/A'}

Write a personalized recommendation explaining why the top match suits their specific needs. Mention one specific feature that makes it ideal for their situation. 

IMPORTANT RULES:
1. Be accurate about pricing - do not claim something fits the budget if the numbers don't work
2. Do NOT say the provider is "located in" a specific city unless they actually have a location there - check "Provider locations" field
3. If provider is "Nationwide", say they "operate nationwide" or "can serve your area" - do NOT claim they have a facility in the user's specific location`

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
    const topProvider = providersWithPercentage[0]
    const matchFactors = generateMatchFactors(formData)
    const demandInsight = generateDemandInsight(formData)
    const alsoConsider = generateAlsoConsider(formData, topResultType)
    const growthPath = generateGrowthPath(formData, topResultType)
    const similarUsersInsight = generateSimilarUsersInsight(formData, topProvider)
    
    // Generate comparison data for top 3
    const comparison = providersWithPercentage.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      price: `${p.priceUnit === 'month' ? '£' + p.priceMin + '-' + p.priceMax + '/mo' : 
              p.priceUnit === 'hour' ? '£' + p.priceMin + '-' + p.priceMax + '/hr' :
              '£' + p.priceMin.toLocaleString() + '-' + p.priceMax.toLocaleString()}`,
      confidence: p.matchConfidence,
      topBenefit: p.benefits?.[0] || '',
      topRisk: p.riskFlags?.[0] || ''
    }))
    
    // Build full response with enhanced AI insights
    const fullMatchData = {
      results: providersWithPercentage,
      recommendation,
      matchFactors,
      demandInsight,
      alsoConsider,
      growthPath,
      similarUsersInsight,
      comparison,
      aiInsights: {
        marketContext: demandInsight,
        similarUsers: similarUsersInsight,
        bestTimeToAct: generateTimingAdvice(formData),
        costSavingTip: generateCostSavingTip(formData, topProvider)
      },
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

