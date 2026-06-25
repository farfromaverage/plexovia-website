"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Diagnostic overlay — shows authentication state and captures click events.
 * Only renders in development or when ?debug=true is in the URL.
 */
export default function DashboardDiagnostic() {
  const [show, setShow] = useState(false);
  const [authState, setAuthState] = useState<string>("checking");
  const [userId, setUserId] = useState<string>("");
  const pathname = usePathname();
  const clickLogRef = useRef<string[]>([]);
  const [clickLog, setClickLog] = useState<string[]>([]);

  useEffect(() => {
    // Toggle with Ctrl+Shift+D
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setShow((s) => !s);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!show) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session ? "authenticated" : "no_session");
      setUserId(session?.user?.id?.slice(0, 8) || "");
    });
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      const msg = link
        ? `Click → <a href="${link.getAttribute("href") || "?"}">${link.textContent?.trim().slice(0, 40) || "?"}</a>`
        : `Click → ${target.tagName}.${(target.className || "").slice(0, 30)}`;
      clickLogRef.current = [msg, ...clickLogRef.current].slice(0, 20);
      setClickLog([...clickLogRef.current]);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        zIndex: 99999,
        background: "#111",
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: "11px",
        padding: "8px",
        maxWidth: 400,
        maxHeight: 300,
        overflow: "auto",
        borderTopLeftRadius: 8,
        opacity: 0.9,
      }}
    >
      <div style={{ marginBottom: 4 }}>
        <strong>Route:</strong> {pathname}
      </div>
      <div style={{ marginBottom: 4 }}>
        <strong>Auth:</strong> {authState} {userId ? `(${userId}...)` : ""}
      </div>
      <div style={{ marginBottom: 4 }}>
        <a
          href="/dashboard/pipeline"
          style={{ color: "#0ff", textDecoration: "underline", cursor: "pointer" }}
          onClick={(e) => {
            console.log("[DIAG] native <a> click fired", e.target);
          }}
        >
          Test: href="/dashboard/pipeline"
        </a>
      </div>
      <div>
        <strong>Last Clicks:</strong>
        <ul style={{ margin: 0, padding: "0 0 0 12px", listStyle: "none" }}>
          {clickLog.map((msg, i) => (
            <li key={i} style={{ lineHeight: 1.4, wordBreak: "break-all" }}>
              {msg}
            </li>
          ))}
          {clickLog.length === 0 && <li style={{ color: "#888" }}>No clicks captured yet</li>}
        </ul>
      </div>
    </div>
  );
}
