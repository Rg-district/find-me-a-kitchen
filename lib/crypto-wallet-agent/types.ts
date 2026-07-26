/**
 * Shared types for the crypto-wallet search agent.
 *
 * The agent queries a search engine, follows each result link, fetches the
 * page, and decides whether the page actually *discusses crypto wallets* —
 * not merely whether it contains the literal string "crypto wallets".
 */

/** A single result returned by a search engine. */
export type SearchResult = {
  title: string
  url: string
  /** Snippet/description the search engine returned, if any. */
  snippet?: string
  /** 1-based position within the result set. */
  rank: number
}

/** One place on a page where a crypto-wallet signal was found. */
export type WalletMention = {
  /** The category of signal, e.g. "direct-term", "wallet-brand", "address". */
  category: MentionCategory
  /** The exact text that matched (e.g. "hardware wallet", "MetaMask"). */
  match: string
  /** Character offset of the match within the extracted page text. */
  index: number
  /**
   * The surrounding text so a human can see the mention in context. The match
   * itself is wrapped in «double angle quotes» within the snippet.
   */
  snippet: string
  /** Weight this mention contributed to the confidence score. */
  weight: number
}

export type MentionCategory =
  | 'direct-term' // "crypto wallet", "bitcoin wallet", "cold storage"...
  | 'wallet-mechanic' // "seed phrase", "private key", "wallet address"...
  | 'wallet-brand' // MetaMask, Ledger, Trezor, Trust Wallet...
  | 'address' // a literal on-chain address (bc1..., 0x...)

/** The verdict for a single fetched page. */
export type PageAnalysis = {
  url: string
  title: string
  /** True if the page genuinely discusses crypto wallets. */
  discussesCryptoWallets: boolean
  /** 0-1 confidence that the page discusses crypto wallets. */
  confidence: number
  /** Every distinct signal found, ordered by position on the page. */
  mentions: WalletMention[]
  /** Count of mentions per category, for a quick overview. */
  categoryCounts: Record<MentionCategory, number>
  /** How the verdict was reached. */
  method: 'heuristic' | 'heuristic+llm'
  /** Present only when LLM verification ran. */
  llm?: {
    discussesCryptoWallets: boolean
    reason: string
    /** Exact sentences the model says discuss crypto wallets. */
    quotes: string[]
  }
  /** Set when the page could not be fetched or analysed. */
  error?: string
}

/** Options controlling one agent run. */
export type AgentOptions = {
  /** What to search for on the engine, e.g. "how to secure a crypto wallet". */
  query: string
  /** Max search results to pull from the engine (default 10). */
  maxResults?: number
  /** Only return pages that actually discuss crypto wallets (default true). */
  onlyMatches?: boolean
  /**
   * Minimum confidence for a page to count as "discusses crypto wallets"
   * under the heuristic detector (default 0.5).
   */
  minConfidence?: number
  /** Use the LLM to semantically confirm ambiguous pages (default false). */
  useLLM?: boolean
  /** How many pages to fetch concurrently (default 5). */
  concurrency?: number
  /** Per-page fetch timeout in ms (default 15000). */
  fetchTimeoutMs?: number
  /** Force a specific search provider instead of auto-detecting. */
  provider?: SearchProviderName
}

export type SearchProviderName = 'serpapi' | 'brave' | 'bing' | 'duckduckgo'

/** The full result of an agent run. */
export type AgentRunResult = {
  query: string
  provider: SearchProviderName
  searchedAt: string
  totalResults: number
  matchedCount: number
  pages: PageAnalysis[]
}

/** Abstraction over a search engine so providers are swappable. */
export interface SearchProvider {
  readonly name: SearchProviderName
  search(query: string, limit: number): Promise<SearchResult[]>
}

/**
 * Events emitted by the streaming agent so a dashboard can show progress as the
 * agent works through each link, rather than waiting for the whole run.
 */
export type StreamEvent =
  | {
      type: 'search'
      provider: SearchProviderName
      query: string
      results: SearchResult[]
    }
  | {
      type: 'page'
      analysis: PageAnalysis
      /** The original search-result URL (before redirects) — a stable row key. */
      sourceUrl: string
      /** 1-based position in the search results. */
      rank: number
      completed: number
      total: number
    }
  | {
      type: 'done'
      query: string
      provider: SearchProviderName
      searchedAt: string
      totalResults: number
      matchedCount: number
    }
  | { type: 'error'; error: string }
