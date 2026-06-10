import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[support] RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }
    const resend = new Resend(apiKey)

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate Limiting (5 per hour)
    const now = Date.now()
    const record = rateLimitMap.get(user.id)
    if (record) {
      if (now < record.resetAt) {
        if (record.count >= 5) {
          return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
        }
        record.count += 1
      } else {
        rateLimitMap.set(user.id, { count: 1, resetAt: now + 3600 * 1000 })
      }
    } else {
      rateLimitMap.set(user.id, { count: 1, resetAt: now + 3600 * 1000 })
    }

    const { subject, message, name } = await req.json()
    if (!subject || !message || message.length < 20) {
      return NextResponse.json({ error: 'Message must be at least 20 characters.' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Plexovia Alerts <alerts@plexovia.com>',
      to: 'support@plexovia.com',
      replyTo: user.email,
      subject: `Support Request: ${subject}`,
      html: `
        <h3>New Support Request</h3>
        <p><strong>From:</strong> ${escapeHtml(name)} (${user.email})</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <hr />
        <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Support API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
