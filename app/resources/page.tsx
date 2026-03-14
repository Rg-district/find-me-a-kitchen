'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, UtensilsCrossed, CreditCard, GraduationCap, Building2, Package, ExternalLink, Check } from 'lucide-react'

const RESOURCES = [
  {
    category: 'Insurance',
    icon: Shield,
    description: 'Public liability and business insurance — required for any food operation',
    items: [
      {
        name: 'Simply Business',
        description: 'UK\'s largest business insurance provider. Get covered in minutes.',
        features: ['Public liability from £50/year', 'Instant quotes online', 'Trusted by 900,000+ businesses'],
        cta: 'Get a Quote',
        url: 'https://www.simplybusiness.co.uk/', // Add affiliate link
        recommended: true
      },
      {
        name: 'PolicyBee',
        description: 'Specialist insurance for small businesses and freelancers.',
        features: ['Tailored food business cover', 'Product liability included', 'Pay monthly available'],
        cta: 'Compare Prices',
        url: 'https://www.policybee.co.uk/' // Add affiliate link
      }
    ]
  },
  {
    category: 'Kitchen Equipment',
    icon: UtensilsCrossed,
    description: 'Commercial-grade equipment for professional kitchens',
    items: [
      {
        name: 'Nisbets',
        description: 'UK\'s largest catering equipment supplier. Next-day delivery available.',
        features: ['20,000+ products', 'Trade prices', 'Expert advice'],
        cta: 'Shop Equipment',
        url: 'https://www.nisbets.co.uk/', // Add affiliate link
        recommended: true
      },
      {
        name: 'Alliance Online',
        description: 'Commercial catering equipment at competitive prices.',
        features: ['Free delivery over £50', 'Finance available', 'Professional ranges'],
        cta: 'Browse Products',
        url: 'https://www.allianceonline.co.uk/'
      }
    ]
  },
  {
    category: 'Food Safety Training',
    icon: GraduationCap,
    description: 'Required certifications for food handlers — Level 2 is the legal minimum',
    items: [
      {
        name: 'High Speed Training',
        description: 'City & Guilds accredited online food hygiene courses.',
        features: ['Level 2 from £20+VAT', 'Complete in 2 hours', 'Instant certificate'],
        cta: 'Start Training',
        url: 'https://www.highspeedtraining.co.uk/', // Add affiliate link
        recommended: true
      },
      {
        name: 'Food Hygiene Company',
        description: 'RoSPA approved food safety training.',
        features: ['Courses from £9.95', 'Accepted nationwide', 'Train your whole team'],
        cta: 'View Courses',
        url: 'https://www.foodhygienecompany.co.uk/'
      }
    ]
  },
  {
    category: 'Payment Systems',
    icon: CreditCard,
    description: 'Take card payments from day one',
    items: [
      {
        name: 'Square',
        description: 'All-in-one POS system. Popular with food businesses.',
        features: ['No monthly fees', '1.75% transaction fee', 'Free card reader'],
        cta: 'Get Started Free',
        url: 'https://squareup.com/gb/en', // Add affiliate link
        recommended: true
      },
      {
        name: 'SumUp',
        description: 'Simple, affordable card payments for small businesses.',
        features: ['Card reader from £39', '1.69% transaction fee', 'No contract'],
        cta: 'Order Reader',
        url: 'https://www.sumup.com/en-gb/'
      },
      {
        name: 'Zettle by PayPal',
        description: 'Backed by PayPal. Integrated with your existing accounts.',
        features: ['Reader from £29', '1.75% fee', 'PayPal integration'],
        cta: 'Learn More',
        url: 'https://www.zettle.com/gb'
      }
    ]
  },
  {
    category: 'Business Banking',
    icon: Building2,
    description: 'Separate your business finances from day one',
    items: [
      {
        name: 'Tide',
        description: 'Free business account built for small businesses.',
        features: ['Free to open', 'Invoicing included', 'Expense tracking'],
        cta: 'Open Account',
        url: 'https://www.tide.co/', // Add affiliate link
        recommended: true
      },
      {
        name: 'Starling Bank',
        description: 'Award-winning business banking app.',
        features: ['No monthly fees', 'Instant notifications', 'Integrations'],
        cta: 'Apply Now',
        url: 'https://www.starlingbank.com/business/'
      }
    ]
  },
  {
    category: 'Packaging & Supplies',
    icon: Package,
    description: 'Takeaway containers, bags, and disposables',
    items: [
      {
        name: 'Packaging Supplies',
        description: 'Wide range of food packaging solutions.',
        features: ['Eco-friendly options', 'Bulk discounts', 'Custom printing'],
        cta: 'Shop Now',
        url: 'https://www.packagingsupplies.co.uk/'
      },
      {
        name: 'Vegware',
        description: 'Fully compostable food packaging.',
        features: ['Plant-based materials', 'Commercial composting', 'B Corp certified'],
        cta: 'View Range',
        url: 'https://www.vegware.com/'
      }
    ]
  }
]

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Essential Resources</h1>
          <p className="text-gray-600 mt-2">Everything you need to start and run your food business</p>
        </div>
      </div>

      {/* Resources */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {RESOURCES.map((section) => (
          <section key={section.category}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <section.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{section.category}</h2>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {section.items.map((item) => (
                <div 
                  key={item.name}
                  className={`bg-white rounded-2xl border-2 p-5 ${
                    item.recommended ? 'border-emerald-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    {item.recommended && (
                      <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  
                  <ul className="space-y-2 mb-4">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                      item.recommended
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {item.cta}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Disclaimer */}
        <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-500">
          <p>
            <strong>Disclosure:</strong> Some links on this page are affiliate links. 
            This means we may earn a small commission if you make a purchase, at no extra cost to you. 
            We only recommend products and services we believe will genuinely help your food business.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-emerald-50 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to find your kitchen?</h3>
          <p className="text-gray-600 mb-4">Get matched with the perfect space in under 2 minutes</p>
          <Link
            href="/match"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Find Your Kitchen
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Find Me a Kitchen. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
