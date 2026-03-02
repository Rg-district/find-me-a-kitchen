import { NextRequest, NextResponse } from 'next/server'
import { kitchens, Kitchen } from '@/lib/kitchens'

export type UserRequirements = {
  businessType: string
  teamSize: number
  city: string
  budget: number
  budgetType: 'hourly' | 'monthly'
  equipment: string[]
  foodTypes: string[]
  operatingHours: string[]
  storage: string[]
  deliveryPlatforms: string[]
  minHours?: number
  allergenFree?: boolean
  halal?: boolean
  organic?: boolean
  vegan?: boolean
}

export type MatchResult = {
  kitchen: Kitchen
  score: number
  matchReasons: string[]
  gaps: string[]
  compatibilityPct: number
}

function scoreKitchen(kitchen: Kitchen, req: UserRequirements): MatchResult {
  let score = 0
  const matchReasons: string[] = []
  const gaps: string[] = []

  // City match (hard filter — must match)
  const cityMatch = kitchen.city.toLowerCase() === req.city.toLowerCase()
  if (!cityMatch) return { kitchen, score: -1, matchReasons: [], gaps: ['Wrong city'], compatibilityPct: 0 }

  // Budget check
  if (req.budgetType === 'hourly' && kitchen.pricePerHour > 0) {
    if (kitchen.pricePerHour <= req.budget) {
      score += 25
      matchReasons.push(`Within hourly budget (£${kitchen.pricePerHour}/hr)`)
    } else {
      score -= 15
      gaps.push(`Over hourly budget (£${kitchen.pricePerHour}/hr vs your £${req.budget}/hr)`)
    }
  } else if (req.budgetType === 'monthly' && kitchen.pricePerMonth) {
    if (kitchen.pricePerMonth <= req.budget) {
      score += 25
      matchReasons.push(`Within monthly budget (£${kitchen.pricePerMonth.toLocaleString()}/mo)`)
    } else {
      score -= 15
      gaps.push(`Over monthly budget (£${kitchen.pricePerMonth.toLocaleString()}/mo vs your £${req.budget.toLocaleString()}/mo)`)
    }
  }

  // Team size
  if (kitchen.maxCapacity >= req.teamSize) {
    score += 15
    matchReasons.push(`Fits your team size (up to ${kitchen.maxCapacity})`)
  } else {
    score -= 20
    gaps.push(`Capacity too small (max ${kitchen.maxCapacity}, you need ${req.teamSize})`)
  }

  // Equipment overlap
  const equipmentMatches = req.equipment.filter(e =>
    kitchen.equipment.some(ke => ke.toLowerCase().includes(e.toLowerCase()))
  )
  if (equipmentMatches.length > 0) {
    score += equipmentMatches.length * 5
    matchReasons.push(`Has ${equipmentMatches.length}/${req.equipment.length} required equipment items`)
  }
  const missingEquipment = req.equipment.filter(e =>
    !kitchen.equipment.some(ke => ke.toLowerCase().includes(e.toLowerCase()))
  )
  if (missingEquipment.length > 0) {
    gaps.push(`Missing equipment: ${missingEquipment.slice(0, 3).join(', ')}`)
  }

  // Storage
  const storageMatches = req.storage.filter(s => kitchen.storage.includes(s as any))
  if (storageMatches.length === req.storage.length && req.storage.length > 0) {
    score += 10
    matchReasons.push('Has all required storage types')
  } else if (storageMatches.length > 0) {
    score += 5
    const missingStorage = req.storage.filter(s => !kitchen.storage.includes(s as any))
    if (missingStorage.length > 0) gaps.push(`Missing storage: ${missingStorage.join(', ')}`)
  }

  // Operating hours / shifts
  const shiftMap: Record<string, string> = {
    'morning': 'morning', 'afternoon': 'afternoon', 'evening': 'evening', 'overnight': 'overnight', '24/7': '24hr'
  }
  const shiftMatches = req.operatingHours.filter(s => kitchen.availableShifts.includes(shiftMap[s] as any || s as any))
  if (shiftMatches.length === req.operatingHours.length && req.operatingHours.length > 0) {
    score += 10
    matchReasons.push('Available during your required hours')
  }

  // Delivery platforms
  const platformMatches = req.deliveryPlatforms.filter(p => kitchen.deliveryPlatforms.includes(p as any))
  if (platformMatches.length > 0) {
    score += platformMatches.length * 3
    matchReasons.push(`Supports ${platformMatches.join(', ')}`)
  }

  // Special certs
  if (req.halal && kitchen.certifications.some(c => c.toLowerCase().includes('halal'))) {
    score += 20; matchReasons.push('Halal certified ✓')
  } else if (req.halal) {
    score -= 30; gaps.push('Not Halal certified')
  }

  if (req.organic && kitchen.certifications.some(c => c.toLowerCase().includes('organic'))) {
    score += 15; matchReasons.push('Organic certified ✓')
  } else if (req.organic) {
    gaps.push('Not organic certified')
  }

  if (req.vegan && (kitchen.certifications.some(c => c.toLowerCase().includes('vegan')) ||
    kitchen.foodTypes.some(f => f.toLowerCase().includes('vegan')))) {
    score += 10; matchReasons.push('Vegan-friendly ✓')
  }

  // Rating bonus
  score += kitchen.rating * 2
  if (kitchen.rating >= 4.8) matchReasons.push(`Highly rated (${kitchen.rating}★)`)

  // Verified bonus
  if (kitchen.verified) score += 5

  const maxPossibleScore = 100
  const compatibilityPct = Math.min(Math.max(Math.round((score / maxPossibleScore) * 100), 5), 99)

  return { kitchen, score, matchReasons, gaps, compatibilityPct }
}

export async function POST(req: NextRequest) {
  try {
    const requirements: UserRequirements = await req.json()

    const results = kitchens
      .map(k => scoreKitchen(k, requirements))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return NextResponse.json({ results, total: results.length })
  } catch {
    return NextResponse.json({ error: 'Matching failed' }, { status: 500 })
  }
}
