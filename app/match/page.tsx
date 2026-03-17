'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, MapPin, ChefHat, Users, TrendingUp, PoundSterling, Utensils } from 'lucide-react'

// Types
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
type BusinessStatus = 'operating' | 'starting' | null
type CurrentUnit = 'home' | 'dark_kitchen' | 'shared_kitchen' | 'food_van' | 'cafe' | 'restaurant' | 'popup' | 'other' | null
type PlannedBusiness = 'delivery_only' | 'mobile' | 'cafe' | 'restaurant' | 'catering' | 'production' | 'unsure' | null
type SpaceType = 'customer_facing' | 'production_only' | 'both' | 'mobile_unit' | null

interface FormData {
  businessStatus: BusinessStatus
  currentUnit: CurrentUnit
  plannedBusiness: PlannedBusiness
  spaceType: SpaceType
  cuisines: string[]
  equipment: string[]
  staffCount: string
  dailyOutput: string
  expansionPlans: string
  location: string
  budget: string
}

const CUISINES = [
  'Burgers', 'Chicken & Chips', 'Fish & Chips', 'Pizza', 'Indian', 'Caribbean',
  'Chinese', 'Turkish / Kebabs', 'Italian / Pasta', 'Mexican', 'Breakfast & Brunch',
  'Desserts & Bakery', 'Coffee & Café', 'Healthy / Salads'
]

const EQUIPMENT = {
  cooking: ['Deep fat fryers', 'Flat griddle / Plancha', 'Charcoal grill', 'Commercial oven', 'Pizza oven', 'Gas hobs / Range', 'Tandoor oven', 'Wok burners'],
  cold: ['Upright fridge', 'Upright freezer', 'Under-counter fridge', 'Walk-in cold room', 'Display fridge'],
  prep: ['Bain maries', 'Prep tables', 'Food processor', 'Mixer', 'Slicer', 'Heat lamps'],
  other: ['Extraction / Ventilation', 'Dishwasher', 'Ice machine', 'Storage shelving']
}

const STAFF_OPTIONS = ['Just me', '2 people', '3-5 people', '6-10 people', '10+ people']
const OUTPUT_OPTIONS = ['Under 20', '20-50', '50-100', '100-200', '200-500', '500+', 'Not sure yet']
const EXPANSION_OPTIONS = ['Yes, significant growth planned', 'Yes, some growth expected', 'No, staying the same size', 'Not sure']
const BUDGET_OPTIONS = [
  'Under £500/month', 
  '£500 - £1,000/month', 
  '£1,000 - £2,000/month', 
  '£2,000 - £5,000/month', 
  '£5,000+/month',
  '───────────────',
  '💰 £15,000 - £25,000 (one-time purchase)',
  '💰 £25,000 - £50,000 (one-time purchase)', 
  '💰 £50,000+ (one-time purchase)',
  '───────────────',
  'Not sure / Flexible'
]

