import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

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
        <p><strong>From:</strong> ${name} (${user.email})</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Support API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
