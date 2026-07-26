/**
 * The crypto-wallet search agent orchestrator.
 *
 * Pipeline:
 *   1. Query a search engine for the user's search term.
 *   2. Follow each result link and fetch the page.
 *   3. Extract readable text and run wallet detection over it.
 *   4. (Optional) Have the LLM semantically confirm ambiguous pages and quote
 *      exactly where crypto wallets are discussed.
 *   5. Return every page with its verdict and the precise mention locations.
 */

import { detectCryptoWallets } from './detect'
import { fetchPage } from './fetch'
import { verifyWithLLM } from './llm'
import { getSearchProvider } from './search'
import type {
  AgentOptions,
  AgentRunResult,
  MentionCategory,
  PageAnalysis,
  SearchResult,
} from './types'

const EMPTY_COUNTS = (): Record<MentionCategory, number> => ({
  'direct-term': 0,
  'wallet-mechanic': 0,
  'wallet-brand': 0,
  address: 0,
})

/** Run the whole search → fetch → detect pipeline for one query. */
export async function runCryptoWalletSearch(
  opts: AgentOptions
): Promise<AgentRunResult> {
  const {
    query,
    maxResults = 10,
    onlyMatches = true,
    minConfidence = 0.5,
    useLLM = false,
    concurrency = 5,
    fetchTimeoutMs = 15000,
    provider,
  } = opts

  if (!query || !query.trim()) throw new Error('A search query is required')

  const engine = getSearchProvider(provider)
  const results = await engine.search(query.trim(), maxResults)

  const analyses = await mapWithConcurrency(results, concurrency, (r) =>
    analysePage(r, { minConfidence, useLLM, fetchTimeoutMs })
  )

  // Order matches first (highest confidence), then the rest by original rank.
  const matched = analyses.filter((a) => a.discussesCryptoWallets)
  const unmatched = analyses.filter((a) => !a.discussesCryptoWallets)
  matched.sort((a, b) => b.confidence - a.confidence)

  const pages = onlyMatches ? matched : [...matched, ...unmatched]

  return {
    query: query.trim(),
    provider: engine.name,
    searchedAt: new Date().toISOString(),
    totalResults: results.length,
    matchedCount: matched.length,
    pages,
  }
}

async function analysePage(
  result: SearchResult,
  opts: { minConfidence: number; useLLM: boolean; fetchTimeoutMs: number }
): Promise<PageAnalysis> {
  const base: PageAnalysis = {
    url: result.url,
    title: result.title || result.url,
    discussesCryptoWallets: false,
    confidence: 0,
    mentions: [],
    categoryCounts: EMPTY_COUNTS(),
    method: 'heuristic',
  }

  let page
  try {
    page = await fetchPage(result.url, opts.fetchTimeoutMs)
  } catch (err) {
    return { ...base, error: `fetch failed: ${errMsg(err)}` }
  }

  const detection = detectCryptoWallets(page.text, opts.minConfidence)

  const analysis: PageAnalysis = {
    url: page.finalUrl,
    title: page.title || result.title || page.finalUrl,
    discussesCryptoWallets: detection.discussesCryptoWallets,
    confidence: round(detection.confidence),
    mentions: detection.mentions,
    categoryCounts: detection.categoryCounts,
    method: 'heuristic',
  }

  if (!opts.useLLM) return analysis

  // LLM verification: run it on borderline pages and on positives we want to
  // corroborate. Skip clearly empty pages to save tokens.
  const worthChecking = detection.mentions.length > 0 || detection.confidence > 0
  if (!worthChecking) return analysis

  try {
    const verdict = await verifyWithLLM(analysis.title, page.text)
    analysis.method = 'heuristic+llm'
    analysis.llm = verdict
    // The LLM's semantic judgement is authoritative for the final verdict.
    analysis.discussesCryptoWallets = verdict.discussesCryptoWallets
    if (verdict.discussesCryptoWallets && analysis.confidence < 0.6) {
      analysis.confidence = 0.6 // reflect model-confirmed match
    }
  } catch (err) {
    analysis.error = `llm verification failed: ${errMsg(err)}`
  }

  return analysis
}

/** Run `fn` over items with a bounded number of concurrent workers. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++
      out[i] = await fn(items[i])
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker)
  await Promise.all(workers)
  return out
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function errMsg(err: unknown): string {
  if (err instanceof Error) {
    return err.name === 'AbortError' ? 'timed out' : err.message
  }
  return String(err)
}
