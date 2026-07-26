/**
 * Optional LLM verification.
 *
 * The heuristic detector is fast and keyless, but "the page discusses crypto
 * wallets even if it never says the exact words" is ultimately a semantic
 * judgement. When enabled (and OPENAI_API_KEY is set) we ask the model to make
 * that call and to quote the exact sentences it based the decision on, so the
 * agent can point to "exactly where crypto wallets are mentioned".
 */

import OpenAI from 'openai'

export type LlmVerdict = {
  discussesCryptoWallets: boolean
  reason: string
  quotes: string[]
}

const SYSTEM = `You are a precise content classifier. You are given the text of a single web page.
Decide whether the page genuinely DISCUSSES cryptocurrency wallets — software or hardware tools that store crypto keys and let people hold, send, or receive cryptocurrency (e.g. MetaMask, Ledger, seed phrases, self-custody, hot/cold wallets, wallet addresses).

Rules:
- The page does NOT need to use the exact phrase "crypto wallet". Judge the meaning.
- A page merely mentioning "wallet" in a non-crypto sense (leather wallet, Apple Wallet passes, digital gift-card wallet) does NOT count.
- A passing one-word reference with no real discussion should be judged false.
- Quote the EXACT sentences from the page that discuss crypto wallets (verbatim, max 5).

Respond with strict JSON: {"discussesCryptoWallets": boolean, "reason": string, "quotes": string[]}`

export async function verifyWithLLM(
  pageTitle: string,
  pageText: string,
  model = process.env.CRYPTO_AGENT_LLM_MODEL || 'gpt-4o-mini'
): Promise<LlmVerdict> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set; cannot run LLM verification')

  const openai = new OpenAI({ apiKey })

  // Keep the prompt bounded; the head of a page is where topical framing lives.
  const excerpt = pageText.slice(0, 12000)

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `PAGE TITLE: ${pageTitle}\n\nPAGE TEXT:\n${excerpt}`,
      },
    ],
    max_tokens: 600,
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = {}
  }

  return {
    discussesCryptoWallets: Boolean(parsed.discussesCryptoWallets),
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    quotes: Array.isArray(parsed.quotes)
      ? parsed.quotes.filter((q: unknown) => typeof q === 'string').slice(0, 5)
      : [],
  }
}
