import { NextRequest } from 'next/server'
import { streamCryptoWalletSearch } from '@/lib/crypto-wallet-agent'
import type { AgentOptions, SearchProviderName } from '@/lib/crypto-wallet-agent'

// Streams progress while the agent works through each link.
export const maxDuration = 120
export const dynamic = 'force-dynamic'

const VALID_PROVIDERS: SearchProviderName[] = ['serpapi', 'brave', 'bing', 'duckduckgo']

/**
 * POST /api/crypto-wallet-search/stream
 * Body: AgentOptions. Responds with newline-delimited JSON (NDJSON), one
 * StreamEvent per line, flushed as the agent progresses.
 */
export async function POST(req: NextRequest) {
  let body: Partial<AgentOptions>
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON body', 400)
  }

  if (!body.query || !body.query.trim()) {
    return jsonError('"query" is required', 400)
  }

  const opts: AgentOptions = {
    query: body.query,
    maxResults: clamp(body.maxResults, 10, 1, 25),
    onlyMatches: false, // the dashboard decides what to show; stream everything
    useLLM: body.useLLM === true,
    minConfidence: clamp(body.minConfidence, 0.5, 0, 1),
    concurrency: clamp(body.concurrency, 5, 1, 10),
    fetchTimeoutMs: clamp(body.fetchTimeoutMs, 15000, 2000, 60000),
    provider:
      body.provider && VALID_PROVIDERS.includes(body.provider) ? body.provider : undefined,
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))
      try {
        for await (const event of streamCryptoWalletSearch(opts)) {
          send(event)
        }
      } catch (err) {
        send({ type: 'error', error: err instanceof Error ? err.message : 'Agent failed' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disable proxy buffering (e.g. nginx) so events flush promptly.
      'X-Accel-Buffering': 'no',
    },
  })
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function clamp(v: number | undefined, def: number, min: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def
}
