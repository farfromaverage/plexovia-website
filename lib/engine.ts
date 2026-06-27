import { supabase } from "@/lib/supabase";

async function _rawFetch(
  path: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        ({ data: { session } } = await supabase.auth.getSession());
      }
    }
    const headers = new Headers(options.headers);
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    // Combine caller's signal (for external cancel like search abort) with
    // the internal timeout signal. If either aborts, the fetch is cancelled.
    const signals: AbortSignal[] = [controller.signal];
    if (options.signal) signals.push(options.signal);
    const fetchSignal = signals.length === 1 ? signals[0] : AbortSignal.any(signals);
    // Route through the Next.js API proxy at /api/engine/[...path] instead of
    // Vercel rewrites. Vercel strips the Authorization header from rewrite-proxied
    // requests in production — the proxy explicitly forwards it to the backend.
    const proxyPath = path.replace(/^\/api\//, "/api/engine/");
    return fetch(proxyPath, { ...options, headers, signal: fetchSignal });
  } finally {
    clearTimeout(timer);
  }
}

export async function engineFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<Response> {
  let res = await _rawFetch(path, options, timeoutMs);

  // 401 means the access token may have expired. getSession() returns the
  // in-cookie session without validating token freshness. getUser() validates
  // the token against Supabase's server and triggers an automatic refresh if
  // the refresh token is still valid. Retry once with the refreshed session.
  if (res.status === 401) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      res = await _rawFetch(path, options, timeoutMs);
    }
  }
  return res;
}
