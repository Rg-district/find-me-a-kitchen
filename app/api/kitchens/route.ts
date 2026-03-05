import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')

  let query = supabaseAdmin
    .from('kitchens')
    .select('id, name, city, area, postcode, type, price_per_hour, price_per_month, min_hours, max_capacity, equipment, certifications, operating_hours, available_shifts, storage, delivery_platforms, food_types, website, description, features, rating, review_count, verified, listing_active')
    .eq('listing_active', true)
    .order('rating', { ascending: false })

  if (city) query = query.ilike('city', city)

  const { data, error } = await query

  if (error) {
    console.error('Kitchens fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch kitchens' }, { status: 500 })
  }

  return NextResponse.json({ kitchens: data ?? [], total: data?.length ?? 0 })
}
