import { NextRequest, NextResponse } from 'next/server'
import { runCryptoWalletSearch } from '@/lib/crypto-wallet-agent'
import type { AgentOptions, SearchProviderName } from '@/lib/crypto-wallet-agent'

// Fetching and analysing several pages can take a while.
export const maxDuration = 120
export const dynamic = 'force-dynamic'

const VALID_PROVIDERS: SearchProviderName[] = ['serpapi', 'brave', 'bing', 'duckduckgo']

/**
 * GET /api/crypto-wallet-search?q=...&max=10&onlyMatches=true&llm=false&provider=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || searchParams.get('query') || ''
  if (!query.trim()) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  const providerParam = searchParams.get('provider') as SearchProviderName | null
  const opts: AgentOptions = {
    query,
    maxResults: clampInt(searchParams.get('max'), 10, 1, 25),
    onlyMatches: searchParams.get('onlyMatches') !== 'false',
    useLLM: searchParams.get('llm') === 'true',
    minConfidence: clampFloat(searchParams.get('minConfidence'), 0.5, 0, 1),
    provider:
      providerParam && VALID_PROVIDERS.includes(providerParam) ? providerParam : undefined,
  }

  return runAndRespond(opts)
}

/** POST with a JSON body matching AgentOptions. */
export async function POST(req: NextRequest) {
  let body: Partial<AgentOptions>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.query || !body.query.trim()) {
    return NextResponse.json({ error: '"query" is required' }, { status: 400 })
  }

  const opts: AgentOptions = {
    query: body.query,
    maxResults: clampNumber(body.maxResults, 10, 1, 25),
    onlyMatches: body.onlyMatches !== false,
    useLLM: body.useLLM === true,
    minConfidence: clampNumber(body.minConfidence, 0.5, 0, 1),
    concurrency: clampNumber(body.concurrency, 5, 1, 10),
    fetchTimeoutMs: clampNumber(body.fetchTimeoutMs, 15000, 2000, 60000),
    provider:
      body.provider && VALID_PROVIDERS.includes(body.provider) ? body.provider : undefined,
  }

  return runAndRespond(opts)
}

async function runAndRespond(opts: AgentOptions) {
  try {
    const result = await runCryptoWalletSearch(opts)
    return NextResponse.json(result)
  } catch (error) {
    console.error('crypto-wallet-search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search agent failed' },
      { status: 500 }
    )
  }
}

function clampInt(v: string | null, def: number, min: number, max: number): number {
  const n = v == null ? def : parseInt(v, 10)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def
}
function clampFloat(v: string | null, def: number, min: number, max: number): number {
  const n = v == null ? def : parseFloat(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def
}
function clampNumber(v: number | undefined, def: number, min: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def
}
