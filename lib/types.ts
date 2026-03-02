import type { Kitchen } from './kitchens'

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
