import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Uses @supabase/ssr createBrowserClient which persists the session in
 * both localStorage AND cookies — required for the middleware to read
 * the session server-side without prompting re-login.
 *
 * Fallback empty strings prevent the Supabase SDK from throwing during
 * Vercel's build-time page pre-rendering. The resulting client is inert
 * and never used — real requests only happen client-side where Next.js
 * inlines the actual NEXT_PUBLIC_* values.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
);

