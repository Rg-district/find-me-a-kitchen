export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      businessName, kitchenName, kitchenType, address, postcode, city,
      capacity, pricePerDay, pricePerWeek, pricePerMonth, availableHours,
      equipment, contactName, contactEmail, contactPhone,
    } = body

    if (!kitchenName || !contactEmail || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('kitchen_listings')
      .insert({
        business_name: businessName,
        kitchen_name: kitchenName,
        kitchen_type: kitchenType,
        address,
        postcode,
        city,
        capacity: capacity ? parseInt(capacity) : null,
        price_per_day: pricePerDay ? parseFloat(pricePerDay) : null,
        price_per_week: pricePerWeek ? parseFloat(pricePerWeek) : null,
        price_per_month: pricePerMonth ? parseFloat(pricePerMonth) : null,
        available_hours: availableHours,
        equipment: equipment || [],
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('list-kitchen error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
