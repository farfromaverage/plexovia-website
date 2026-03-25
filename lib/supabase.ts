import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client.
 * Uses @supabase/ssr createBrowserClient which persists the session in
 * both localStorage AND cookies — required for the middleware to read
 * the session server-side without prompting re-login.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnon);
