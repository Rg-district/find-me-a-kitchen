'use client'

import Link from 'next/link'
import { ArrowLeft, Download, Check, AlertTriangle, FileText } from 'lucide-react'

export default function KitchenChecklist() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Header - hidden when printing */}
      <header className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-semibold ml-2">Kitchen Checklist</span>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 print:py-4 print:px-8">
        {/* Print header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Find Me a Kitchen</h1>
          <p className="text-gray-500">Kitchen Agreement Checklist</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 print:border-0 print:p-0">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-emerald-600 print:hidden" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Questions to Ask Before Signing</h1>
              <p className="text-gray-500 text-sm">Essential checklist for any kitchen agreement</p>
            </div>
          </div>

          {/* Section 1: Contract Terms */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Contract Terms
            </h2>
            <ul className="space-y-3">
              {[
                'What is the minimum contract length?',
                'What notice period is required to leave?',
                'Are there any break clauses?',
                'What happens if I need to close temporarily?',
                'Can I sublet or share my time slot?',
              ].map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2: Costs */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              True Costs
            </h2>
            <ul className="space-y-3">
              {[
                'What is the total monthly cost (rent + service charges)?',
                'Are utilities (gas, electric, water) included?',
                'Is there a deposit? How much and when is it returned?',
                'Are there any commission fees on orders?',
                'What insurance do I need to provide?',
                'Are there any hidden fees (cleaning, waste, maintenance)?',
                'Will the price increase? When and by how much?',
              ].map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3: Equipment & Facilities */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Equipment & Facilities
            </h2>
            <ul className="space-y-3">
              {[
                'What equipment is included? Get a full inventory list.',
                'Who is responsible for equipment maintenance?',
                'Can I bring my own equipment?',
                'Is there dedicated storage space? How much?',
                'Is there cold storage/refrigeration included?',
                'What is the extraction/ventilation capacity?',
                'Is there parking for deliveries and collections?',
              ].map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4: Operations */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Operations
            </h2>
            <ul className="space-y-3">
              {[
                'What are the operating hours? Any restrictions?',
                'Do I have 24/7 access or set hours?',
                'How many other businesses share the space?',
                'What is the process for key/access collection?',
                'Who handles cleaning? How often?',
                'What are the food hygiene rating requirements?',
                'Are delivery platform integrations available?',
              ].map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 5: Compliance */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">5</span>
              Compliance & Licensing
            </h2>
            <ul className="space-y-3">
              {[
                'Is the kitchen registered with the local council?',
                'What is the current food hygiene rating?',
                'Who is responsible for fire safety compliance?',
                'Do I need my own food business registration?',
                'What certifications do I need to provide?',
                'Are gas safety certificates up to date?',
              ].map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{q}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Warning box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Red Flags to Watch For</p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• No written contract or agreement</li>
                  <li>• Unclear pricing or "variable" costs</li>
                  <li>• No food hygiene rating displayed</li>
                  <li>• Pressure to sign immediately</li>
                  <li>• Unable to visit before signing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Final tips */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-emerald-800 mb-2">Before You Sign</p>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>✓ Visit the kitchen in person during operating hours</li>
              <li>✓ Ask to speak with current tenants about their experience</li>
              <li>✓ Get everything in writing — verbal promises don't count</li>
              <li>✓ Have a solicitor review contracts over £1,000/month</li>
              <li>✓ Take photos of the space and equipment before moving in</li>
            </ul>
          </div>
        </div>

        {/* Footer - hidden when printing */}
        <div className="mt-6 text-center print:hidden">
          <p className="text-sm text-gray-500">
            Questions? <Link href="/contact" className="text-emerald-600 hover:underline">Contact us</Link> for personalised advice.
          </p>
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">findmeakitchen.com — Your guide to commercial kitchen solutions</p>
        </div>
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  )
}
