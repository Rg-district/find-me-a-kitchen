import { NextRequest, NextResponse } from 'next/server'

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY!
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID!

export async function POST(req: NextRequest) {
  try {
    const { email, source = 'matcher', fields = {} } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Add subscriber to MailerLite
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        groups: [MAILERLITE_GROUP_ID],
        fields: {
          source,
          ...fields,
        },
        status: 'active',
      }),
    })

    const data = await res.json()

    if (!res.ok && res.status !== 200 && res.status !== 201) {
      // 409 = already subscribed — treat as success
      if (res.status === 409) {
        return NextResponse.json({ success: true, existing: true })
      }
      console.error('MailerLite error:', data)
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.data?.id })
  } catch (err) {
    console.error('Subscribe route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
