# Apex Mortgage Agent

An AI-powered mortgage advisor built with Next.js 14 and Claude (via the Anthropic SDK). Apex uses an agentic tool-use loop to compute exact mortgage figures rather than approximating — ensuring bank-grade accuracy for every response.

## Features

| Capability | Tool |
|---|---|
| Monthly payment calculation | `calculate_monthly_payment` |
| Affordability & DTI analysis | `check_affordability` |
| Loan type comparison (conventional / FHA / VA / jumbo) | `compare_loan_types` |
| Full amortization schedule | `generate_amortization_schedule` |
| Closing cost estimate | `estimate_closing_costs` |

## Getting Started

```bash
cd apex-mortgage-agent
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

npm install
npm run dev
# Open http://localhost:3001
```

## Architecture

```
apex-mortgage-agent/
├── app/
│   ├── api/chat/route.ts   # Agentic loop — resolves all tool calls server-side
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── chat-interface.tsx  # Chat UI with markdown rendering
└── lib/
    ├── agent-tools.ts       # Tool definitions + executeTool dispatcher
    └── mortgage-calculations.ts  # Pure financial math
```

The agent loop in `app/api/chat/route.ts` keeps calling Claude until it reaches `stop_reason: "end_turn"`, executing any intermediate tool calls via `executeTool`. The client only ever sees the final text response.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |

## Tech Stack

- **Next.js 14** (App Router)
- **Anthropic SDK** — Claude claude-sonnet-4-6 with tool use
- **Tailwind CSS**
- **TypeScript**
