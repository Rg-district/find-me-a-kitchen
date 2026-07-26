'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertTriangle,
  Wallet,
  Link2,
  ScanSearch,
  StopCircle,
  ArrowUpDown,
} from 'lucide-react'

// ── Types mirrored from lib/crypto-wallet-agent (kept local to the page) ────
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
type StreamEvent =
  | { type: 'search'; provider: string; query: string; results: { title: string; url: string; snippet?: string; rank: number }[] }
  | { type: 'page'; analysis: PageAnalysis; sourceUrl: string; rank: number; completed: number; total: number }
  | { type: 'done'; query: string; provider: string; searchedAt: string; totalResults: number; matchedCount: number }
  | { type: 'error'; error: string }

type Row = {
  rank: number
  sourceUrl: string
  title: string
  status: 'pending' | 'done'
  analysis?: PageAnalysis
}

type Phase = 'idle' | 'searching' | 'scanning' | 'done' | 'error'

const CATEGORY_LABELS: Record<string, string> = {
  'direct-term': 'Direct term',
  'wallet-mechanic': 'Wallet mechanic',
  'wallet-brand': 'Wallet brand',
  address: 'On-chain address',
}

function Snippet({ text }: { text: string }) {
  const parts = text.split(/«([^»]*)»/)
  return (
    <span className="text-sm text-gray-700 leading-relaxed">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-200 font-medium rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-0.5">{hint}</div>}
    </div>
  )
}

