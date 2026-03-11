import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmuprcheuqnawtlzdyds.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: NextRequest) {
  try {
    const { matchId, email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    // Save email to match record
    if (matchId && !matchId.startsWith('temp_')) {
      await supabase
        .from('fmak_matches')
        .update({ user_email: email })
        .eq('id', matchId)
    }
    
    // Also save to separate email list for follow-ups (#14)
    await supabase
      .from('fmak_email_signups')
      .insert({
        email,
        match_id: matchId,
        signup_type: 'results_save',
        created_at: new Date().toISOString()
      })
    
    // TODO: Send email with results summary
    // TODO: Schedule 30-day follow-up email
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Email save error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
