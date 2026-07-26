/**
 * Page fetching and HTML → text extraction.
 *
 * We only need readable text to run wallet detection over, so we strip scripts,
 * styles, and markup and collapse whitespace. The page <title> is pulled out
 * separately so results can be labelled.
 */

// A realistic desktop-browser UA; many sites 403 obvious bot user-agents.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export type FetchedPage = {
  url: string
  /** Final URL after redirects. */
  finalUrl: string
  title: string
  text: string
}

export async function fetchPage(
  url: string,
  timeoutMs = 15000
): Promise<FetchedPage> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)

    const contentType = res.headers.get('content-type') ?? ''
    if (!/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
      throw new Error(`Unsupported content-type: ${contentType || 'unknown'}`)
    }

    const html = await res.text()
    return {
      url,
      finalUrl: res.url || url,
      title: extractTitle(html) || url,
      text: htmlToText(html),
    }
  } finally {
    clearTimeout(timer)
  }
}

export function extractTitle(html: string): string {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : ''
}

/**
 * Convert HTML to readable plain text: drop non-content elements, turn block
 * tags into line breaks, remove remaining markup, and decode entities.
 */
export function htmlToText(html: string): string {
  let text = html
    // Remove elements whose content isn't human-readable prose.
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Preserve structure: block-level tags become newlines.
    .replace(/<\/(p|div|section|article|li|ul|ol|h[1-6]|br|tr|table|header|footer)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Drop all remaining tags.
    .replace(/<[^>]+>/g, ' ')

  text = decodeEntities(text)

  // Normalise whitespace while keeping paragraph breaks.
  return text
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => safeFromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeFromCharCode(parseInt(h, 16)))
}

function safeFromCharCode(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return ''
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}