export default function CryptoWalletDashboard() {
  const [query, setQuery] = useState('')
  const [maxResults, setMaxResults] = useState(10)
  const [useLLM, setUseLLM] = useState(false)
  const [onlyMatches, setOnlyMatches] = useState(false)
  const [sortByConfidence, setSortByConfidence] = useState(false)

  const [phase, setPhase] = useState<Phase>('idle')
  const [provider, setProvider] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const running = phase === 'searching' || phase === 'scanning'

  function handleEvent(ev: StreamEvent) {
    switch (ev.type) {
      case 'search':
        setProvider(ev.provider)
        setTotal(ev.results.length)
        setRows(
          ev.results.map((r) => ({
            rank: r.rank,
            sourceUrl: r.url,
            title: r.title || r.url,
            status: 'pending' as const,
          }))
        )
        setPhase(ev.results.length > 0 ? 'scanning' : 'done')
        break
      case 'page':
        setCompleted(ev.completed)
        setRows((prev) =>
          prev.map((row) =>
            row.rank === ev.rank
              ? { ...row, status: 'done', analysis: ev.analysis, title: ev.analysis.title || row.title }
              : row
          )
        )
        break
      case 'done':
        setMatchedCount(ev.matchedCount)
        setPhase('done')
        break
      case 'error':
        setError(ev.error)
        setPhase('error')
        break
    }
  }

  async function run(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || running) return

    // Reset run state.
    setPhase('searching')
    setError(null)
    setRows([])
    setTotal(0)
    setCompleted(0)
    setMatchedCount(0)
    setProvider('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/crypto-wallet-search/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults, useLLM }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      // Read NDJSON: one StreamEvent per line, flushed as the agent progresses.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let nl: number
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim()
          buffer = buffer.slice(nl + 1)
          if (line) handleEvent(JSON.parse(line) as StreamEvent)
        }
      }
      const tail = buffer.trim()
      if (tail) handleEvent(JSON.parse(tail) as StreamEvent)

      setPhase((p) => (p === 'error' ? 'error' : 'done'))
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setPhase('done')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setPhase('error')
      }
    } finally {
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  // Derived, live count of matches (so the stat updates during the run too).
  const liveMatched = useMemo(
    () => rows.filter((r) => r.analysis?.discussesCryptoWallets).length,
    [rows]
  )
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const hitRate = completed > 0 ? Math.round((liveMatched / completed) * 100) : 0

  const visibleRows = useMemo(() => {
    let list = rows
    if (onlyMatches) list = list.filter((r) => r.status === 'pending' || r.analysis?.discussesCryptoWallets)
    if (sortByConfidence) {
      list = [...list].sort((a, b) => (b.analysis?.confidence ?? -1) - (a.analysis?.confidence ?? -1))
    }
    return list
  }, [rows, onlyMatches, sortByConfidence])

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Crypto Wallet Discovery Dashboard</h1>
        </div>
        <p className="text-gray-600 mb-6 text-sm max-w-2xl">
          Type <span className="font-medium">any keyword or topic</span> to search the web. The agent
          follows every result link, reads each page, and flags the ones that genuinely discuss crypto
          wallets — showing you exactly where on the page they&apos;re mentioned.
        </p>

        {/* Search bar */}
        <form onSubmit={run} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. beginner guide to online payments"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {running ? (
              <button
                type="button"
                onClick={stop}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <StopCircle className="w-4 h-4" /> Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!query.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ScanSearch className="w-4 h-4" /> Search &amp; scan
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-gray-600">
            <label className="flex items-center gap-1.5">
              Links to scan:
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                disabled={running}
                className="border border-gray-300 rounded px-1.5 py-1 disabled:opacity-50"
              >
                {[5, 10, 15, 20, 25].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={useLLM} onChange={(e) => setUseLLM(e.target.checked)} disabled={running} />
              AI verification
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={onlyMatches} onChange={(e) => setOnlyMatches(e.target.checked)} />
              Only show matches
            </label>
            <button
              type="button"
              onClick={() => setSortByConfidence((s) => !s)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort: {sortByConfidence ? 'confidence' : 'result order'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats + progress */}
        {(phase !== 'idle' && !error) && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <StatCard
                icon={<Link2 className="w-3.5 h-3.5" />}
                label="Links found"
                value={phase === 'searching' ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : total}
                hint={provider ? `via ${provider}` : undefined}
              />
              <StatCard
                icon={<ScanSearch className="w-3.5 h-3.5" />}
                label="Pages scanned"
                value={`${completed}/${total || '—'}`}
                hint={running && phase === 'scanning' ? 'scanning…' : phase === 'done' ? 'complete' : undefined}
              />
              <StatCard
                icon={<Wallet className="w-3.5 h-3.5" />}
                label="Discuss wallets"
                value={phase === 'done' ? matchedCount : liveMatched}
              />
              <StatCard
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                label="Hit rate"
                value={`${hitRate}%`}
                hint="of scanned pages"
              />
            </div>

            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${phase === 'searching' ? 4 : progressPct}%` }}
              />
            </div>
          </>
        )}

        {/* Results */}
        <div className="mt-6 space-y-3">
          {visibleRows.map((row) => {
            const a = row.analysis
            const isMatch = a?.discussesCryptoWallets
            return (
              <div
                key={row.rank}
                className={`rounded-xl border p-4 transition-colors ${
                  row.status === 'pending'
                    ? 'border-gray-200 bg-white'
                    : isMatch
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xs text-gray-400 font-mono mt-1 w-5 shrink-0 text-right">{row.rank}</span>
                  <div className="mt-0.5 shrink-0">
                    {row.status === 'pending' ? (
                      running ? (
                        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                      )
                    ) : isMatch ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={a?.url || row.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1"
                    >
                      <span className="truncate">{row.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    </a>
                    <div className="text-xs text-gray-500 truncate">{a?.url || row.sourceUrl}</div>
                  </div>
                  {row.status === 'done' && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                        isMatch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {Math.round((a?.confidence ?? 0) * 100)}%
                    </span>
                  )}
                </div>

                {a?.error && (
                  <div className="mt-2 ml-8 text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {a.error}
                  </div>
                )}

                {a && Object.entries(a.categoryCounts).some(([, n]) => n > 0) && (
                  <div className="mt-2 ml-8 flex flex-wrap gap-1.5">
                    {Object.entries(a.categoryCounts)
                      .filter(([, n]) => n > 0)
                      .map(([cat, n]) => (
                        <span key={cat} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">
                          {CATEGORY_LABELS[cat] || cat}: {n}
                        </span>
                      ))}
                  </div>
                )}

                {a && a.mentions.length > 0 && (
                  <div className="mt-3 ml-8 space-y-2">
                    {a.mentions.slice(0, 6).map((m, j) => (
                      <div key={j} className="border-l-2 border-yellow-300 pl-3">
                        <Snippet text={m.snippet} />
                      </div>
                    ))}
                    {a.mentions.length > 6 && (
                      <div className="text-xs text-gray-400">+{a.mentions.length - 6} more mentions</div>
                    )}
                  </div>
                )}

                {a?.llm?.quotes && a.llm.quotes.length > 0 && (
                  <div className="mt-3 ml-8 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                    <div className="text-xs font-medium text-blue-700 mb-1">AI-confirmed quotes</div>
                    {a.llm.quotes.map((q, k) => (
                      <p key={k} className="text-xs text-blue-900 italic">“{q}”</p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {phase === 'done' && rows.length > 0 && liveMatched === 0 && !onlyMatches && (
          <p className="mt-6 text-center text-sm text-gray-500">
            None of the {total} pages scanned discuss crypto wallets.
          </p>
        )}
      </main>
    </div>
  )
}
