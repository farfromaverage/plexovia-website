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
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
    // Logged in → continue to dashboard
    return response
  }

  // ── Redirect logged-in users away from auth pages ────────────────────────────
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) {
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
