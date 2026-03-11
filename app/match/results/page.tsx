'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Star, MapPin, Check, RefreshCw } from 'lucide-react'

interface Provider {
  id: string
  name: string
  type: string
  cities: string[]
  priceMin: number
  priceMax: number
  priceUnit: string
  features: string[]
  website: string
  description: string
  score: number
  matchPercent?: number
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const matchId = searchParams.get('id')
  
  const [results, setResults] = useState<Provider[]>([])
  const [recommendation, setRecommendation] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now, get results from session storage (set before redirect)
    const storedResults = sessionStorage.getItem('matchResults')
    const storedRec = sessionStorage.getItem('matchRecommendation')
    
    if (storedResults) {
      setResults(JSON.parse(storedResults))
      setRecommendation(storedRec || '')
      setLoading(false)
    } else {
      // Fallback: fetch from API if we have matchId
      setLoading(false)
    }
  }, [matchId])

  const formatPrice = (provider: Provider) => {
    const { priceMin, priceMax, priceUnit } = provider
    if (priceUnit === 'one_time') {
      return `£${priceMin.toLocaleString()} - £${priceMax.toLocaleString()}`
    }
    return `From £${priceMin}/${priceUnit}`
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'dark_kitchen': 'Dark Kitchen',
      'shared_kitchen': 'Shared Kitchen',
      'mobile_supplier': 'Mobile Unit Supplier',
      'marketplace': 'Marketplace'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Finding your perfect kitchen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link href="/match" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold ml-2">Your Recommendations</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            We found {results.length} matches for you
          </h1>
          <p className="text-gray-500">Based on your requirements</p>
        </div>

        {/* Recommendation Box */}
        {recommendation && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 mb-2">Our Recommendation</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{recommendation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-4">
          {results.map((provider, index) => (
            <div
              key={provider.id}
              className={`bg-white rounded-2xl border ${
                index === 0 ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200'
              } overflow-hidden`}
            >
              {index === 0 && (
                <div className="bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 text-center">
                  🏆 BEST MATCH
                </div>
              )}
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-500">{getTypeLabel(provider.type)}</p>
                  </div>
                  <div className="text-right">
                    {provider.matchPercent && (
                      <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full mb-1">
                        {provider.matchPercent}% match
                      </div>
                    )}
                    <div className="font-bold text-gray-900">{formatPrice(provider)}</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{provider.description}</p>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{provider.cities.slice(0, 3).join(', ')}{provider.cities.length > 3 ? ` +${provider.cities.length - 3} more` : ''}</span>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.features.slice(0, 4).map((feature, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      <Check className="w-3 h-3 text-emerald-500" />
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-center transition-colors flex items-center justify-center gap-2"
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No matches found for your criteria.</p>
            <Link
              href="/match"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 space-y-3">
          <Link
            href="/match"
            className="block w-full py-4 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 text-center hover:bg-gray-50 transition-colors"
          >
            Start Over
          </Link>
          
          <Link
            href="/contact"
            className="block w-full py-4 rounded-xl border-2 border-emerald-500 font-semibold text-emerald-600 text-center hover:bg-emerald-50 transition-colors"
          >
            Need Help? Contact Us
          </Link>
        </div>

        {/* Feedback */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Was this helpful?{' '}
            <button className="text-emerald-600 font-medium hover:underline">Yes</button>
            {' / '}
            <button className="text-emerald-600 font-medium hover:underline">No</button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
