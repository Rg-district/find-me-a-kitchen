export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: kitchen, error } = await supabase
      .from('kitchen_listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Kitchen not found' }, { status: 404 })
    }

    return NextResponse.json({ kitchen })
  } catch (err) {
    console.error('kitchen API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
