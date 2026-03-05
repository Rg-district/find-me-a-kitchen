import { NextRequest, NextResponse } from 'next/server'
import { Kitchen } from '@/lib/kitchens'
import { supabaseAdmin } from '@/lib/supabase'
import type { UserRequirements, MatchResult } from '@/lib/types'

function scoreKitchen(kitchen: Kitchen, req: UserRequirements): MatchResult {
  let score = 0
  const matchReasons: string[] = []
  const gaps: string[] = []

  const cityMatch = kitchen.city.toLowerCase() === req.city.toLowerCase()
  if (!cityMatch) return { kitchen, score: -1, matchReasons: [], gaps: ['Wrong city'], compatibilityPct: 0 }

  if (req.budgetType === 'hourly' && kitchen.pricePerHour > 0) {
    if (kitchen.pricePerHour <= req.budget) { score += 25; matchReasons.push(`Within hourly budget (£${kitchen.pricePerHour}/hr)`) }
    else { score -= 15; gaps.push(`Over hourly budget (£${kitchen.pricePerHour}/hr vs your £${req.budget}/hr)`) }
  } else if (req.budgetType === 'monthly' && kitchen.pricePerMonth) {
    if (kitchen.pricePerMonth <= req.budget) { score += 25; matchReasons.push(`Within monthly budget (£${kitchen.pricePerMonth.toLocaleString()}/mo)`) }
    else { score -= 15; gaps.push(`Over monthly budget (£${kitchen.pricePerMonth.toLocaleString()}/mo vs your £${req.budget.toLocaleString()}/mo)`) }
  }

  if (kitchen.maxCapacity >= req.teamSize) { score += 15; matchReasons.push(`Fits your team size (up to ${kitchen.maxCapacity})`) }
  else { score -= 20; gaps.push(`Capacity too small (max ${kitchen.maxCapacity}, you need ${req.teamSize})`) }

  const equipmentMatches = req.equipment.filter(e => kitchen.equipment.some(ke => ke.toLowerCase().includes(e.toLowerCase())))
  if (equipmentMatches.length > 0) { score += equipmentMatches.length * 5; matchReasons.push(`Has ${equipmentMatches.length}/${req.equipment.length} required equipment items`) }
  const missingEquipment = req.equipment.filter(e => !kitchen.equipment.some(ke => ke.toLowerCase().includes(e.toLowerCase())))
  if (missingEquipment.length > 0) gaps.push(`Missing equipment: ${missingEquipment.slice(0, 3).join(', ')}`)

  const storageMatches = req.storage.filter(s => kitchen.storage.includes(s as any))
  if (storageMatches.length === req.storage.length && req.storage.length > 0) { score += 10; matchReasons.push('Has all required storage types') }
  else if (storageMatches.length > 0) { score += 5 }

  const shiftMap: Record<string, string> = { 'morning': 'morning', 'afternoon': 'afternoon', 'evening': 'evening', 'overnight': 'overnight', '24/7': '24hr' }
  const shiftMatches = req.operatingHours.filter(s => kitchen.availableShifts.includes((shiftMap[s] || s) as any))
  if (shiftMatches.length === req.operatingHours.length && req.operatingHours.length > 0) { score += 10; matchReasons.push('Available during your required hours') }

  const platformMatches = req.deliveryPlatforms.filter(p => kitchen.deliveryPlatforms.includes(p as any))
  if (platformMatches.length > 0) { score += platformMatches.length * 3; matchReasons.push(`Supports ${platformMatches.join(', ')}`) }

  if (req.halal && kitchen.certifications.some(c => c.toLowerCase().includes('halal'))) { score += 20; matchReasons.push('Halal certified ✓') }
  else if (req.halal) { score -= 30; gaps.push('Not Halal certified') }

  if (req.organic && kitchen.certifications.some(c => c.toLowerCase().includes('organic'))) { score += 15; matchReasons.push('Organic certified ✓') }
  else if (req.organic) gaps.push('Not organic certified')

  if (req.vegan && (kitchen.certifications.some(c => c.toLowerCase().includes('vegan')) || kitchen.foodTypes.some(f => f.toLowerCase().includes('vegan')))) { score += 10; matchReasons.push('Vegan-friendly ✓') }

  score += kitchen.rating * 2
  if (kitchen.rating >= 4.8) matchReasons.push(`Highly rated (${kitchen.rating}★)`)
  if (kitchen.verified) score += 5

  const compatibilityPct = Math.min(Math.max(Math.round((score / 100) * 100), 5), 99)
  return { kitchen, score, matchReasons, gaps, compatibilityPct }
}

export async function POST(req: NextRequest) {
  try {
    const requirements: UserRequirements = await req.json()

    // Fetch active kitchens from Supabase, fall back to static data if unavailable
    let kitchenData: Kitchen[] = []
    try {
      const { data, error } = await supabaseAdmin
        .from('kitchens')
        .select('*')
        .eq('listing_active', true)
      if (!error && data && data.length > 0) {
        // Map snake_case DB fields back to camelCase Kitchen type
        kitchenData = data.map((k: Record<string, unknown>) => ({
          id: k.id as string,
          name: k.name as string,
          city: k.city as string,
          area: k.area as string,
          postcode: k.postcode as string,
          type: k.type as Kitchen['type'],
          pricePerHour: k.price_per_hour as number,
          pricePerMonth: k.price_per_month as number | null,
          minHours: k.min_hours as number,
          maxCapacity: k.max_capacity as number,
          equipment: k.equipment as string[],
          certifications: k.certifications as string[],
          operatingHours: k.operating_hours as string,
          availableShifts: k.available_shifts as Kitchen['availableShifts'],
          storage: k.storage as Kitchen['storage'],
          deliveryPlatforms: k.delivery_platforms as Kitchen['deliveryPlatforms'],
          foodTypes: k.food_types as string[],
          website: k.website as string,
          phone: k.phone as string,
          email: k.email as string,
          description: k.description as string,
          features: k.features as string[],
          rating: Number(k.rating),
          reviewCount: k.review_count as number,
          verified: k.verified as boolean,
        }))
      }
    } catch (dbErr) {
      console.error('DB fetch failed, falling back to static data:', dbErr)
    }

    // Fall back to static data if DB is empty or unavailable
    if (kitchenData.length === 0) {
      const { kitchens: staticKitchens } = await import('@/lib/kitchens')
      kitchenData = staticKitchens
    }

    const results = kitchenData.map(k => scoreKitchen(k, requirements)).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)
    return NextResponse.json({ results, total: results.length })
  } catch {
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 })
  }
}
