import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_invite`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {}
        },
      },
    }
  )

  const { data: invite } = await supabase
    .from('team_profiles')
    .select('*, profiles!org_id(email)')
    .eq('invite_token', token)
    .single()

  if (!invite) return NextResponse.redirect(`${origin}/auth/login?error=invalid_invite`)
  
  if (new Date(invite.invite_expires_at) < new Date()) {
    return NextResponse.redirect(`${origin}/auth/login?error=expired_invite`)
  }
  
  if (invite.status !== 'pending') {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Store invite token in cookie for post-auth completion
  cookieStore.set('plexovia_invite', token, { maxAge: 60 * 60 * 24 * 7, path: '/' })

  return NextResponse.redirect(`${origin}/auth/signup?invite=${token}`)
}
