import { NextRequest, NextResponse } from 'next/server'

// FSA API base URL
const FSA_API = 'https://api.ratings.food.gov.uk'

// Cache for hygiene ratings (in-memory, resets on deploy)
const ratingCache: Record<string, { rating: number | string; date: string; cached: number }> = {}
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface FSAEstablishment {
  BusinessName: string
  RatingValue: string
  RatingDate: string
  AddressLine1: string
  AddressLine2: string
  AddressLine3: string
  AddressLine4: string
  PostCode: string
  LocalAuthorityName: string
  scores: {
    Hygiene: number
    Structural: number
    ConfidenceInManagement: number
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  const city = searchParams.get('city')
  
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
  
  const cacheKey = `${name.toLowerCase()}-${city?.toLowerCase() || ''}`
  
  // Check cache
  if (ratingCache[cacheKey] && Date.now() - ratingCache[cacheKey].cached < CACHE_TTL) {
    return NextResponse.json({
      rating: ratingCache[cacheKey].rating,
      lastInspected: ratingCache[cacheKey].date,
      cached: true
    })
  }
  
  try {
    // Search FSA API
    const searchUrl = new URL(`${FSA_API}/Establishments`)
    searchUrl.searchParams.set('name', name)
    if (city) {
      searchUrl.searchParams.set('address', city)
    }
    searchUrl.searchParams.set('pageSize', '5')
    
    const response = await fetch(searchUrl.toString(), {
      headers: {
        'x-api-version': '2',
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      return NextResponse.json({ rating: null, error: 'FSA API error' })
    }
    
    const data = await response.json()
    const establishments: FSAEstablishment[] = data.establishments || []
    
    if (establishments.length === 0) {
      return NextResponse.json({ rating: null, notFound: true })
    }
    
    // Find best match (first result usually best)
    const match = establishments[0]
    
    // Parse rating (can be "5", "4", "Pass", "Exempt", etc.)
    let rating: number | string = match.RatingValue
    if (!isNaN(parseInt(match.RatingValue))) {
      rating = parseInt(match.RatingValue)
    }
    
    // Format date
    const ratingDate = match.RatingDate 
      ? new Date(match.RatingDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      : null
    
    // Cache result
    ratingCache[cacheKey] = {
      rating,
      date: ratingDate || '',
      cached: Date.now()
    }
    
    return NextResponse.json({
      rating,
      lastInspected: ratingDate,
      businessName: match.BusinessName,
      address: [match.AddressLine1, match.AddressLine2, match.PostCode].filter(Boolean).join(', '),
      localAuthority: match.LocalAuthorityName,
      scores: match.scores
    })
    
  } catch (error) {
    console.error('FSA API error:', error)
    return NextResponse.json({ rating: null, error: 'Failed to fetch rating' })
  }
}

// Batch endpoint for multiple providers
export async function POST(req: NextRequest) {
  try {
    const { providers } = await req.json()
    
    if (!providers || !Array.isArray(providers)) {
      return NextResponse.json({ error: 'Providers array required' }, { status: 400 })
    }
    
    const results: Record<string, { rating: number | string | null; lastInspected: string | null }> = {}
    
    // Fetch ratings for each provider (with small delay to be nice to API)
    for (const provider of providers.slice(0, 10)) {
      const cacheKey = `${provider.name?.toLowerCase()}-${provider.city?.toLowerCase() || ''}`
      
      // Check cache first
      if (ratingCache[cacheKey] && Date.now() - ratingCache[cacheKey].cached < CACHE_TTL) {
        results[provider.id] = {
          rating: ratingCache[cacheKey].rating,
          lastInspected: ratingCache[cacheKey].date
        }
        continue
      }
      
      try {
        const searchUrl = new URL(`${FSA_API}/Establishments`)
        searchUrl.searchParams.set('name', provider.name)
        if (provider.city) {
          searchUrl.searchParams.set('address', provider.city)
        }
        searchUrl.searchParams.set('pageSize', '1')
        
        const response = await fetch(searchUrl.toString(), {
          headers: {
            'x-api-version': '2',
            'Accept': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const match = data.establishments?.[0]
          
          if (match) {
            let rating: number | string = match.RatingValue
            if (!isNaN(parseInt(match.RatingValue))) {
              rating = parseInt(match.RatingValue)
            }
            
            const ratingDate = match.RatingDate 
              ? new Date(match.RatingDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
              : null
            
            ratingCache[cacheKey] = { rating, date: ratingDate || '', cached: Date.now() }
            results[provider.id] = { rating, lastInspected: ratingDate }
          } else {
            results[provider.id] = { rating: null, lastInspected: null }
          }
        }
        
        // Small delay between requests
        await new Promise(r => setTimeout(r, 100))
        
      } catch (e) {
        results[provider.id] = { rating: null, lastInspected: null }
      }
    }
    
    return NextResponse.json({ ratings: results })
    
  } catch (error) {
    console.error('Batch hygiene fetch error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
