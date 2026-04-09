"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "plexovia_cookies_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't responded yet
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Delay appearance so it doesn't compete with first paint
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: "0 1rem 1rem",
        pointerEvents: "none",
        animation: "cookieSlideUp 0.4s ease-out forwards",
      }}
    >
      <div
        style={{
          maxWidth: "620px",
          margin: "0 auto",
          background: "#111110",
          border: "1px solid #2A2926",
          borderRadius: "14px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.25)",
          pointerEvents: "auto",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        }}
      >
        {/* Text */}
        <p
          style={{
            flex: 1,
            minWidth: 200,
            fontSize: "0.8125rem",
            color: "#A8A29E",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          We use essential cookies to keep you signed in and measure basic
          performance. No advertising trackers.{" "}
          <Link
            href="/legal/cookies"
            style={{
              color: "#C9A84C",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            }}
          >
            Cookie Policy
          </Link>
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <button
            onClick={decline}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              border: "1px solid #3A3835",
              background: "transparent",
              color: "#8A8580",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#5A5855";
              (e.currentTarget as HTMLButtonElement).style.color = "#E2DDD6";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#3A3835";
              (e.currentTarget as HTMLButtonElement).style.color = "#8A8580";
            }}
          >
            Decline
          </button>
          <button
            onClick={accept}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#C9A84C",
              color: "#1C1917",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#D4B95F";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#C9A84C";
            }}
          >
            Accept
          </button>
        </div>

        {/* Close X */}
        <button
          onClick={decline}
          aria-label="Close cookie banner"
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            background: "none",
            border: "none",
            color: "#5A5855",
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          <X size={14} />
        </button>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
