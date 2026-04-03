'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Building2, ChevronRight, Mail, MapPin, User, Briefcase, Bell, Check } from 'lucide-react'

type Step = 'choose' | 'seeker' | 'lister' | 'success'

export default function AccountPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choose')
  const [form, setForm] = useState({
    name: '',
    email: '',
    location: '',
    businessName: '',
    wantsAlerts: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        router.push('/account/dashboard')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [step, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          accountType: 'seeker',
        }),
      })

      if (res.ok) {
        setStep('success')
      } else {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-lg ml-2">
            {step === 'choose' && 'Sign Up'}
            {step === 'seeker' && 'Looking for a Kitchen'}
            {step === 'lister' && 'List Your Kitchen'}
            {step === 'success' && 'You\'re Signed Up'}
          </h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {/* Step 1: Choose Account Type */}
        {step === 'choose' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Find Me a Kitchen</h2>
              <p className="text-gray-500">What brings you here?</p>
            </div>

            <button
              onClick={() => setStep('seeker')}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-emerald-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Search className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">In need of a kitchen</h3>
                  <p className="text-gray-500 text-sm">Find commercial kitchen space to rent for your food business</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-4" />
              </div>
            </button>

            <button
              onClick={() => setStep('lister')}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-emerald-500 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <Building2 className="w-7 h-7 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Want to list your kitchen</h3>
                  <p className="text-gray-500 text-sm">Rent out your commercial kitchen space to food operators</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-4" />
              </div>
            </button>

            <div className="text-center pt-4">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <Link href="/account/login" className="text-gray-900 font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2a: Kitchen Seeker Registration */}
        {step === 'seeker' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Looking for a kitchen?</h2>
              <p className="text-gray-500 text-sm mt-1">Sign up to browse and get alerts</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Town or City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. London, Manchester"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                    placeholder="Your business name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>
              </div>

              {/* Email Alerts Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.wantsAlerts}
                      onChange={e => setForm(f => ({ ...f, wantsAlerts: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      form.wantsAlerts 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {form.wantsAlerts && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-gray-900 text-sm">Get email alerts</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Notify me as soon as a kitchen becomes available in my town or city
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-base transition-colors"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => setStep('choose')}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
            >
              ← Back
            </button>
          </form>
        )}

        {/* Step 2b: Kitchen Lister - Contact Info */}
        {step === 'lister' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">List Your Kitchen</h2>
              <p className="text-gray-500 text-sm mt-1">Get in touch with our listings team</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <p className="text-gray-600 mb-6">
                To list your commercial kitchen space, please contact our listings team directly. 
                We'll help you get set up and reach food operators across the UK.
              </p>

              <a
                href="mailto:listings@findmeakitchen.com?subject=I want to list my kitchen"
                className="inline-flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold text-base transition-colors"
              >
                <Mail className="w-5 h-5" />
                Email listings@findmeakitchen.com
              </a>

              <p className="text-sm text-gray-500 mt-4">
                Or email us at: <a href="mailto:listings@findmeakitchen.com" className="text-emerald-600 font-medium">listings@findmeakitchen.com</a>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep('choose')}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">You're signed up!</h2>
            <p className="text-gray-500 mb-2">
              Welcome to Find Me a Kitchen.
            </p>
            {form.wantsAlerts && (
              <p className="text-gray-500 mb-4">
                We'll email you at <strong>{form.email}</strong> when kitchens become available in <strong>{form.location}</strong>.
              </p>
            )}
            <p className="text-sm text-gray-400 mb-6">Taking you to your dashboard...</p>
            <Link
              href="/account/dashboard"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-colors"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
