/**
 * Single source of truth for the Railway engine base URL.
 *
 * Used by:
 *   - next.config.ts (rewrites at build time)
 *   - app/api/onboarding/first-login/route.ts (server-side proxy)
 *   - app/api/engine-stats/route.ts (server-side proxy)
 *
 * Resolution order:
 *   1. RAILWAY_API_URL      — primary Railway URL (set in Vercel env by Railway integration)
 *   2. INTERNAL_ENGINE_URL  — explicit manual override (backward compat, use only if RAILWAY_API_URL absent)
 *   3. NEXT_PUBLIC_RAILWAY_API_URL — public variant (fallback)
 *   4. localhost:8000       — local development only
 *   5. engine.plexovia.com  — production custom domain
 */
export function getEngineUrl(): string {
  return (
    process.env.RAILWAY_API_URL
    || process.env.INTERNAL_ENGINE_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || (process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "https://engine.plexovia.com")
  );
}
