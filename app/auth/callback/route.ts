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
        // Check if profile exists
        const { data: profile } = await supabase.from('profiles').select('id, onboarding_complete, trial_ends_at').eq('id', user.id).single()
        
        let isComplete = false;

        if (!profile) {
          // First time — create profile
          const trialEndsAt = new Date()
          trialEndsAt.setDate(trialEndsAt.getDate() + 14)
          
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            trial_ends_at: trialEndsAt.toISOString(),
            onboarding_complete: false,
            active: true,
            created_at: new Date().toISOString(),
            last_login_at: new Date().toISOString()
          })
        } else {
          // Existing user
          isComplete = !!profile.onboarding_complete;
          const updates: any = { last_login_at: new Date().toISOString() }
          
          if (!profile.trial_ends_at) {
            const trialEndsAt = new Date()
            trialEndsAt.setDate(trialEndsAt.getDate() + 14)
            updates.trial_ends_at = trialEndsAt.toISOString()
            updates.active = true
          }
          
          await supabase.from('profiles').update(updates).eq('id', user.id)
        }

        const redirectUrl = isComplete ? `${origin}${next}` : `${origin}/dashboard/onboarding`
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`)
}
