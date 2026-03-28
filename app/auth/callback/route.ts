import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith(name + '='))?.split('=')[1]
          },
          set(name: string, value: string, options: CookieOptions) {
            // we leave the response cookie setting to the middleware/response handlers downstream
            // but the serverClient requires this to be defined.
            // In App Router, we actually return the NextResponse with the cookies set.
          },
          remove(name: string, options: CookieOptions) {
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
            // Ensure they're marked active
            active: true
          }).eq('id', user.id)
        }
      }
    }
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`)
}
