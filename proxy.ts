import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get the current user session
  const { data: { user } } = await supabase.auth.getUser()

  // Protect /dashboard and /auth routes
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAuth = request.nextUrl.pathname.startsWith('/auth')
  const isOnboarding = request.nextUrl.pathname === '/dashboard/onboarding'

  if (isDashboard && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access an auth page (except logout/callback/terms), redirect to dashboard
  if (isAuth && user && !request.nextUrl.pathname.includes('/callback') && request.nextUrl.pathname !== '/auth/logout' && request.nextUrl.pathname !== '/auth/terms') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Profile-level validation logic for Dashboard access
  if (isDashboard && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, active, trial_ends_at, onboarding_complete, accepted_tos')
      .eq('id', user.id)
      .single()

    if (profile) {
      // 1. Check if billing/trial is expired
      // A user is required to upgrade if `active = false` and their trial has expired.
      const isTrialExpired = profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date()
      
      // If plan is 'cancelled' but plan_expires_at is active, profile.active will still be boolean logic but we just check `active`
      // For single-plan, if it's strictly null and trial expired, force pricing.
      if (!profile.active && (!profile.plan || profile.plan === 'trial' || profile.plan === 'cancelled') && isTrialExpired) {
        const url = request.nextUrl.clone()
        url.pathname = '/pricing'
        return NextResponse.redirect(url)
      }

      // 2. Check if T&C has been accepted (missing for Google OAuth first logins)
      // We will redirect them to a quick T&C acceptance page before anything else
      if (!profile.accepted_tos && request.nextUrl.pathname !== '/auth/terms') {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/terms'
        return NextResponse.redirect(url)
      }

      // 3. Check if onboarding is complete
      if (!isOnboarding && request.nextUrl.pathname !== '/auth/terms') {
        if (!profile.onboarding_complete) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/onboarding'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
