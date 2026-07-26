/**
 * Crypto-wallet detection.
 *
 * Given the plain text of a page, find every place that signals the page is
 * discussing crypto wallets and produce a confidence score. The requirement is
 * "the page mentions crypto wallets" in meaning — not the exact ordered string
 * "crypto wallets" — so detection uses a weighted vocabulary of direct terms,
 * wallet mechanics, wallet brand names, and literal on-chain addresses rather
 * than a single substring match.
 */

import type { MentionCategory, WalletMention } from './types'

type SignalRule = {
  category: MentionCategory
  /** Regex matched case-insensitively against the page text. */
  pattern: RegExp
  /** How strongly this signal indicates a crypto-wallet discussion. */
  weight: number
  /** Human label used when the pattern itself is opaque (e.g. addresses). */
  label?: string
}

// Word boundary that also treats hyphens as separators so "wallet-address"
// and "wallet address" both match cleanly.
const b = (inner: string) => new RegExp(`(?<![\\w-])(?:${inner})(?![\\w-])`, 'gi')

/**
 * Ordered strongest-first so that when two rules overlap at the same position
 * (e.g. "hardware wallet" vs a bare "wallet"), the stronger, more specific
 * signal wins and the weaker one is suppressed.
 */
const RULES: SignalRule[] = [
  // ── Direct crypto-wallet terms (strong) ─────────────────────────────────
  {
    category: 'direct-term',
    weight: 1.0,
    pattern: b(
      'crypto(?:currency)?\\s+wallets?|' +
        'wallets?\\s+for\\s+crypto(?:currency)?|' +
        '(?:bitcoin|btc|ethereum|eth|solana|sol|blockchain|web3|defi)\\s+wallets?|' +
        'non-?custodial\\s+wallets?|self-?custody\\s+wallets?|custodial\\s+wallets?|' +
        'hardware\\s+wallets?|software\\s+wallets?|paper\\s+wallets?|' +
        'hot\\s+wallets?|cold\\s+wallets?|cold\\s+storage|' +
        'multi-?sig(?:nature)?\\s+wallets?'
    ),
  },
  {
    category: 'direct-term',
    weight: 0.7,
    // "self-custody" / "non-custodial" on their own strongly imply wallets.
    pattern: b('self-?custody|non-?custodial|seed\\s+vault'),
  },
  // ── Wallet mechanics, crypto-specific (medium) ───────────────────────────
  {
    category: 'wallet-mechanic',
    weight: 0.6,
    pattern: b(
      'seed\\s+phrase|recovery\\s+phrase|mnemonic(?:\\s+phrase)?|' +
        'wallet\\s+address(?:es)?|keystore|keyfile|wallet\\.dat|' +
        'wallet\\s+(?:seed|backup|import|recovery)|' +
        'derivation\\s+path|extended\\s+public\\s+key|xpub'
    ),
  },
  // ── Generic key terms (weak — also used by SSH/TLS/PGP, so ambiguous) ─────
  {
    category: 'wallet-mechanic',
    weight: 0.3,
    pattern: b('private\\s+keys?|public\\s+keys?'),
  },
  // ── Named wallet products (medium-strong) ────────────────────────────────
  {
    category: 'wallet-brand',
    weight: 0.65,
    pattern: b(
      'metamask|trust\\s+wallet|coinbase\\s+wallet|ledger(?:\\s+(?:nano|live))?|' +
        'trezor|phantom\\s+wallet|exodus\\s+wallet|electrum|myetherwallet|mew|' +
        'rainbow\\s+wallet|keplr|safepal|bluewallet|atomic\\s+wallet|imtoken|' +
        'zengo|gnosis\\s+safe|argent|blockstream\\s+green|zerion|rabby'
    ),
  },
  // ── Literal on-chain addresses (medium — concrete evidence) ──────────────
  {
    category: 'address',
    weight: 0.6,
    label: 'on-chain address',
    // Ethereum-style 0x + 40 hex.
    pattern: /(?<![\w])0x[a-fA-F0-9]{40}(?![\w])/g,
  },
  {
    category: 'address',
    weight: 0.6,
    label: 'on-chain address',
    // Bitcoin bech32 (bc1...) and legacy P2PKH/P2SH (1.../3...).
    pattern:
      /(?<![\w])(?:bc1[a-z0-9]{20,60}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})(?![\w])/g,
  },
]

/**
 * Generic crypto vocabulary. These words are ambiguous on their own (a page
 * can say "wallet" or "token" innocently), so they never count as a mention.
 * They only *corroborate* concrete evidence — a real on-chain address or a
 * named wallet product — nudging a clear crypto page over the threshold.
 */
const CONTEXT_TERMS =
  /(?<![\w-])(?:crypto(?:currency)?|bitcoin|btc|ethereum|eth|blockchain|web3|defi|on-?chain|wallet|token|coin|satoshi|gwei|confirmations?|ledger|metamask|seed)(?![\w-])/i

