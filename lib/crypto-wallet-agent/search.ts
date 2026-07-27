/**
 * Search-engine layer.
 *
 * The agent "sifts through search engines" via a swappable SearchProvider. If
 * an API key is configured for SerpAPI, Brave, or Bing we use that (better
 * quality, ToS-friendly). Otherwise we fall back to DuckDuckGo's keyless HTML
 * endpoint so the agent works out of the box with no credentials.
 */

import type {
  SearchProvider,
  SearchProviderName,
  SearchResult,
} from './types'

// A realistic desktop-browser UA. Keyless DuckDuckGo (and many target sites)
// reject obvious bot user-agents with a 403, so we present as a browser.
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA, ...headers } })
  if (!res.ok) throw new Error(`Search request failed: ${res.status} ${res.statusText}`)
  return res.json()
}

// ── SerpAPI (Google results) ──────────────────────────────────────────────
class SerpApiProvider implements SearchProvider {
  readonly name = 'serpapi' as const
  constructor(private key: string) {}
  async search(query: string, limit: number): Promise<SearchResult[]> {
    const url =
      `https://serpapi.com/search.json?engine=google` +
      `&q=${encodeURIComponent(query)}&num=${limit}&api_key=${this.key}`
    const data = await getJson(url)
    const organic: any[] = data.organic_results ?? []
    return organic.slice(0, limit).map((r, i) => ({
      title: r.title ?? '',
      url: r.link,
      snippet: r.snippet,
      rank: i + 1,
    }))
  }
}

// ── Brave Search API ──────────────────────────────────────────────────────
class BraveProvider implements SearchProvider {
  readonly name = 'brave' as const
  constructor(private key: string) {}
  async search(query: string, limit: number): Promise<SearchResult[]> {
    const url =
      `https://api.search.brave.com/res/v1/web/search` +
      `?q=${encodeURIComponent(query)}&count=${Math.min(limit, 20)}`
    const data = await getJson(url, {
      Accept: 'application/json',
      'X-Subscription-Token': this.key,
    })
    const web: any[] = data.web?.results ?? []
    return web.slice(0, limit).map((r, i) => ({
      title: r.title ?? '',
      url: r.url,
      snippet: r.description,
      rank: i + 1,
    }))
  }
}

// ── Bing Web Search API ───────────────────────────────────────────────────
class BingProvider implements SearchProvider {
  readonly name = 'bing' as const
  constructor(private key: string) {}
  async search(query: string, limit: number): Promise<SearchResult[]> {
    const url =
      `https://api.bing.microsoft.com/v7.0/search` +
      `?q=${encodeURIComponent(query)}&count=${Math.min(limit, 50)}`
    const data = await getJson(url, { 'Ocp-Apim-Subscription-Key': this.key })
    const web: any[] = data.webPages?.value ?? []
    return web.slice(0, limit).map((r, i) => ({
      title: r.name ?? '',
      url: r.url,
      snippet: r.snippet,
      rank: i + 1,
    }))
  }
}

// ── DuckDuckGo (keyless fallback) ─────────────────────────────────────────
class DuckDuckGoProvider implements SearchProvider {
  readonly name = 'duckduckgo' as const
  async search(query: string, limit: number): Promise<SearchResult[]> {
    // DuckDuckGo's no-JS endpoints. We POST the query as a browser form (the
    // most reliable path) and try the `lite` endpoint if `html` is blocked or
    // returns nothing.
    const attempts: { url: string; parse: (html: string, limit: number) => SearchResult[] }[] = [
      { url: 'https://html.duckduckgo.com/html/', parse: parseDuckDuckGo },
      { url: 'https://lite.duckduckgo.com/lite/', parse: parseDuckDuckGoLite },
    ]
    let lastErr: unknown = new Error('no attempts made')
    for (const attempt of attempts) {
      try {
        const res = await fetch(attempt.url, {
          method: 'POST',
          headers: {
            'User-Agent': BROWSER_UA,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            Origin: new URL(attempt.url).origin,
            Referer: attempt.url,
          },
          body: new URLSearchParams({ q: query, kl: 'us-en' }).toString(),
        })
        if (!res.ok) throw new Error(`${attempt.url} responded ${res.status}`)
        const html = await res.text()
        const results = attempt.parse(html, limit)
        if (results.length > 0) return results
        lastErr = new Error(`${attempt.url} returned no parseable results`)
      } catch (err) {
        lastErr = err
      }
    }
    throw new Error(
      `DuckDuckGo request failed: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}. ` +
        `Set SERPAPI_KEY, BRAVE_SEARCH_API_KEY, or BING_SEARCH_API_KEY for reliable search.`
    )
  }
}

