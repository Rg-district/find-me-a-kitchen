import { NextResponse } from 'next/server'

// Diagnostic endpoint: reports which search API keys the running server can see.
// It never returns secret VALUES — only whether each expected key is present,
// plus the names of any env vars that look search-related (to catch typos).
export const dynamic = 'force-dynamic'

export async function GET() {
  // Each key maps to the env var names that are accepted for it (aliases).
  const keyAliases: Record<string, string[]> = {
    SERPAPI_KEY: ['SERPAPI_KEY', 'SERP_API_KEY', 'SERPAPI'],
    BRAVE_SEARCH_API_KEY: [
      'BRAVE_SEARCH_API_KEY',
      'BRAVESEARCH',
      'BRAVE_SEARCH',
      'BRAVE_API_KEY',
      'BRAVE_KEY',
      'BRAVE',
    ],
    BING_SEARCH_API_KEY: ['BING_SEARCH_API_KEY', 'BING_API_KEY', 'BING_KEY'],
    OPENAI_API_KEY: ['OPENAI_API_KEY'],
  }

  const present: Record<string, boolean> = {}
  for (const [key, aliases] of Object.entries(keyAliases)) {
    present[key] = aliases.some((n) => Boolean(process.env[n] && process.env[n]!.trim()))
  }

  // Names (not values) of env vars that resemble a search key — reveals typos
  // such as BRAVE_API_KEY or a stray space in the variable name.
  const searchLike = Object.keys(process.env)
    .filter((n) => /brave|serp|bing|search/i.test(n))
    .sort()

  const activeProvider = present.SERPAPI_KEY
    ? 'serpapi'
    : present.BRAVE_SEARCH_API_KEY
    ? 'brave'
    : present.BING_SEARCH_API_KEY
    ? 'bing'
    : 'duckduckgo (no API key detected — this is why search fails on Vercel)'

  return NextResponse.json({
    activeProvider,
    keysDetected: present,
    searchRelatedEnvVarNames: searchLike,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    note: 'Values are never shown. If BRAVE_SEARCH_API_KEY is false, the key is not in this (Production) environment or its name differs.',
  })
}