export default function MatchPage() {
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState<FormData>({
    businessStatus: null,
    currentUnit: null,
    plannedBusiness: null,
    spaceType: null,
    cuisines: [],
    equipment: [],
    staffCount: '',
    dailyOutput: '',
    expansionPlans: '',
    location: '',
    budget: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 10
  const progress = (step / totalSteps) * 100

  const canProceed = () => {
    switch (step) {
      case 1: return true // Welcome
      case 2: return formData.businessStatus !== null
      case 3: return formData.businessStatus === 'operating' ? formData.currentUnit !== null : formData.plannedBusiness !== null
      case 4: return formData.spaceType !== null
      case 5: return formData.cuisines.length > 0
      case 6: return formData.equipment.length > 0
      case 7: return formData.staffCount !== ''
      case 8: return formData.dailyOutput !== ''
      case 9: return formData.expansionPlans !== ''
      case 10: return formData.location.trim() !== ''
      case 11: return formData.budget !== ''
      default: return false
    }
  }

  const handleNext = () => {
    if (step < 11) setStep((step + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.results) {
        // Store full match data for the results page
        sessionStorage.setItem('matchResults', JSON.stringify(data.results))
        sessionStorage.setItem('matchRecommendation', data.recommendation || '')
        sessionStorage.setItem('matchData', JSON.stringify({
          results: data.results,
          recommendation: data.recommendation,
          matchFactors: data.matchFactors,
          demandInsight: data.demandInsight,
          alsoConsider: data.alsoConsider,
          growthPath: data.growthPath,
          userProfile: data.userProfile
        }))
        window.location.href = `/match/results?id=${data.matchId}`
      }
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine]
    }))
  }

  const toggleEquipment = (item: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter(e => e !== item)
        : [...prev.equipment, item]
    }))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold">Kitchen Matcher</span>
          <span className="text-sm text-gray-500">{step > 1 ? `${step - 1}/10` : ''}</span>
        </div>
        {/* Progress bar */}
        {step > 1 && (
          <div className="h-1 bg-gray-100">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Find Your Perfect Kitchen</h1>
            <p className="text-gray-500 mb-8">
              Answer a few questions and we'll recommend the best kitchen solutions for your needs.
            </p>
            <p className="text-sm text-gray-400 mb-8">⏱️ Takes about 2 minutes</p>
            <button
              onClick={handleNext}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-semibold transition-colors"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step 2: Business Status */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Do you currently have a food business?</h2>
            <p className="text-gray-500 text-sm mb-6">This helps us understand your needs</p>
            
            <div className="space-y-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, businessStatus: 'operating' }))}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  formData.businessStatus === 'operating'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">Yes, I'm already operating</div>
                <div className="text-sm text-gray-500">I have an existing food business</div>
              </button>
              
              <button
                onClick={() => setFormData(prev => ({ ...prev, businessStatus: 'starting' }))}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  formData.businessStatus === 'starting'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">No, I'm just starting out</div>
                <div className="text-sm text-gray-500">I'm planning to launch</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3a: Current Unit (for existing businesses) */}
        {step === 3 && formData.businessStatus === 'operating' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What's your current setup?</h2>
            <p className="text-gray-500 text-sm mb-6">Select your current operation type</p>
            
            <div className="space-y-2">
              {[
                { value: 'home', label: 'From home / Home kitchen' },
                { value: 'dark_kitchen', label: 'Dark kitchen unit' },
                { value: 'shared_kitchen', label: 'Shared commercial kitchen' },
                { value: 'food_van', label: 'Food truck or van' },
                { value: 'cafe', label: 'Café or takeaway' },
                { value: 'restaurant', label: 'Restaurant' },
                { value: 'popup', label: 'Pop-up / Market stall' },
                { value: 'other', label: 'Other' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, currentUnit: option.value as CurrentUnit }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.currentUnit === option.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3b: Planned Business (for startups) */}
        {step === 3 && formData.businessStatus === 'starting' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What are you planning to launch?</h2>
            <p className="text-gray-500 text-sm mb-6">Select your planned business type</p>
            
            <div className="space-y-2">
              {[
                { value: 'delivery_only', label: 'Delivery-only brand (dark kitchen)' },
                { value: 'mobile', label: 'Mobile food business (truck/van)' },
                { value: 'cafe', label: 'Café or takeaway' },
                { value: 'restaurant', label: 'Restaurant' },
                { value: 'catering', label: 'Catering service' },
                { value: 'production', label: 'Food production / Prep kitchen' },
                { value: 'unsure', label: "Not sure yet — help me decide" },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, plannedBusiness: option.value as PlannedBusiness }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.plannedBusiness === option.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Space Type - NEW */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What type of space do you need?</h2>
            <p className="text-gray-500 text-sm mb-6">This helps us recommend the right facilities</p>
            
            <div className="space-y-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, spaceType: 'production_only' }))}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  formData.spaceType === 'production_only'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">🏭 Production / Prep only</div>
                <div className="text-sm text-gray-500">Kitchen for cooking, prep, or delivery — no customers on-site</div>
              </button>
              
              <button
                onClick={() => setFormData(prev => ({ ...prev, spaceType: 'customer_facing' }))}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  formData.spaceType === 'customer_facing'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">🍽️ Customer-facing</div>
                <div className="text-sm text-gray-500">Retail space where customers can visit, dine-in, or takeaway</div>
              </button>
              
              <button
                onClick={() => setFormData(prev => ({ ...prev, spaceType: 'both' }))}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  formData.spaceType === 'both'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">🏪 Both</div>
                <div className="text-sm text-gray-500">Production kitchen with customer-facing area</div>
              </button>
              
              <button
                onClick={() => setFormData(prev => ({ ...prev, spaceType: 'mobile_unit' }))}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  formData.spaceType === 'mobile_unit'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">🚚 Mobile unit</div>
                <div className="text-sm text-gray-500">Food truck, trailer, or mobile catering vehicle</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Cuisine Type */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What type of food do you make?</h2>
            <p className="text-gray-500 text-sm mb-6">Select all that apply</p>
            
            <div className="flex flex-wrap gap-2">
              {CUISINES.map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => toggleCuisine(cuisine)}
                  className={`px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                    formData.cuisines.includes(cuisine)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
            
            <div className="mt-4">
              <input
                type="text"
                placeholder="Other cuisine (type here)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none"
                onBlur={(e) => {
                  if (e.target.value.trim() && !formData.cuisines.includes(e.target.value.trim())) {
                    toggleCuisine(e.target.value.trim())
                    e.target.value = ''
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Step 6: Equipment */}
        {step === 6 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What equipment do you need?</h2>
            <p className="text-gray-500 text-sm mb-6">Select all that apply</p>
            
            {Object.entries(EQUIPMENT).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {category === 'cooking' && '🔥 Cooking'}
                  {category === 'cold' && '🧊 Cold Storage'}
                  {category === 'prep' && '🍳 Prep & Service'}
                  {category === 'other' && '💧 Other'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <button
                      key={item}
                      onClick={() => toggleEquipment(item)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                        formData.equipment.includes(item)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 7: Staff Count */}
        {step === 7 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">How many people work in your kitchen?</h2>
              </div>
            </div>
            
            <div className="space-y-2">
              {STAFF_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => setFormData(prev => ({ ...prev, staffCount: option }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.staffCount === option
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Daily Output */}
        {step === 8 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">How many meals/orders per day?</h2>
              </div>
            </div>
            
            <div className="space-y-2">
              {OUTPUT_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => setFormData(prev => ({ ...prev, dailyOutput: option }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.dailyOutput === option
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 9: Expansion Plans */}
        {step === 9 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Do you plan to expand in the next 3 years?</h2>
              </div>
            </div>
            
            <div className="space-y-2">
              {EXPANSION_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => setFormData(prev => ({ ...prev, expansionPlans: option }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.expansionPlans === option
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 10: Location */}
        {step === 10 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Where are you looking for a kitchen?</h2>
              </div>
            </div>
            
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter city or postcode"
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none text-lg"
            />
            <p className="text-sm text-gray-500 mt-2">Examples: London, Manchester, Birmingham, SW1A</p>
          </div>
        )}

        {/* Step 11: Budget */}
        {step === 11 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <PoundSterling className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">What's your budget?</h2>
                <p className="text-gray-500 text-sm">Monthly rental or one-time purchase</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {BUDGET_OPTIONS.map(option => {
                // Skip separator rows
                if (option.startsWith('───')) {
                  return <div key={option} className="border-t border-gray-200 my-3" />
                }
                return (
                  <button
                    key={option}
                    onClick={() => setFormData(prev => ({ ...prev, budget: option }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.budget === option
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{option}</div>
                    {option.includes('one-time') && (
                      <div className="text-xs text-gray-500 mt-1">For buying a mobile unit or food truck</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step > 1 && (
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleBack}
              className="flex-1 py-4 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            
            {step < 11 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex-1 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  canProceed()
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className={`flex-1 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  canProceed() && !isSubmitting
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Finding matches...' : 'Get My Recommendations'}
                {!isSubmitting && <Check className="w-5 h-5" />}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
