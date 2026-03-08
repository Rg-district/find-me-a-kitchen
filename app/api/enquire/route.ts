export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kitchenId, name, email, phone, message } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('enquiries')
      .insert({
        kitchen_id: kitchenId || null,
        name,
        email,
        phone: phone || null,
        message: message || null,
      })

    if (error) {
      console.error('Enquiry insert error:', error)
      return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Enquire handler error:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
