import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Handles both:
 *  - Email confirmation redirects (code=xxx)
 *  - Google OAuth redirects (code=xxx, from Supabase OAuth flow)
 *
 * Supabase appends ?code=xxx to the redirectTo URL.
 * We exchange that PKCE code for a session, then send the user to /dashboard.
 *
 * NOTE: We use the service-role / anon key here only to exchange the code.
 * The actual session is set via the client-side supabase instance which
 * is hydrated by the ?code exchange. The redirect to /dashboard triggers
 * the client to re-read the session from the URL hash/fragment.
 *
 * For Google OAuth, Supabase handles the token exchange server-side and
 * returns a `code` that must be exchanged here. This route must be listed
 * as an allowed redirect URL in both:
 *   1. Supabase Auth → URL Configuration → Redirect URLs: https://plexovia.com/auth/callback
 *   2. Google Cloud Console → OAuth Client → Authorized redirect URIs:
 *      https://bgwgcemgiivqpyudsrrm.supabase.co/auth/v1/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to dashboard — the client Supabase listener will pick up
      // the session from the exchanged tokens automatically.
      const redirectUrl = new URL(`${origin}${next}`);
      return NextResponse.redirect(redirectUrl.toString());
    }

    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  // No code or exchange failed — redirect to login with error flag
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`);
}
