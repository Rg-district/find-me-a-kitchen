# Crypto Wallet Search Agent

An agent that sifts through a search engine's results, follows every result
link, fetches each page, and reports **which pages genuinely discuss crypto
wallets — and exactly where on the page they are mentioned**.

The match is *semantic*, not a literal substring search: a page qualifies if it
discusses crypto wallets in meaning, even if it never contains the exact ordered
phrase "crypto wallets" (e.g. a self-custody guide that only talks about
MetaMask, seed phrases, and `0x…` addresses still matches).

## Pipeline

```
query ──▶ search engine ──▶ result links ──▶ fetch each page ──▶ extract text
                                                                      │
        matched pages + exact mention locations ◀── detect wallets ◀──┘
                                                    (+ optional LLM check)
```

## How detection works

`detectCryptoWallets(text)` scans page text with a weighted vocabulary and
returns every mention with its character offset and a highlighted snippet:

| Category          | Examples                                                        | Weight |
|-------------------|-----------------------------------------------------------------|--------|
| `direct-term`     | crypto wallet, bitcoin wallet, hardware/cold/hot wallet, self-custody | strong |
| `wallet-mechanic` | seed phrase, recovery phrase, wallet address, keystore, xpub     | medium |
| `wallet-brand`    | MetaMask, Ledger, Trezor, Trust Wallet, Phantom, Exodus…         | medium |
| `address`         | literal on-chain addresses (`0x…40 hex`, `bc1…`, `1…`/`3…`)       | medium |

Generic terms that are ambiguous outside crypto (`private key`, `public key` —
also used by SSH/TLS/PGP, or a bare `wallet` — could be leather) are
down-weighted or treated only as *corroboration*, so a leather-goods shop or an
SSH tutorial doesn't get flagged. A confidence score (0–1) is derived from the
signals; cross-category corroboration and concrete evidence (a real address or a
named wallet product surrounded by crypto vocabulary) raise it. Pages at or
above `minConfidence` (default 0.5) are reported as discussing crypto wallets.

Enable `useLLM` to have an LLM make the final semantic call on borderline pages
and quote the exact sentences it based its decision on (needs `OPENAI_API_KEY`).

## Usage

### Library

```ts
import { runCryptoWalletSearch } from '@/lib/crypto-wallet-agent'

const result = await runCryptoWalletSearch({
  query: 'how to secure a crypto wallet',
  maxResults: 10,
  onlyMatches: true, // only return pages that discuss crypto wallets
  useLLM: false,     // set true to add semantic LLM verification
})

for (const page of result.pages) {
  console.log(page.url, `${Math.round(page.confidence * 100)}%`)
  for (const m of page.mentions) {
    console.log(`  @${m.index} [${m.category}] ${m.snippet}`)
  }
}
```

### CLI

```bash
bun scripts/crypto-wallet-agent.ts "how to secure a crypto wallet"
bun scripts/crypto-wallet-agent.ts "best hardware wallet 2026" --max 15 --llm
bun scripts/crypto-wallet-agent.ts "self custody guide" --all --json
```

### HTTP API

```
GET  /api/crypto-wallet-search?q=how+to+secure+a+crypto+wallet&max=10&llm=false
POST /api/crypto-wallet-search   { "query": "...", "maxResults": 10, "useLLM": true }
```

### Web UI

Visit `/crypto-wallet-search` for a search box that renders each matching page
with its confidence score and the highlighted snippets where crypto wallets are
mentioned.

## Search providers

The agent auto-selects the first search engine it has credentials for, and
otherwise falls back to keyless DuckDuckGo HTML scraping. Set one of:

| Env var                 | Engine        |
|-------------------------|---------------|
| `SERPAPI_KEY`           | Google (SerpAPI) |
| `BRAVE_SEARCH_API_KEY`  | Brave Search  |
| `BING_SEARCH_API_KEY`   | Bing Web Search |
| *(none)*                | DuckDuckGo (keyless fallback) |

Optional: `OPENAI_API_KEY` (for `--llm`), `CRYPTO_AGENT_LLM_MODEL`
(default `gpt-4o-mini`).

> **Network note:** the agent makes outbound HTTPS calls to the search engine
> and to each result page. It therefore needs an environment that permits
> outbound internet access. In a locked-down sandbox with an allowlist-only
> network policy those calls will fail with a connection/403 error — run it in a
> deployed environment (or a session whose network policy allows general
> outbound HTTPS) instead. The detection, HTML-extraction, and result-parsing
> logic are fully unit-testable offline.
