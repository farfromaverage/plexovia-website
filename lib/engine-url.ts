/**
 * Plexovia — Single source of truth for backend engine URL resolution.
 *
 * Used by:
 *   - next.config.ts rewrites (inlined copy — keep in sync)
 *   - app/api/engine-stats/route.ts
 *   - app/api/onboarding/first-login/route.ts
 *
 * Resolution chain (first non-empty wins):
 *   1. INTERNAL_ENGINE_URL  — explicit override (legacy compat)
 *   2. RAILWAY_API_URL      — primary Railway service URL (set by Vercel env)
 *   3. NEXT_PUBLIC_RAILWAY_API_URL — fallback public var
 *   4. dev → http://localhost:8000 | prod → https://engine.plexovia.com
 */
export function getEngineUrl(): string {
  return (
    process.env.INTERNAL_ENGINE_URL
    || process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || (process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "https://engine.plexovia.com")
  );
}
