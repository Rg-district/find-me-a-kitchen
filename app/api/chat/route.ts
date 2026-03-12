import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Provider knowledge base for accurate answers
const PROVIDER_KNOWLEDGE: Record<string, {
  contractTerms?: string
  setupTime?: string
  whatToExpect?: string
  hiddenCosts?: string
  bestFor?: string
  notIdealFor?: string
}> = {
  'karma-kitchen': {
    contractTerms: 'Minimum 3-month contracts typical, with flexible options for longer commitments',
    setupTime: '2-4 weeks from viewing to launch',
    whatToExpect: 'Fully equipped private kitchen unit, delivery app integrations, shared back-of-house',
    hiddenCosts: 'Delivery platform commissions (15-30%), packaging costs, deep cleaning fees',
    bestFor: 'Delivery-focused brands doing 50+ orders/day',
    notIdealFor: 'Very small startups testing concepts, anyone needing customer-facing space'
  },
  'foodstars': {
    contractTerms: 'Rolling monthly contracts available, discounts for 6-12 month commitments',
    setupTime: '1-3 weeks depending on location availability',
    whatToExpect: 'Basic kitchen shell, you provide some equipment, delivery platform partnerships',
    hiddenCosts: 'Equipment rental/purchase, packaging, utility overages',
    bestFor: 'Brands already on delivery platforms wanting multiple locations',
    notIdealFor: 'First-time operators with no delivery experience'
  },
  'mission-kitchen': {
    contractTerms: 'Hourly booking with membership options for regular users',
    setupTime: 'Can start same week with training',
    whatToExpect: 'Professional shared space, community of food entrepreneurs, business support',
    hiddenCosts: 'Minimal - pricing is transparent and all-inclusive',
    bestFor: 'Home bakers scaling up, catering startups, food entrepreneurs building a brand',
    notIdealFor: 'High-volume operations needing dedicated space 24/7'
  },
  'dephna': {
    contractTerms: 'Flexible terms, month-to-month available',
    setupTime: '2-4 weeks',
    whatToExpect: 'Established provider since 1972, 8 London locations, professional facilities',
    hiddenCosts: 'Standard utilities, some equipment may be additional',
    bestFor: 'Established brands wanting reliability and professionalism',
    notIdealFor: 'Budget-conscious startups'
  }
}

// System prompt for the kitchen advisor
const SYSTEM_PROMPT = `You are a friendly, knowledgeable kitchen space advisor for Find Me a Kitchen (findmeakitchen.com). 

Your role:
- Help users understand their matched results and make the right choice
- Answer questions about specific providers, pricing, contracts, and the commercial kitchen industry
- Be genuinely helpful, conversational, and direct — not salesy or generic
- If you don't know something specific, say so and offer to connect them with our team

Key rules:
- NEVER mention "AI", "language model", or that you're automated
- Speak as "we" when referring to Find Me a Kitchen
- Keep responses concise (2-4 sentences typically, longer only when detail is needed)
- If a question is complex or needs provider-specific details you don't have, suggest emailing hello@findmeakitchen.com
- Be honest about limitations — don't make up specific numbers or contract terms

Knowledge you have:
- General commercial kitchen industry knowledge
- Dark kitchen vs shared kitchen pros/cons
- Mobile unit business considerations
- Typical pricing ranges and what affects them
- Common hidden costs and what to watch for
- Questions users should ask providers

You're chatting with someone who just received their kitchen recommendations. Help them take the next step.`

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory, userContext, matchedProviders } = await req.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }
    
    // Build context about the user and their results
    let contextMessage = ''
    
    if (userContext) {
      contextMessage += `\n\nUser's profile:
- Location: ${userContext.location || 'Not specified'}
- Business type: ${userContext.businessType || 'Not specified'}
- Budget: ${userContext.budget || 'Not specified'}
- Scale: ${userContext.scale || 'Not specified'}
- Cuisines: ${userContext.cuisines?.join(', ') || 'Not specified'}`
    }
    
    if (matchedProviders && matchedProviders.length > 0) {
      contextMessage += `\n\nTheir top matched providers:`
      matchedProviders.slice(0, 3).forEach((p: any, i: number) => {
        contextMessage += `\n${i + 1}. ${p.name} (${p.matchPercent}% match) - ${p.type.replace('_', ' ')} - ${p.priceMin ? `from £${p.priceMin}/${p.priceUnit}` : 'Contact for pricing'}`
        
        // Add specific knowledge if we have it
        const knowledge = PROVIDER_KNOWLEDGE[p.id]
        if (knowledge) {
          contextMessage += `\n   Contract terms: ${knowledge.contractTerms}`
          contextMessage += `\n   Best for: ${knowledge.bestFor}`
          contextMessage += `\n   Watch out for: ${knowledge.hiddenCosts}`
        }
      })
    }
    
    // Build conversation messages
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextMessage }
    ]
    
    // Add conversation history (last 10 messages max)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10)
      recentHistory.forEach((msg: { role: string; content: string }) => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      })
    }
    
    // Add current message
    messages.push({ role: 'user', content: message })
    
    // Generate response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 500
    })
    
    const response = completion.choices[0]?.message?.content || ''
    
    // Check if we should suggest email follow-up
    const complexTopics = [
      'negotiate', 'contract details', 'specific availability', 
      'book a viewing', 'speak to someone', 'call', 'phone',
      'legal', 'insurance', 'licensing'
    ]
    const shouldSuggestEmail = complexTopics.some(topic => 
      message.toLowerCase().includes(topic)
    )
    
    return NextResponse.json({
      response,
      suggestEmail: shouldSuggestEmail
    })
    
  } catch (error) {
    console.error('Chat error:', error)
    
    // Fallback response
    return NextResponse.json({
      response: "I'm having trouble processing that right now. For immediate help, email us at hello@findmeakitchen.com and we'll get back to you within 24 hours.",
      suggestEmail: true
    })
  }
}
