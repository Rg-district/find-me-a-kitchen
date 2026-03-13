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
    
    // Send welcome + results email
    await getResend().emails.send({
      from: 'Find Me a Kitchen <noreply@findmeakitchen.com>',
      to: email,
      subject: 'Welcome! Your Kitchen Recommendations Are Here 🍳',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Logo placeholder -->
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #059669; margin: 0; font-size: 24px;">🍳 Find Me a Kitchen</h1>
          </div>
          
          <h2 style="color: #111; margin-bottom: 8px;">Welcome!</h2>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Thanks for using Find Me a Kitchen — you're now part of the UK's smartest kitchen finder community.
          </p>
          
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            We've matched you with the best options based on your needs. Here are your personalized recommendations:
          </p>
          
          ${recommendation ? `
            <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-style: italic; color: #166534;">${recommendation}</p>
            </div>
          ` : ''}
          
          <h3 style="color: #111; margin-top: 32px; margin-bottom: 16px;">Your Top Matches</h3>
          ${resultsHtml || '<p>View your results at findmeakitchen.com</p>'}
          
          <div style="background: #fafafa; padding: 20px; border-radius: 12px; margin-top: 32px;">
            <p style="font-size: 15px; color: #333; margin: 0 0 12px 0; font-weight: 600;">What's next?</p>
            <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
              <li>Visit the provider websites to learn more</li>
              <li><a href="https://findmeakitchen.com/kitchen-checklist" style="color: #059669;">Download our Questions to Ask Checklist</a></li>
              <li>Reply to this email anytime — we're here to help</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <div style="text-align: center;">
            <p style="color: #059669; font-weight: bold; font-size: 16px; margin-bottom: 4px;">Find Me a Kitchen</p>
            <p style="color: #888; font-size: 12px; margin: 0;">The UK's smartest kitchen finder</p>
            <p style="color: #aaa; font-size: 11px; margin-top: 16px;">
              <a href="https://findmeakitchen.com" style="color: #059669;">findmeakitchen.com</a>
            </p>
          </div>
        </div>
      `
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Email save error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
