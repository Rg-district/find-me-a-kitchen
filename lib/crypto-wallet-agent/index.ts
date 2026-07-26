/**
 * Crypto-wallet search agent.
 *
 * Searches a search engine for a query, follows each result link, fetches the
 * page, and reports which pages genuinely discuss crypto wallets — and exactly
 * where on each page they are mentioned.
 *
 * @example
 *   import { runCryptoWalletSearch } from '@/lib/crypto-wallet-agent'
 *   const result = await runCryptoWalletSearch({ query: 'best hardware wallet 2026' })
 */

export { runCryptoWalletSearch } from './agent'
export { detectCryptoWallets } from './detect'
export { getSearchProvider, parseDuckDuckGo } from './search'
export { fetchPage, htmlToText } from './fetch'
export type {
  AgentOptions,
  AgentRunResult,
  PageAnalysis,
  WalletMention,
  MentionCategory,
  SearchResult,
  SearchProvider,
  SearchProviderName,
} from './types'
