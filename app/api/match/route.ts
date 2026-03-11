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

// Provider database (will move to Supabase)
const PROVIDERS = [
  {
    id: 'karma-kitchen',
    name: 'Karma Kitchen',
    type: 'dark_kitchen',
    cities: ['London', 'Manchester', 'Birmingham'],
    priceMin: 800,
    priceMax: 2500,
    priceUnit: 'week',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range', 'Extraction / Ventilation'],
    features: ['24hr access', 'Flexible terms', 'Delivery partnerships'],
    bestFor: ['delivery_only', 'growing'],
    website: 'https://karmakitchen.co',
    description: 'Flexible dark kitchen rental with sustainable practices'
  },
  {
    id: 'mission-kitchen',
    name: 'Mission Kitchen',
    type: 'shared_kitchen',
    cities: ['London'],
    priceMin: 15,
    priceMax: 50,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Gas hobs / Range', 'Prep tables', 'Storage shelving'],
    features: ['Social enterprise', 'Business support', 'Memberships available'],
    bestFor: ['starting', 'testing', 'small_batch'],
    website: 'https://missionkitchen.org',
    description: 'Social enterprise supporting food entrepreneurs'
  },
  {
    id: 'deliveroo-editions',
    name: 'Deliveroo Editions',
    type: 'dark_kitchen',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol'],
    priceMin: 1200,
    priceMax: 3500,
    priceUnit: 'week',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range', 'Extraction / Ventilation'],
    features: ['Deliveroo partnership', 'High footfall areas', 'Marketing support'],
    bestFor: ['scaling', 'high_volume'],
    website: 'https://deliveroo.co.uk',
    description: 'Delivery-only kitchens with Deliveroo integration'
  },
  {
    id: 'foodstars',
    name: 'FoodStars (CloudKitchens)',
    type: 'dark_kitchen',
    cities: ['London'],
    priceMin: 1000,
    priceMax: 3000,
    priceUnit: 'month',
    equipment: ['Deep fat fryers', 'Commercial oven', 'Gas hobs / Range'],
    features: ['100+ locations', 'All equipment included'],
    bestFor: ['delivery_only', 'virtual_brands'],
    website: 'https://foodstars.co.uk',
    description: 'Large-scale dark kitchen network across London'
  },
  {
    id: 'amobox',
    name: 'Amobox',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 25000,
    priceMax: 80000,
    priceUnit: 'one_time',
    equipment: ['Custom built to spec'],
    features: ['Premium design', 'Bespoke builds', '8-16 week lead time'],
    bestFor: ['mobile', 'premium'],
    website: 'https://amobox.com',
    description: 'Premium mobile kitchen and van conversions'
  },
  {
    id: 'jiffy-trucks',
    name: 'Jiffy Trucks',
    type: 'mobile_supplier',
    cities: ['Nationwide'],
    priceMin: 15000,
    priceMax: 45000,
    priceUnit: 'one_time',
    equipment: ['Bain maries', 'Deep fat fryers', 'Griddles'],
    features: ['Hot & cold options', 'Snack trucks', 'Sandwich vans'],
    bestFor: ['mobile', 'snacks', 'sandwiches'],
    website: 'https://cateringtrucks.co.uk',
    description: 'Specialist hot and cold snack catering trucks'
  },
  {
    id: 'oya',
    name: 'Oya',
    type: 'marketplace',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Glasgow', 'Cardiff'],
    priceMin: 500,
    priceMax: 5000,
    priceUnit: 'month',
    equipment: ['Varies by listing'],
    features: ['Marketplace model', 'Multiple options', 'Direct contact'],
    bestFor: ['all'],
    website: 'https://oya.co.uk',
    description: 'UK marketplace for commercial kitchen rentals'
  },
  {
    id: 'ncass',
    name: 'NCASS Classifieds',
    type: 'marketplace',
    cities: ['Nationwide'],
    priceMin: 3000,
    priceMax: 30000,
    priceUnit: 'one_time',
    equipment: ['Varies'],
    features: ['Used equipment', 'Trailers', 'Vans', 'Industry trusted'],
    bestFor: ['mobile', 'budget'],
    website: 'https://ncass.org.uk/classified-adverts',
    description: 'Industry classifieds for used catering equipment and vehicles'
  },
  {
    id: 'sharethere',
    name: 'ShareThere',
    type: 'shared_kitchen',
    cities: ['London', 'Manchester', 'Birmingham'],
    priceMin: 15,
    priceMax: 100,
    priceUnit: 'hour',
    equipment: ['Commercial oven', 'Prep tables', 'Storage'],
    features: ['Flexible booking', 'Multiple locations'],
    bestFor: ['starting', 'flexible'],
    website: 'https://sharethere.co',
    description: 'Flexible commercial kitchen rentals by the hour'
  }
]

