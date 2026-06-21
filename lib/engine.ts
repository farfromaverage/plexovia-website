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
    // Preserve caller's signal if provided, otherwise use the internal timeout signal.
    // Fetch API accepts only one signal; the caller can pass one for external cancel (e.g. search abort).
    const fetchSignal = options.signal || controller.signal;
    return fetch(path, { ...options, headers, signal: fetchSignal });
  } finally {
    clearTimeout(timer);
  }
}