const CONTEXT_RADIUS = 90 // characters of context shown on each side of a match

function makeSnippet(text: string, start: number, end: number): string {
  const from = Math.max(0, start - CONTEXT_RADIUS)
  const to = Math.min(text.length, end + CONTEXT_RADIUS)
  const before = text.slice(from, start)
  const hit = text.slice(start, end)
  const after = text.slice(end, to)
  const prefix = from > 0 ? '…' : ''
  const suffix = to < text.length ? '…' : ''
  // Collapse whitespace so multi-line snippets read on one line.
  return `${prefix}${before}«${hit}»${after}${suffix}`.replace(/\s+/g, ' ').trim()
}

export type DetectionResult = {
  discussesCryptoWallets: boolean
  confidence: number
  mentions: WalletMention[]
  categoryCounts: Record<MentionCategory, number>
}

/**
 * Scan page text for crypto-wallet signals.
 *
 * @param minConfidence threshold above which the page counts as discussing
 *   crypto wallets (default 0.5).
 * @param maxMentions cap on how many mentions to return (default 40) so a page
 *   that repeats a term hundreds of times doesn't bloat the response.
 */
export function detectCryptoWallets(
  text: string,
  minConfidence = 0.5,
  maxMentions = 40
): DetectionResult {
  const raw: WalletMention[] = []

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = rule.pattern.exec(text)) !== null) {
      const start = m.index
      const end = start + m[0].length
      raw.push({
        category: rule.category,
        match: rule.label ? `${rule.label}: ${m[0]}` : m[0],
        index: start,
        snippet: makeSnippet(text, start, end),
        weight: rule.weight,
      })
      // Guard against zero-width matches causing an infinite loop.
      if (m.index === rule.pattern.lastIndex) rule.pattern.lastIndex++
    }
  }

  // Suppress weaker mentions that overlap a stronger one at the same span.
  raw.sort((a, b) => a.index - b.index || b.weight - a.weight)
  const mentions: WalletMention[] = []
  let lastEnd = -1
  for (const mention of raw) {
    const end = mention.index + mention.match.length
    if (mention.index < lastEnd) continue // overlaps a stronger, earlier match
    mentions.push(mention)
    lastEnd = end
  }

  const categoryCounts: Record<MentionCategory, number> = {
    'direct-term': 0,
    'wallet-mechanic': 0,
    'wallet-brand': 0,
    address: 0,
  }
  for (const mention of mentions) categoryCounts[mention.category]++

  const confidence = scoreConfidence(mentions, categoryCounts, text)

  // Return mentions ordered by position, capped.
  const ordered = mentions
    .slice()
    .sort((a, b) => a.index - b.index)
    .slice(0, maxMentions)

  return {
    discussesCryptoWallets: confidence >= minConfidence,
    confidence,
    mentions: ordered,
    categoryCounts,
  }
}

/**
 * Turn raw signal weights into a 0-1 confidence.
 *
 * A single strong direct term ("hardware wallet") is enough on its own. Weaker
 * signals (wallet mechanics, a lone brand, an address) need to accumulate or
 * co-occur across categories before we call it a genuine discussion — that's
 * what stops a page that merely says "private key" once (SSH, API keys) from
 * being flagged.
 */
function scoreConfidence(
  mentions: WalletMention[],
  counts: Record<MentionCategory, number>,
  text: string
): number {
  if (mentions.length === 0) return 0

  // Diminishing returns: each additional mention of the same signal matters
  // less. Sum sqrt-scaled weights per category.
  let score = 0
  const perCategory: Record<MentionCategory, number> = {
    'direct-term': 0,
    'wallet-mechanic': 0,
    'wallet-brand': 0,
    address: 0,
  }
  for (const m of mentions) perCategory[m.category] += m.weight

  const distinctCategories = (Object.keys(counts) as MentionCategory[]).filter(
    (c) => counts[c] > 0
  ).length

  for (const c of Object.keys(perCategory) as MentionCategory[]) {
    // sqrt keeps the first hit valuable while capping repeated hits.
    score += Math.sqrt(perCategory[c])
  }

  // Cross-category corroboration is a strong signal of genuine discussion.
  if (distinctCategories >= 2) score += 0.5
  if (distinctCategories >= 3) score += 0.5

  // Concrete evidence (a real address or a named wallet product) surrounded by
  // crypto vocabulary is unambiguous even when it's the only signal type.
  const hasConcrete = counts.address > 0 || counts['wallet-brand'] > 0
  if (hasConcrete && distinctCategories < 2 && CONTEXT_TERMS.test(text)) {
    score += 0.4
  }

  // Map the unbounded score onto 0-1 with a soft curve.
  return Math.min(1, score / 2.2)
}
