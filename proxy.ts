import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  /* ── 1. Build a mutable response we can attach cookies to ── */
  let supabaseResponse = NextResponse.next({ request });

  /* ── 2. Create SSR Supabase client with cookie read/write ── */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request and the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /* ── 3. Refresh session (MUST come right after createServerClient) ── */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /* ── 4. Guard: /dashboard/* requires an active session ── */
  if (pathname.startsWith("/dashboard") && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    // Preserve intended destination so we can redirect back after login
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /* ── 5. Convenience: already logged in → skip auth pages ── */
  if (user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /* ── 6. Return the response (with refreshed session cookies) ── */
  return supabaseResponse;
}

/* Only run middleware on these paths — skip static assets + API routes */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/signup",
  ],
};
