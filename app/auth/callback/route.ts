import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
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
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    // We can also ensure trial_ends_at is set for new users:
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Safe check to setup trial if not done
        const { data: profile } = await supabase.from('profiles').select('trial_ends_at').eq('id', user.id).single()
        if (profile && !profile.trial_ends_at) {
          const trialEndsAt = new Date()
          trialEndsAt.setDate(trialEndsAt.getDate() + 7)
          
          await supabase.from('profiles').update({
            trial_ends_at: trialEndsAt.toISOString(),
            active: true
          }).eq('id', user.id)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`)
}
