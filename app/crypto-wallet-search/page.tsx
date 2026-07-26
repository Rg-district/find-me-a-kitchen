'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from 'lucide-react'

type WalletMention = {
  category: string
  match: string
  index: number
  snippet: string
  weight: number
}

type PageAnalysis = {
  url: string
  title: string
  discussesCryptoWallets: boolean
  confidence: number
  mentions: WalletMention[]
  categoryCounts: Record<string, number>
  method: string
  llm?: { discussesCryptoWallets: boolean; reason: string; quotes: string[] }
  error?: string
}

type AgentRunResult = {
  query: string
  provider: string
  searchedAt: string
  totalResults: number
  matchedCount: number
  pages: PageAnalysis[]
}

const CATEGORY_LABELS: Record<string, string> = {
  'direct-term': 'Direct term',
  'wallet-mechanic': 'Wallet mechanic',
  'wallet-brand': 'Wallet brand',
  address: 'On-chain address',
}

// Render a mention snippet, highlighting the «matched» span.
function Snippet({ text }: { text: string }) {
  const parts = text.split(/«([^»]*)»/)
  return (
    <span className="text-sm text-gray-700">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-200 font-medium rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

export default function CryptoWalletSearchPage() {
  const [query, setQuery] = useState('')
  const [maxResults, setMaxResults] = useState(10)
  const [useLLM, setUseLLM] = useState(false)
  const [onlyMatches, setOnlyMatches] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AgentRunResult | null>(null)

  async function runSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/crypto-wallet-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults, useLLM, onlyMatches }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data as AgentRunResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crypto Wallet Page Finder</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Searches the web for your query, follows each result link, and reports which pages
          genuinely discuss crypto wallets — and exactly where they&apos;re mentioned.
        </p>

        <form onSubmit={runSearch} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. how to secure a hardware wallet"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
            <label className="flex items-center gap-1.5">
              Results:
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="border border-gray-300 rounded px-1.5 py-1"
              >
                {[5, 10, 15, 20, 25].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={onlyMatches} onChange={(e) => setOnlyMatches(e.target.checked)} />
              Only show matches
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={useLLM} onChange={(e) => setUseLLM(e.target.checked)} />
              AI verification
            </label>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium text-gray-900">{result.matchedCount}</span> of{' '}
              {result.totalResults} results discuss crypto wallets
              <span className="text-gray-400"> · via {result.provider}</span>
            </p>

            <div className="space-y-4">
              {result.pages.map((page, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    page.discussesCryptoWallets
                      ? 'border-green-200 bg-green-50/40'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {page.discussesCryptoWallets ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1"
                      >
                        <span className="truncate">{page.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      </a>
                      <div className="text-xs text-gray-500 truncate">{page.url}</div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                        page.discussesCryptoWallets
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {Math.round(page.confidence * 100)}%
                    </span>
                  </div>

                  {page.error && (
                    <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {page.error}
                    </div>
                  )}

                  {Object.entries(page.categoryCounts).some(([, n]) => n > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(page.categoryCounts)
                        .filter(([, n]) => n > 0)
                        .map(([cat, n]) => (
                          <span key={cat} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">
                            {CATEGORY_LABELS[cat] || cat}: {n}
                          </span>
                        ))}
                    </div>
                  )}

                  {page.mentions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {page.mentions.slice(0, 6).map((m, j) => (
                        <div key={j} className="border-l-2 border-yellow-300 pl-3">
                          <Snippet text={m.snippet} />
                        </div>
                      ))}
                    </div>
                  )}

                  {page.llm?.quotes && page.llm.quotes.length > 0 && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                      <div className="text-xs font-medium text-blue-700 mb-1">AI-confirmed quotes</div>
                      {page.llm.quotes.map((q, k) => (
                        <p key={k} className="text-xs text-blue-900 italic">“{q}”</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
