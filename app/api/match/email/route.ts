import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmuprcheuqnawtlzdyds.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Lazy init to avoid build-time errors
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function POST(req: NextRequest) {
  try {
    const { matchId, email, results, recommendation } = await req.json()
    
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
    
    // Save to email list for follow-ups
    await supabase
      .from('fmak_email_signups')
      .insert({
        email,
        match_id: matchId,
        signup_type: 'results_save',
        created_at: new Date().toISOString()
      })
    
    // Build results HTML
    let resultsHtml = ''
    if (results && results.length > 0) {
      resultsHtml = results.slice(0, 5).map((r: any, i: number) => `
        <div style="background: ${i === 0 ? '#ecfdf5' : '#f9fafb'}; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid ${i === 0 ? '#059669' : '#e5e7eb'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 16px;">${i === 0 ? '🏆 ' : ''}${r.name}</strong>
            <span style="background: #059669; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${r.matchPercent}% match</span>
          </div>
          <p style="color: #666; font-size: 14px; margin: 0;">${r.description || ''}</p>
          <p style="color: #059669; font-size: 14px; margin-top: 8px;">From £${r.priceMin}/${r.priceUnit}</p>
          ${r.website ? `<a href="${r.website}" style="color: #059669; font-size: 14px;">Visit website →</a>` : ''}
        </div>
      `).join('')
    }
    
    // Send results email
    await getResend().emails.send({
      from: 'Find Me a Kitchen <noreply@findmeakitchen.com>',
      to: email,
      subject: 'Your Kitchen Recommendations - Find Me a Kitchen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Your Kitchen Matches 🍳</h2>
          <p>Thanks for using Find Me a Kitchen! Here are your personalized recommendations:</p>
          
          ${recommendation ? `
            <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">${recommendation}</p>
            </div>
          ` : ''}
          
          <h3 style="color: #111; margin-top: 24px;">Your Top Matches</h3>
          ${resultsHtml || '<p>View your results at findmeakitchen.com</p>'}
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          
          <p style="font-size: 14px; color: #666;">
            <strong>What's next?</strong><br>
            • Visit the provider websites to learn more<br>
            • Download our <a href="https://findmeakitchen.com/kitchen-checklist" style="color: #059669;">Questions to Ask Checklist</a><br>
            • Reply to this email if you need help
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #059669; font-weight: bold;">Find Me a Kitchen</p>
          <p style="color: #666; font-size: 12px;">The UK's smartest kitchen finder</p>
        </div>
      `
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Email save error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
