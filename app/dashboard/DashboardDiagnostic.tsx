"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardDiagnostic() {
  const [show, setShow] = useState(false);
  const [authState, setAuthState] = useState<string>("checking");
  const [userId, setUserId] = useState<string>("");
  const pathname = usePathname();
  const logRef = useRef<string[]>([]);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "D") setShow((s) => !s);
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

  const addLog = (msg: string) => {
    logRef.current = [msg, ...logRef.current].slice(0, 30);
    setLog([...logRef.current]);
  };

  useEffect(() => {
    if (!show) return;
    // Capture ALL clicks — target element info
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const link = t.closest("a");
      if (link) {
        addLog(`CLICK <a href="${link.getAttribute("href")}">${link.textContent?.trim().slice(0, 30)}</a>`);
        addLog(`  defaultPrevented: ${e.defaultPrevented}`);
        addLog(`  pathname: ${pathname}`);
        addLog(`  altKey/ctrlKey/metaKey: ${e.altKey}/${e.ctrlKey}/${e.metaKey}`);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [show, pathname]);

  const testNative = () => {
    addLog("Testing native window.location...");
    window.location.href = "/dashboard/pipeline";
  };

  const testLinkClick = () => {
    addLog("Testing Next.js Link...");
    // We'll click a real Next.js Link programmatically
    document.querySelector<HTMLAnchorElement>('[href="/dashboard/pipeline"]')?.click();
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, right: 0, zIndex: 99999,
      background: "#111", color: "#0f0", fontFamily: "monospace",
      fontSize: "11px", padding: "8px", maxWidth: 450, maxHeight: 350,
      overflow: "auto", borderTopLeftRadius: 8, opacity: 0.95,
    }}>
      <div style={{ marginBottom: 4 }}><strong>Route:</strong> {pathname}</div>
      <div style={{ marginBottom: 4 }}><strong>Auth:</strong> {authState} {userId ? `(${userId})` : ""}</div>
      <div style={{ display: "flex", gap: "6px", marginBottom: 4 }}>
        <button onClick={testNative} style={{ background: "#0f0", color: "#000", border: "none", borderRadius: 3, padding: "2px 6px", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}>
          Test: window.location
        </button>
        <button onClick={testLinkClick} style={{ background: "#00f", color: "#fff", border: "none", borderRadius: 3, padding: "2px 6px", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}>
          Test: programmatic Link click
        </button>
      </div>
      <div><strong>Log:</strong></div>
      <ul style={{ margin: 0, padding: "0 0 0 10px", listStyle: "none" }}>
        {log.map((msg, i) => (
          <li key={i} style={{ lineHeight: 1.3, wordBreak: "break-all", color: msg.includes("prevented: true") ? "#f80" : "#0f0" }}>
            {msg}
          </li>
        ))}
        {log.length === 0 && <li style={{ color: "#888" }}>No events captured. Press Ctrl+Shift+D to toggle.</li>}
      </ul>
    </div>
  );
}
