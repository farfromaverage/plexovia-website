import { supabase } from "@/lib/supabase";

export async function engineFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs = 15000,
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
    return fetch(path, { ...options, headers, signal: fetchSignal });
  } finally {
    clearTimeout(timer);
  }
}
