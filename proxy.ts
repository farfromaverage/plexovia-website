import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Plexovia — Server-Side Route Protection Middleware
 *
 * Protects all /dashboard routes at the Edge, before any page renders.
 * No client-side flash of protected content. No race conditions.
 *
 * Rules:
 *   /dashboard/* → requires valid session → redirect to /auth/login if not authenticated
 *   /auth/*      → if already logged in, redirect to /dashboard (no re-login)
 *   everything else → pass through
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log("==== PROXY.TS INTERCEPTED: ", pathname, "====");

  // Create a response we can modify headers on
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Build Supabase SSR client using cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session — this also rotates the session cookie if expired
  const { data: { session } } = await supabase.auth.getSession()

  // ── Protect /dashboard routes ────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      // Not logged in → redirect to login, preserve intended URL as next param
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Logged in → Check onboarding and trial limits (except when explicitly on those pages)
    if (pathname !== '/dashboard/onboarding' && pathname !== '/dashboard/billing' && pathname !== '/pricing') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, trial_ends_at, onboarding_complete')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        // 1. Check if onboarding is complete
        if (!profile.onboarding_complete) {
          return NextResponse.redirect(new URL('/dashboard/onboarding', request.url))
        }

        // 2. Check if trial expired and no plan mapping to an active subscription
        // TEMPORARILY DISABLED: Phase 2D (Billing) is skipped for now, so we do not want to hard-block 
        // users from the dashboard if they can't upgrade.
        /*
        if (!profile.plan || profile.plan === 'cancelled' || profile.plan === 'trial') {
          const trialEnds = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
          if (!trialEnds || trialEnds < new Date()) {
            return NextResponse.redirect(new URL('/pricing', request.url))
          }
        }
        */
      }
    }
    
    // Logged in and valid -> continue to dashboard
    return response
  }

  // ── Redirect logged-in users away from auth pages ────────────────────────────
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup') || pathname.startsWith('/auth/forgot-password') || pathname.startsWith('/auth/reset-password')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on dashboard and auth routes only.
     * Exclude: _next/static, _next/image, favicon, public files
     */
    '/dashboard/:path*',
    '/auth/login',
    '/auth/signup',
  ],
}
