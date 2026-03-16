import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

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
    const { name, email, subject, message, website } = await req.json()
    
    // Honeypot check - if 'website' field is filled, it's a bot
    if (website) {
      // Silently reject but return success to not alert bots
      console.log('Bot submission blocked:', { name, email })
      return NextResponse.json({ success: true })
    }
    
    // Basic spam detection - reject gibberish names/messages
    const looksLikeSpam = (text: string) => {
      if (!text) return false
      // Random string pattern: mostly consonants, no spaces, unusual length
      const noSpaces = !text.includes(' ')
      const tooManyConsonants = (text.match(/[bcdfghjklmnpqrstvwxz]/gi) || []).length > text.length * 0.7
      const suspiciousLength = text.length > 15 && noSpaces
      return suspiciousLength && tooManyConsonants
    }
    
    if (looksLikeSpam(name) || looksLikeSpam(message)) {
      console.log('Spam submission blocked:', { name, email })
      return NextResponse.json({ success: true }) // Silent rejection
    }
    
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const subjectLabels: Record<string, string> = {
      'general': 'General Enquiry',
      'kitchen-listing': 'Kitchen Listing',
      'partnership': 'Partnership',
      'support': 'Support'
    }
    
    // Send to help@findmeakitchen.com
    await getResend().emails.send({
      from: 'Find Me a Kitchen <noreply@findmeakitchen.com>',
      to: 'help@findmeakitchen.com',
      replyTo: email,
      subject: `[FMAK] ${subjectLabels[subject] || 'Contact Form'}: ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subjectLabels[subject] || subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Sent via findmeakitchen.com contact form</p>
      `
    })
    
    // Send confirmation to user
    await getResend().emails.send({
      from: 'Find Me a Kitchen <noreply@findmeakitchen.com>',
      to: email,
      subject: 'We received your message - Find Me a Kitchen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Thanks for reaching out, ${name}!</h2>
          <p>We've received your message and will get back to you within 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p><strong>Your message:</strong></p>
          <p style="background: #f3f4f6; padding: 16px; border-radius: 8px;">${message.replace(/\n/g, '<br>')}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #059669; font-weight: bold;">Find Me a Kitchen</p>
          <p style="color: #666; font-size: 12px;">The UK's smartest kitchen finder</p>
        </div>
      `
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
