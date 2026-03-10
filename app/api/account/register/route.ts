import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmuprcheuqnawtlzdyds.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, location, businessName, wantsAlerts, accountType } = body

    // Validate required fields
    if (!name || !email || !location) {
      return NextResponse.json(
        { error: 'Name, email, and location are required' }, 
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('fmak_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' }, 
        { status: 400 }
      )
    }

    // Create user
    const { data, error } = await supabase
      .from('fmak_users')
      .insert({
        name,
        email: email.toLowerCase(),
        location,
        business_name: businessName || null,
        wants_alerts: wantsAlerts || false,
        account_type: accountType || 'seeker',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      
      // If table doesn't exist, try to create it
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Database setup required. Please contact support.' }, 
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create account' }, 
        { status: 500 }
      )
    }

    // TODO: Send welcome email via Resend if wantsAlerts is true

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId: data.id,
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    )
  }
}