/**
 * Parse the DuckDuckGo HTML results page. DDG wraps each result link in
 * `a.result__a` and its snippet in `a.result__snippet`, and points the href
 * through a `/l/?uddg=<encoded-target>` redirect we unwrap.
 */
export function parseDuckDuckGo(html: string, limit: number): SearchResult[] {
  const results: SearchResult[] = []
  const linkRe =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  const snippetRe =
    /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi

  const snippets: string[] = []
  let sm: RegExpExecArray | null
  while ((sm = snippetRe.exec(html)) !== null) snippets.push(stripTags(sm[1]))

  let m: RegExpExecArray | null
  let i = 0
  while ((m = linkRe.exec(html)) !== null && results.length < limit) {
    const href = decodeDdgHref(m[1])
    if (!href) {
      i++
      continue
    }
    results.push({
      title: stripTags(m[2]),
      url: href,
      snippet: snippets[i],
      rank: results.length + 1,
    })
    i++
  }
  return results
}

/**
 * Parse the DuckDuckGo `lite` results page — a simple table where each result
 * is an `<a class="result-link" href="…">`. Snippets are not reliably present,
 * so this returns titles + URLs only.
 */
export function parseDuckDuckGoLite(html: string, limit: number): SearchResult[] {
  const results: SearchResult[] = []
  const tagRe = /<a([^>]*class=['"][^'"]*result-link[^'"]*['"][^>]*)>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(html)) !== null && results.length < limit) {
    const hrefMatch = /href=['"]([^'"]+)['"]/i.exec(m[1])
    if (!hrefMatch) continue
    const href = decodeDdgHref(hrefMatch[1])
    if (!href) continue
    results.push({ title: stripTags(m[2]), url: href, rank: results.length + 1 })
  }
  return results
}

function decodeDdgHref(href: string): string | null {
  let h = href
  if (h.startsWith('//')) h = 'https:' + h
  try {
    const u = new URL(h, 'https://duckduckgo.com')
    const target = u.searchParams.get('uddg')
    if (target) return decodeURIComponent(target)
    // Some results are already absolute; skip DDG-internal ad/redirect links.
    if (u.hostname.includes('duckduckgo.com')) return null
    return u.toString()
  } catch {
    return null
  }
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Pick a provider. If `force` is given, use it (throwing if its key is
 * missing). Otherwise use the first provider that has credentials, falling
 * back to keyless DuckDuckGo.
 */
/** First non-empty (trimmed) value among the given env var names. */
function envAny(...names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n]
    if (v && v.trim()) return v.trim()
  }
  return undefined
}

export function getSearchProvider(force?: SearchProviderName): SearchProvider {
  // Accept common naming variants so a differently-named env var still works.
  const serp = envAny('SERPAPI_KEY', 'SERP_API_KEY', 'SERPAPI')
  const brave = envAny(
    'BRAVE_SEARCH_API_KEY',
    'BRAVESEARCH',
    'BRAVE_SEARCH',
    'BRAVE_API_KEY',
    'BRAVE_KEY',
    'BRAVE'
  )
  const bing = envAny('BING_SEARCH_API_KEY', 'BING_API_KEY', 'BING_KEY')

  if (force) {
    switch (force) {
      case 'serpapi':
        if (!serp) throw new Error('SERPAPI_KEY is not set')
        return new SerpApiProvider(serp)
      case 'brave':
        if (!brave) throw new Error('BRAVE_SEARCH_API_KEY is not set')
        return new BraveProvider(brave)
      case 'bing':
        if (!bing) throw new Error('BING_SEARCH_API_KEY is not set')
        return new BingProvider(bing)
      case 'duckduckgo':
        return new DuckDuckGoProvider()
    }
  }

  if (serp) return new SerpApiProvider(serp)
  if (brave) return new BraveProvider(brave)
  if (bing) return new BingProvider(bing)
  return new DuckDuckGoProvider()
}
