'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Star, MapPin, Check, RefreshCw, Mail, TrendingUp, Lightbulb, ArrowRight, Download, X } from 'lucide-react'

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
  benefits?: string[]
}

interface MatchData {
  results: Provider[]
  recommendation: string
  matchFactors?: string[]
  demandInsight?: string
  alsoConsider?: { type: string; reason: string }
  growthPath?: { current: string; next: string; trigger: string }
  userProfile?: {
    location: string
    businessType: string
    budget: string
    scale: string
    cuisines: string[]
  }
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const matchId = searchParams.get('id')
  
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    const storedResults = sessionStorage.getItem('matchResults')
    const storedRec = sessionStorage.getItem('matchRecommendation')
    const storedMatchData = sessionStorage.getItem('matchData')
    
    if (storedMatchData) {
      setMatchData(JSON.parse(storedMatchData))
      setLoading(false)
    } else if (storedResults) {
      setMatchData({
        results: JSON.parse(storedResults),
        recommendation: storedRec || ''
      })
      setLoading(false)
    } else {
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
      'marketplace': 'Marketplace',
      'production_kitchen': 'Production Kitchen'
    }
    return labels[type] || type
  }

  const handleEmailResults = async () => {
    if (!email) return
    setSendingEmail(true)
    
    // TODO: Connect to email API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setEmailSent(true)
    setSendingEmail(false)
    
    // Store email for follow-up
    if (matchId) {
      fetch('/api/match/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, email })
      }).catch(console.error)
    }
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

  const results = matchData?.results || []
  const recommendation = matchData?.recommendation || ''

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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            We found {results.length} matches for you
          </h1>
          <p className="text-gray-500">Based on your requirements</p>
        </div>

        {/* #12 - Match Factors (What influenced your results) */}
        {matchData?.matchFactors && matchData.matchFactors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <p className="text-xs font-medium text-gray-500 mb-2">Your match was based on:</p>
            <div className="flex flex-wrap gap-2">
              {matchData.matchFactors.map((factor, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* #3 - Location Demand Insight */}
        {matchData?.demandInsight && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Market Insight</p>
                <p className="text-sm text-amber-700">{matchData.demandInsight}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation Box */}
        {recommendation && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
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

        {/* #8 - Growth Path Recommendation */}
        {matchData?.growthPath && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 mb-1">Your Growth Path</p>
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <span className="font-medium">{matchData.growthPath.current}</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">{matchData.growthPath.next}</span>
                </div>
                <p className="text-xs text-emerald-600 mt-1">{matchData.growthPath.trigger}</p>
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

                {/* Personalized Benefits */}
                {provider.benefits && provider.benefits.length > 0 && (
                  <div className="mb-4 p-3 bg-emerald-50 rounded-xl">
                    <p className="text-xs font-semibold text-emerald-700 mb-2">Why this suits you:</p>
                    <ul className="space-y-1.5">
                      {provider.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.features.slice(0, 4).map((feature, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
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

        {/* #7 - Also Consider Section */}
        {matchData?.alsoConsider && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Also Consider</p>
                <p className="text-sm text-gray-600">{matchData.alsoConsider.reason}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* #11 - Email My Results */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Save Your Results</h3>
              <p className="text-sm text-gray-500 mb-4">Get a summary emailed to you with all recommendations and next steps.</p>
              
              {!emailSent ? (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleEmailResults}
                    disabled={!email || sendingEmail}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl font-medium text-sm transition-colors"
                  >
                    {sendingEmail ? 'Sending...' : 'Send'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Results sent to {email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* #6 - Questions to Ask Checklist */}
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <Link 
            href="/kitchen-checklist"
            className="flex items-center gap-3 text-gray-700 hover:text-emerald-600 transition-colors"
          >
            <Download className="w-5 h-5" />
            <div>
              <p className="font-medium text-sm">Download: Questions to Ask Checklist</p>
              <p className="text-xs text-gray-500">Essential questions before signing any kitchen agreement</p>
            </div>
          </Link>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 space-y-3">
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
