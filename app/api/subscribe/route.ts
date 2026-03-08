import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const PLANS = {
  basic: {
    name: 'Kitchen Listed',
    price: 4900,
    description: 'List your kitchen and get matched with food businesses',
  },
  pro: {
    name: 'Kitchen Pro',
    price: 9900,
    description: 'Priority listing, featured placement, analytics dashboard',
  },
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
  })

  try {
    const { plan = 'basic', kitchenName, email, successUrl, cancelUrl } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS] || PLANS.basic

    const customers = await stripe.customers.list({ email, limit: 1 })
    let customer = customers.data[0]
    if (!customer) {
      customer = await stripe.customers.create({
        email,
        name: kitchenName || undefined,
        metadata: { source: 'findmeakitchen' },
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
              metadata: { plan, source: 'findmeakitchen' },
            },
            unit_amount: selectedPlan.price,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/list-kitchen/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/list-kitchen`,
      metadata: { kitchenName: kitchenName || '', plan },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Stripe error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
  })

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log(`✅ New subscription: ${session.customer_email} | plan: ${session.metadata?.plan}`)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    console.log(`❌ Subscription cancelled: ${sub.customer}`)
  }

  return NextResponse.json({ received: true })
}
