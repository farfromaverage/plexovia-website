"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

/**
 * /auth/callback — Client-side OAuth callback handler.
 *
 * Why client-side (not a Route Handler):
 * The Supabase client uses PKCE during signInWithOAuth. The code verifier is
 * stored in the BROWSER (localStorage). A server-side Route Handler creates a
 * fresh Supabase client with no access to the verifier, so exchangeCodeForSession
 * always fails with "invalid grant" or similar.
 *
 * Running this page in the browser gives the Supabase client access to its own
 * stored verifier, so the exchange succeeds and the session is persisted locally.
 */
function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    async function exchange() {
      const code = params.get("code");

      if (!code) {
        // No code — might be a hash-based implicit flow, let Supabase handle it
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/dashboard");
        } else {
          setErrMsg("No authorization code received from Google.");
          setStatus("error");
        }
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[auth/callback] exchangeCodeForSession error:", error.message);
        setErrMsg(error.message);
        setStatus("error");
        // Redirect to login after 2s so the user isn't stuck
        setTimeout(() => router.replace("/auth/login?error=oauth_failed"), 2000);
        return;
      }

      // Success — redirect to dashboard
      router.replace("/dashboard");
    }

    exchange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") {
    return (
      <div style={page}>
        <div style={card}>
          <p style={{ color: "#F87171", fontWeight: 600, fontSize: "0.9375rem", margin: 0 }}>
            Sign-in failed
          </p>
          <p style={{ color: "#6B6560", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
            {errMsg || "Something went wrong. Redirecting you back…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={card}>
        <Loader2 size={28} color="#C9A84C" style={{ animation: "spin 0.8s linear infinite" }} />
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
    <Suspense fallback={
      <div style={page}>
        <div style={card}>
          <Loader2 size={28} color="#C9A84C" style={{ animation: "spin 0.8s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
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
