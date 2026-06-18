import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ProfileUpdate {
  last_login_at: string
  trial_ends_at?: string
  active?: boolean
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[auth/callback] code exchange failed:', error.message)
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[auth/callback] no user after code exchange')
    return NextResponse.redirect(`${origin}/auth/login?error=no_user`)
  }

  const { data: profile, error: profileQueryError } = await supabase
    .from('profiles')
    .select('id, onboarding_complete, trial_ends_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profileQueryError) {
    console.error('[auth/callback] profile query error:', profileQueryError)
  }

  let isComplete = false

  if (!profile) {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      trial_ends_at: trialEndsAt.toISOString(),
      onboarding_complete: false,
      active: true,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('[auth/callback] profile insert failed:', insertError.message)
    }
  } else {
    isComplete = !!profile.onboarding_complete
    const updates: ProfileUpdate = { last_login_at: new Date().toISOString() }

    if (!profile.trial_ends_at) {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)
      updates.trial_ends_at = trialEndsAt.toISOString()
      updates.active = true
    }

    const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (updateError) {
      console.error('[auth/callback] profile update failed:', updateError.message)
    }
  }

  const redirectUrl = isComplete ? `${origin}${next}` : `${origin}/dashboard/onboarding`
  return NextResponse.redirect(redirectUrl)
}
