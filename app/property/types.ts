export interface Property {
  id: string
  title: string
  location: string
  description: string
  currentValuation: number
  potentialValuation: number
  renovationCost: number
  bedrooms: number
  sqft: number
  status: 'available' | 'under_offer' | 'sold'
  imageUrl: string
  tags: string[]
  completionMonths: number
}
