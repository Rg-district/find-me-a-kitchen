export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const { data: kitchens, error } = await getSupabase()
      .from('kitchen_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch kitchens' }, { status: 500 })
    }

    return NextResponse.json({ kitchens: kitchens || [] })
  } catch (err) {
    console.error('kitchens API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
