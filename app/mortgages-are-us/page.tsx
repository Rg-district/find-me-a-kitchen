"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQ {
  q: string;
  a: string;
}

interface Service {
  icon: string;
  title: string;
  desc: string;
  features: string[];
}

interface Step {
  num: string;
  title: string;
  desc: string;
}

interface Review {
  name: string;
  location: string;
  stars: number;
  text: string;
  date: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES: Service[] = [
  {
    icon: "🏠",
    title: "First-Time Buyers",
    desc: "We guide you through every step of buying your first home — from understanding your budget to getting the keys.",
    features: ["Help to Buy & Shared Ownership", "5% deposit options", "Government scheme advice", "No jargon, plain English"],
  },
  {
    icon: "🔄",
    title: "Remortgaging",
    desc: "Coming off a fixed rate? We search the whole market to find you a better deal and save you money.",
    features: ["Whole-of-market search", "Rate comparison service", "No hidden fees advice", "Free affordability check"],
  },
  {
    icon: "🏢",
    title: "Buy-to-Let",
    desc: "Growing your property portfolio? We specialise in buy-to-let mortgages for both new and experienced landlords.",
    features: ["Rental yield calculations", "Portfolio landlord advice", "Limited company mortgages", "HMO & holiday let options"],
  },
  {
    icon: "🛡️",
    title: "Protection Insurance",
    desc: "Protect what matters most. We advise on life insurance, critical illness cover, and income protection.",
    features: ["Life insurance", "Critical illness cover", "Income protection", "Buildings & contents"],
  },
];

const STEPS: Step[] = [
  { num: "01", title: "Free Consultation", desc: "Book a no-obligation call with one of our advisors. We'll understand your goals and financial situation." },
  { num: "02", title: "We Search for You", desc: "We search thousands of deals from over 90 lenders — including exclusive rates not available on the high street." },
  { num: "03", title: "Recommendation", desc: "We present the best options for your situation with a clear, honest explanation — no pressure, no rush." },
  { num: "04", title: "Application & Support", desc: "We handle the paperwork, liaise with lenders, and keep you updated until you get the keys." },
];

const REVIEWS: Review[] = [
  { name: "Sarah M.", location: "Chelmsford, Essex", stars: 5, text: "Absolutely fantastic service from start to finish. As a first-time buyer I was terrified, but the team made it so straightforward. Found us a great rate and we completed in just 8 weeks!", date: "March 2024" },
  { name: "James & Lisa T.", location: "Brentwood, Essex", stars: 5, text: "We've used Mortgages Are Us twice now — once for our first home and then to remortgage. Saved us hundreds of pounds a month. Couldn't recommend them more.", date: "January 2024" },
  { name: "David R.", location: "Southend-on-Sea", stars: 5, text: "As a landlord with multiple properties, the buy-to-let advice was second to none. They understood exactly what I needed and found me a deal I couldn't have found myself.", date: "November 2023" },
];

const FAQS: FAQ[] = [
  { q: "How much does your service cost?", a: "Our initial consultation is completely free with no obligation. We charge a fee for mortgage advice — we'll always be upfront about any costs before you commit to anything." },
  { q: "How long does a mortgage application take?", a: "Typically 4–8 weeks from application to completion, though this varies depending on the lender and your circumstances. We'll keep you updated every step of the way." },
  { q: "Can you help if I have bad credit?", a: "Yes. We work with specialist lenders who consider applications from people with adverse credit history. We'll assess your full situation and find the most suitable options." },
  { q: "Do I need a large deposit?", a: "Not necessarily. There are mortgage deals available with as little as 5% deposit, particularly for first-time buyers. We'll help you understand all the options available." },
  { q: "Are you whole-of-market?", a: "Yes — we're not tied to any single lender. We search thousands of products from over 90 lenders to find the best deal for your individual circumstances." },
  { q: "Can I remortgage early?", a: "Possibly — it depends on your current deal's early repayment charges. We'll analyse whether it makes financial sense for you to remortgage before your current deal ends." },
];

// ─── Mortgage Calculator ───────────────────────────────────────────────────────

function MortgageCalculator() {
  const [propertyValue, setPropertyValue] = useState(300000);
  const [deposit, setDeposit] = useState(30000);
  const [term, setTerm] = useState(25);
  const [rate, setRate] = useState(4.5);

  const loanAmount = Math.max(0, propertyValue - deposit);
  const ltv = propertyValue > 0 ? ((loanAmount / propertyValue) * 100).toFixed(1) : "0.0";
  const monthlyRate = rate / 100 / 12;
  const numPayments = term * 12;
  const monthlyPayment =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;
  const totalRepayable = monthlyPayment * numPayments;
  const totalInterest = totalRepayable - loanAmount;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white">
        <h3 className="text-xl font-bold mb-1">Mortgage Calculator</h3>
        <p className="text-blue-200 text-sm">Get an estimate of your monthly payments</p>
      </div>
      <div className="p-6 space-y-5">
        {/* Property Value */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Property Value</label>
            <span className="text-sm font-bold text-blue-900">{fmt(propertyValue)}</span>
          </div>
          <input type="range" min={50000} max={2000000} step={5000} value={propertyValue}
            onChange={e => setPropertyValue(+e.target.value)}
            className="w-full accent-blue-700" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>£50k</span><span>£2m</span></div>
        </div>
        {/* Deposit */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Deposit</label>
            <span className="text-sm font-bold text-blue-900">{fmt(deposit)}</span>
          </div>
          <input type="range" min={0} max={propertyValue} step={1000} value={Math.min(deposit, propertyValue)}
            onChange={e => setDeposit(+e.target.value)}
            className="w-full accent-blue-700" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>£0</span><span>{fmt(propertyValue)}</span></div>
        </div>
        {/* Term */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Mortgage Term</label>
            <span className="text-sm font-bold text-blue-900">{term} years</span>
          </div>
          <input type="range" min={5} max={40} step={1} value={term}
            onChange={e => setTerm(+e.target.value)}
            className="w-full accent-blue-700" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5 yrs</span><span>40 yrs</span></div>
        </div>
        {/* Rate */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Interest Rate</label>
            <span className="text-sm font-bold text-blue-900">{rate}%</span>
          </div>
          <input type="range" min={1} max={10} step={0.1} value={rate}
            onChange={e => setRate(parseFloat(e.target.value))}
            className="w-full accent-blue-700" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1%</span><span>10%</span></div>
        </div>

        {/* Results */}
        <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Loan Amount</span>
            <span className="font-semibold text-gray-900">{fmt(loanAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Loan to Value (LTV)</span>
            <span className={`font-semibold text-sm px-2 py-0.5 rounded-full ${parseFloat(ltv) <= 80 ? "bg-green-100 text-green-700" : parseFloat(ltv) <= 90 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{ltv}%</span>
          </div>
          <div className="border-t border-blue-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Monthly Payment</span>
              <span className="text-2xl font-bold text-blue-900">{fmt(monthlyPayment)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Total Repayable</span>
            <span className="text-gray-700 font-medium">{fmt(totalRepayable)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Total Interest</span>
            <span className="text-gray-700 font-medium">{fmt(totalInterest)}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">This is an estimate for illustration purposes only. Speak to an advisor for accurate figures.</p>
        <a href="#contact" className="block w-full bg-blue-700 hover:bg-blue-800 text-white text-center py-3 rounded-xl font-semibold transition-colors">
          Get a Personalised Quote →
        </a>
      </div>
    </div>
  );
}

// ─── FAQ Accordion ─────────────────────────────────────────────────────────────

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-5 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 bg-white">
          {faq.a}
        </div>
      )}
    </div>
  );
}

// ─── Contact Form ──────────────────────────────────────────────────────────────

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  }, []);

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Thanks, we&apos;ll be in touch!</h3>
        <p className="text-green-700">One of our advisors will contact you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="John Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="07700 900123" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="john@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">I need help with</label>
        <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
          <option value="">Select a service...</option>
          <option>First-Time Buyer Mortgage</option>
          <option>Remortgaging</option>
          <option>Buy-to-Let Mortgage</option>
          <option>Moving Home</option>
          <option>Protection Insurance</option>
          <option>Not sure — I need advice</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know?</label>
        <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
          rows={4}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
          placeholder="Tell us a bit about your situation..." />
      </div>
      <button type="submit"
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors text-lg">
        Request a Free Callback →
      </button>
      <p className="text-xs text-gray-400 text-center">We&apos;ll never share your details. By submitting you agree to our Privacy Policy.</p>
    </form>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MortgagesAreUsPage() {
  return (
    <div className="font-sans text-gray-900 bg-white">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-950/95 backdrop-blur-sm border-b border-blue-900">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-blue-950 font-bold text-sm">M</div>
            <span className="text-white font-bold text-lg">Mortgages Are Us</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-blue-200">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#calculator" className="hover:text-white transition-colors">Calculator</a>
            <a href="#process" className="hover:text-white transition-colors">How It Works</a>
            <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQs</a>
          </div>
          <a href="#contact" className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
            Free Consultation
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-700 rounded-full px-4 py-2 mb-8 text-sm text-blue-200">
              <span className="text-amber-400">★★★★★</span>
              <span>5-star rated mortgage advisors in Essex</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Your mortgage,<br />
              <span className="text-amber-400">made simple.</span>
            </h1>
            <p className="text-xl text-blue-200 mb-10 leading-relaxed">
              We take the stress out of getting a mortgage — from your first call to getting the keys. Independent, whole-of-market advice from Essex-based experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#contact" className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold px-8 py-4 rounded-xl text-lg transition-colors text-center">
                Book Free Consultation
              </a>
              <a href="#calculator" className="border-2 border-blue-600 hover:border-blue-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors text-center">
                Try Our Calculator
              </a>
            </div>
            {/* Trust stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-blue-800 pt-10">
              {[["500+", "Happy Clients"], ["90+", "Lenders"], ["£0", "Initial Fee"]].map(([val, label]) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-amber-400">{val}</div>
                  <div className="text-sm text-blue-300">{label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Calculator in hero */}
          <div id="calculator">
            <MortgageCalculator />
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-gray-50 border-y border-gray-200 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
          {["FCA Regulated", "Whole-of-Market", "Free Initial Consultation", "Based in Essex", "Rated 5 Stars on Google"].map(item => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-blue-700 font-bold">✓</span>
              <span className="font-medium text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">What We Do</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Expert advice for every situation</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Whether you&apos;re buying your first home, remortgaging, or investing in property — we have the expertise to help.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map(s => (
              <div key={s.title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all group">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">{s.title}</h3>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">{s.desc}</p>
                <ul className="space-y-1.5">
                  {s.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="mt-5 block text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors">
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="process" className="py-20 px-6 bg-blue-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-wider mb-3">The Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-blue-300 text-lg">Four simple steps from first call to keys in hand.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-blue-800 -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-blue-800 border-2 border-blue-700 flex items-center justify-center mb-4">
                    <span className="text-amber-400 font-bold text-xl">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-blue-300 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a href="#contact" className="inline-block bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold px-10 py-4 rounded-xl text-lg transition-colors">
              Start Your Journey Today
            </a>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">Client Reviews</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What our clients say</h2>
            <div className="flex items-center justify-center gap-2 text-amber-400 text-2xl mb-2">★★★★★</div>
            <p className="text-gray-500">5.0 average from 200+ verified Google reviews</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map(r => (
              <div key={r.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-amber-400 text-lg mb-3">{"★".repeat(r.stars)}</div>
                <p className="text-gray-700 leading-relaxed mb-5 italic">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{r.name}</div>
                    <div className="text-gray-400 text-xs">{r.location} · {r.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Independent advice you can trust</h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              As an independent, whole-of-market broker, we&apos;re not tied to any lender. We work for you — not the banks — to find the best deal for your circumstances.
            </p>
            <div className="space-y-5">
              {[
                ["🔍", "Whole-of-market search", "We compare thousands of deals from 90+ lenders including exclusive rates unavailable directly."],
                ["💬", "Plain English advice", "No jargon, no confusion. We explain everything clearly so you feel confident in your decisions."],
                ["📞", "We handle everything", "From application to completion, we liaise with lenders, solicitors and estate agents on your behalf."],
                ["🔁", "Ongoing support", "We don't disappear after completion. We review your mortgage regularly to keep saving you money."],
              ].map(([icon, title, desc]) => (
                <div key={title as string} className="flex gap-4">
                  <div className="text-2xl flex-shrink-0 mt-1">{icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 rounded-3xl p-10 border border-blue-100">
            <div className="grid grid-cols-2 gap-6">
              {[
                ["500+", "Mortgages arranged"],
                ["£2.5M+", "Interest saved for clients"],
                ["25 yrs", "Combined experience"],
                ["4.9★", "Average Google rating"],
              ].map(([val, label]) => (
                <div key={label as string} className="bg-white rounded-2xl p-6 shadow-sm text-center">
                  <div className="text-2xl font-bold text-blue-900 mb-1">{val}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
              <p className="text-amber-800 font-semibold">FCA Authorised & Regulated</p>
              <p className="text-amber-700 text-sm mt-1">Your money is protected. We follow strict FCA guidelines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">FAQs</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(faq => <FAQItem key={faq.q} faq={faq} />)}
          </div>
          <p className="text-center text-gray-500 mt-8">
            Still have questions?{" "}
            <a href="#contact" className="text-blue-700 font-semibold hover:underline">Get in touch →</a>
          </p>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">
          <div>
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">Get In Touch</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Book your free consultation</h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              Ready to get started? Fill in the form and one of our advisors will be in touch within 24 hours. There&apos;s no obligation and no cost.
            </p>
            <div className="space-y-5">
              {[
                ["📍", "Based in Essex", "Serving clients across Essex, London, and the UK"],
                ["📞", "01234 567 890", "Monday–Friday 9am–6pm, Saturday 9am–1pm"],
                ["✉️", "hello@mortgagesareus.co.uk", "We aim to reply within 2 hours"],
              ].map(([icon, title, sub]) => (
                <div key={title as string} className="flex gap-4 items-start">
                  <div className="text-2xl">{icon}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{title}</div>
                    <div className="text-sm text-gray-500">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-blue-800 font-semibold mb-1">Prefer to call?</p>
              <a href="tel:01234567890" className="text-2xl font-bold text-blue-900 hover:text-blue-700 transition-colors">
                01234 567 890
              </a>
            </div>
          </div>
          <div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-blue-950 text-blue-300 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-blue-950 font-bold text-sm">M</div>
                <span className="text-white font-bold">Mortgages Are Us</span>
              </div>
              <p className="text-sm leading-relaxed">Independent mortgage advisors based in Essex. FCA authorised and regulated.</p>
            </div>
            {[
              { title: "Services", links: ["First-Time Buyers", "Remortgaging", "Buy-to-Let", "Protection Insurance", "Moving Home"] },
              { title: "Company", links: ["About Us", "Our Advisors", "Reviews", "Blog", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Cookie Policy", "Terms of Service", "Complaints", "FCA Registration"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2 text-sm">
                  {col.links.map(l => <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-blue-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2024 Mortgages Are Us Ltd. All rights reserved.</p>
            <p className="text-blue-400 text-center max-w-xl">
              Your home may be repossessed if you do not keep up repayments on your mortgage. The Financial Conduct Authority does not regulate most Buy-to-Let mortgages.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
