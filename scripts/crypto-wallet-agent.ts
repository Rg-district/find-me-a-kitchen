/**
 * CLI runner for the crypto-wallet search agent.
 *
 * Searches a search engine for a query, follows each result link, and reports
 * which pages discuss crypto wallets and exactly where.
 *
 * Run:
 *   bun scripts/crypto-wallet-agent.ts "how to secure a crypto wallet"
 *   bun scripts/crypto-wallet-agent.ts "best hardware wallet 2026" --max 15 --llm
 *   bun scripts/crypto-wallet-agent.ts "self custody guide" --all --json
 *
 * Flags:
 *   --max <n>          number of search results to inspect (default 10)
 *   --llm              use the LLM to semantically confirm matches (needs OPENAI_API_KEY)
 *   --all              show non-matching pages too (default: only matches)
 *   --provider <name>  serpapi | brave | bing | duckduckgo (default: auto)
 *   --min <0-1>        heuristic confidence threshold (default 0.5)
 *   --json             print raw JSON instead of a formatted report
 *
 * Search provider keys (any one enables that engine; otherwise DuckDuckGo):
 *   SERPAPI_KEY, BRAVE_SEARCH_API_KEY, BING_SEARCH_API_KEY
 */

import { runCryptoWalletSearch } from '../lib/crypto-wallet-agent'
import type { AgentOptions, SearchProviderName } from '../lib/crypto-wallet-agent'

function parseArgs(argv: string[]): { query: string; opts: AgentOptions; json: boolean } {
  const positional: string[] = []
  let max = 10
  let useLLM = false
  let onlyMatches = true
  let minConfidence = 0.5
  let provider: SearchProviderName | undefined
  let json = false

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case '--max':
        max = parseInt(argv[++i], 10) || 10
        break
      case '--llm':
        useLLM = true
        break
      case '--all':
        onlyMatches = false
        break
      case '--min':
        minConfidence = parseFloat(argv[++i])
        break
      case '--provider':
        provider = argv[++i] as SearchProviderName
        break
      case '--json':
        json = true
        break
      default:
        positional.push(a)
    }
  }

  const query = positional.join(' ').trim()
  return { query, opts: { query, maxResults: max, useLLM, onlyMatches, minConfidence, provider }, json }
}

// ── Minimal ANSI helpers ──────────────────────────────────────────────────
const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
}

async function main() {
  const { query, opts, json } = parseArgs(process.argv.slice(2))
  if (!query) {
    console.error('Usage: bun scripts/crypto-wallet-agent.ts "<search query>" [--max n] [--llm] [--all] [--provider name] [--json]')
    process.exit(1)
  }

  console.error(c.dim(`Searching for "${query}"…`))
  const result = await runCryptoWalletSearch(opts)

  if (json) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log('')
  console.log(c.bold(`Query: ${result.query}`))
  console.log(
    c.dim(
      `Engine: ${result.provider} · ${result.totalResults} results scanned · ` +
        `${result.matchedCount} discuss crypto wallets · ${result.searchedAt}`
    )
  )
  console.log('')

  if (result.pages.length === 0) {
    console.log(c.yellow('No pages in the results discuss crypto wallets.'))
    return
  }

  result.pages.forEach((p, i) => {
    const badge = p.discussesCryptoWallets
      ? c.green(`✓ MATCH (${Math.round(p.confidence * 100)}%)`)
      : c.dim(`· no (${Math.round(p.confidence * 100)}%)`)
    console.log(`${c.bold(`${i + 1}. ${p.title}`)}  ${badge}`)
    console.log(`   ${c.cyan(p.url)}`)
    if (p.error) console.log(`   ${c.yellow('! ' + p.error)}`)

    const counts = p.categoryCounts
    const summary = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k}:${n}`)
      .join('  ')
    if (summary) console.log(`   ${c.dim(summary)} · method=${p.method}`)

    // Show up to 4 exact mention locations.
    p.mentions.slice(0, 4).forEach((m) => {
      console.log(`     ${c.dim('@' + m.index)} [${m.category}] ${m.snippet}`)
    })

    if (p.llm?.quotes?.length) {
      console.log(`   ${c.dim('LLM quotes:')}`)
      p.llm.quotes.forEach((q) => console.log(`     ${c.dim('“' + q + '”')}`))
    }
    console.log('')
  })
}

main().catch((err) => {
  console.error('Agent failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
