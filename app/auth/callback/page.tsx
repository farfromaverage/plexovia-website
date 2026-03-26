"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

/**
 * /auth/callback — OAuth callback page.
 *
 * Because the Supabase client uses @supabase/ssr (createBrowserClient),
 * it automatically detects the `code` in the URL and exchanges it on mount.
 * We must NOT call exchangeCodeForSession manually — doing so consumes/clears
 * the PKCE verifier from cookie storage, causing "verifier not found" errors.
 *
 * Instead, we simply listen for the auth state change event that fires after
 * the client completes the exchange on its own, then redirect to /dashboard.
 */
function CallbackInner() {
  const router = useRouter();

  useEffect(() => {
    // @supabase/ssr createBrowserClient auto-processes the ?code= param on mount.
    // Just listen for the session to be established and redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/dashboard");
      }
    });

    // Also check if a session already exists (e.g., code was already exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={page}>
      <div style={card}>
        <Loader2
          size={28}
          color="#C9A84C"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p style={{ color: "#A8A29E", fontSize: "0.9375rem", margin: "1rem 0 0" }}>
          Completing sign-in…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div style={page}>
          <div style={card}>
            <Loader2
              size={28}
              color="#C9A84C"
              style={{ animation: "spin 0.8s linear infinite" }}
            />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#1C1917",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--font-inter), sans-serif",
};

const card: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "2.5rem",
  background: "#252320",
  border: "1px solid #2D2A26",
  borderRadius: "16px",
  minWidth: "240px",
  textAlign: "center",
};