function scoreProvider(provider: typeof PROVIDERS[0], formData: any): number {
  let score = 0
  
  // Location match
  const locationLower = formData.location.toLowerCase()
  if (provider.cities.some(c => c.toLowerCase().includes(locationLower) || locationLower.includes(c.toLowerCase()))) {
    score += 30
  } else if (provider.cities.includes('Nationwide')) {
    score += 15
  }
  
  // Business type match
  const businessType = formData.businessStatus === 'operating' ? formData.currentUnit : formData.plannedBusiness
  if (businessType === 'delivery_only' && provider.type === 'dark_kitchen') score += 25
  if (businessType === 'mobile' && provider.type === 'mobile_supplier') score += 25
  if (businessType === 'cafe' && provider.type === 'shared_kitchen') score += 20
  if (businessType === 'production' && provider.type === 'dark_kitchen') score += 20
  if (businessType === 'home' && provider.type === 'shared_kitchen') score += 25 // upgrading from home
  
  // Equipment match
  const equipmentMatch = formData.equipment.filter((e: string) => 
    provider.equipment.some(pe => pe.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(pe.toLowerCase()))
  ).length
  score += equipmentMatch * 3
  
  // Budget match
  const budgetMap: Record<string, number> = {
    'Under £500/month': 500,
    '£500 - £1,000/month': 1000,
    '£1,000 - £2,000/month': 2000,
    '£2,000 - £5,000/month': 5000,
    '£5,000+/month': 10000,
    'Not sure / Flexible': 3000
  }
  const userBudget = budgetMap[formData.budget] || 2000
  
  // Normalize provider price to monthly
  let monthlyPrice = provider.priceMin
  if (provider.priceUnit === 'hour') monthlyPrice = provider.priceMin * 40 // assuming 40 hrs/month
  if (provider.priceUnit === 'week') monthlyPrice = provider.priceMin * 4
  
  if (provider.priceUnit !== 'one_time') {
    if (monthlyPrice <= userBudget) score += 20
    if (monthlyPrice <= userBudget * 0.7) score += 10 // good value
  }
  
  // Scale/output match
  const outputMap: Record<string, string> = {
    'Under 20': 'small',
    '20-50': 'small',
    '50-100': 'medium',
    '100-200': 'medium',
    '200-500': 'large',
    '500+': 'enterprise',
    'Not sure yet': 'small'
  }
  const scale = outputMap[formData.dailyOutput] || 'small'
  
  if (scale === 'large' || scale === 'enterprise') {
    if (provider.type === 'dark_kitchen') score += 15
    if (provider.id === 'deliveroo-editions') score += 10
  }
  if (scale === 'small' && provider.type === 'shared_kitchen') score += 15
  
  return score
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
    
    // Generate recommendation text with OpenAI
    let recommendation = ''
    try {
      const businessType = formData.businessStatus === 'operating' ? formData.currentUnit : formData.plannedBusiness
      const topProvider = scoredProviders[0]
      
      const prompt = `You are a commercial kitchen expert. Based on these user needs, write 2-3 sentences recommending the best kitchen solution. Be specific and helpful. Do not mention AI.

User profile:
- Business type: ${businessType}
- Cuisines: ${formData.cuisines.join(', ')}
- Equipment needed: ${formData.equipment.slice(0, 5).join(', ')}
- Staff: ${formData.staffCount}
- Daily output: ${formData.dailyOutput}
- Location: ${formData.location}
- Budget: ${formData.budget}
- Expansion plans: ${formData.expansionPlans}

Top match: ${topProvider?.name} (${topProvider?.type.replace('_', ' ')})

Write a personalized recommendation explaining why this is a good fit and what to consider.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7
      })
      
      recommendation = completion.choices[0]?.message?.content || ''
    } catch (e) {
      console.error('OpenAI error:', e)
      recommendation = `Based on your requirements for ${formData.cuisines[0] || 'your cuisine'} in ${formData.location}, we've found ${scoredProviders.length} matching options. The top match offers the right combination of equipment, location, and pricing for your needs.`
    }
    
    // Save results
    const matchId = matchData?.id || `temp_${Date.now()}`
    
    if (matchData?.id) {
      await supabase
        .from('fmak_matches')
        .update({
          results: scoredProviders,
          recommendation
        })
        .eq('id', matchData.id)
    }
    
    return NextResponse.json({
      success: true,
      matchId,
      results: scoredProviders,
      recommendation
    })
    
  } catch (error) {
    console.error('Match error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
