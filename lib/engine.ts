import { supabase } from "@/lib/supabase";

export async function engineFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
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
  return fetch(path, { ...options, headers });
}
