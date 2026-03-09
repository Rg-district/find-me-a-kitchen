export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { site, page, rating, message, email } = await req.json()

    const { error } = await supabase
      .from('feedback')
      .insert({
        site,
        page,
        rating,
        message,
        email: email || null,
      })

    if (error) {
      console.error('Feedback error:', error)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Feedback API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
