"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Mail, ExternalLink, ArrowRight, Send, CheckCircle, AlertCircle } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   DigestPreview — Condensed email mockup for the homepage
   Shows exactly what the visitor will receive at 6 AM.
   Extracted from the How It Works page's full mockup for
   homepage conversion (audit item C4).
───────────────────────────────────────────────────────── */

export default function DigestPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [sampleEmail, setSampleEmail] = useState("");
  const [sampleStatus, setSampleStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sampleMsg, setSampleMsg] = useState("");

  async function handleSampleDigest(e: React.FormEvent) {
    e.preventDefault();
    if (!sampleEmail.trim()) return;
    setSampleStatus("loading");
    try {
      const res = await fetch("/api/sample-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sampleEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSampleStatus("success");
        setSampleMsg(data.message || "Sample digest sent. Check your inbox.");
        setSampleEmail("");
      } else {
        setSampleStatus("error");
        setSampleMsg(data.error || "Something went wrong.");
      }
    } catch {
      setSampleStatus("error");
      setSampleMsg("Network error. Please try again.");
    }
  }

  return (
    <section
      ref={ref}
      aria-label="Example contract digest"
      style={{
        backgroundColor: "var(--pub-surface-2)",
        borderTop:       "1px solid var(--pub-border)",
        padding:         "5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: "center", marginBottom: "2.5rem" }}
        >
          <span
            aria-hidden="true"
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           "0.375rem",
              fontFamily:    "var(--font-geist-mono), monospace",
              fontSize:      "0.6875rem",
              fontWeight:    500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color:         "var(--accent)",
              marginBottom:  "1rem",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", display: "block" }} />
            What You Receive
          </span>
          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.5rem, 2.5vw, 2rem)",
              letterSpacing: "-0.04em",
              color:         "var(--pub-text)",
              lineHeight:    1.15,
              marginBottom:  "0.75rem",
            }}
          >
            This is what lands in your inbox at 6 AM.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.9375rem",
              color:      "var(--pub-muted)",
              lineHeight: 1.65,
            }}
          >
            One entry from a real digest. Every match includes a score, an AI explanation, and a direct link.
          </p>
        </motion.div>

        {/* Mock email card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            backgroundColor: "var(--pub-bg)",
            border:          "1px solid var(--pub-border)",
            borderRadius:    "var(--radius-md)",
            overflow:        "hidden",
            boxShadow:       "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Email header */}
          <div
            style={{
              borderBottom:    "1px solid var(--pub-border)",
              padding:         "0.875rem 1.5rem",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "space-between",
              flexWrap:        "wrap",
              gap:             "0.5rem",
              backgroundColor: "var(--pub-surface-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Mail size={14} style={{ color: "var(--accent)" }} aria-hidden="true" />
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize:   "0.75rem",
                  color:      "var(--pub-muted)",
                  fontWeight: 500,
                }}
              >
                alerts@plexovia.com
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.8125rem",
                color:      "var(--pub-muted)",
                fontWeight: 500,
              }}
            >
              Your morning digest · 3 new matches · 6:00 AM
            </span>
          </div>

          {/* Contract match */}
          <div style={{ padding: "1.5rem 1.75rem" }}>
            {/* Title + score */}
            <div
              style={{
                display:        "flex",
                alignItems:     "flex-start",
                justifyContent: "space-between",
                gap:            "1.25rem",
                marginBottom:   "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily:    "var(--font-inter), sans-serif",
                    fontWeight:    700,
                    fontSize:      "0.9375rem",
                    letterSpacing: "-0.02em",
                    color:         "var(--pub-text)",
                    lineHeight:    1.3,
                    marginBottom:  "0.2rem",
                  }}
                >
                  IT Support Services: Department of Veterans Affairs
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize:   "0.7rem",
                    color:      "var(--pub-faint)",
                    fontWeight: 400,
                  }}
                >
                  Solicitation 36C24826R0041 · Northern Virginia and Maryland
                </p>
              </div>

              {/* Score circle */}
              <div
                style={{
                  flexShrink:      0,
                  display:         "flex",
                  flexDirection:   "column",
                  alignItems:      "center",
                  justifyContent:  "center",
                  width:           "60px",
                  height:          "60px",
                  borderRadius:    "50%",
                  border:          "2.5px solid var(--accent)",
                  backgroundColor: "rgba(201,168,76,0.08)",
                }}
              >
                <span
                  style={{
                    fontFamily:    "var(--font-inter), sans-serif",
                    fontWeight:    800,
                    fontSize:      "1.25rem",
                    letterSpacing: "-0.05em",
                    color:         "var(--accent)",
                    lineHeight:    1,
                  }}
                >
                  87
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontWeight: 400,
                    fontSize:   "0.625rem",
                    color:      "var(--pub-muted)",
                    lineHeight: 1,
                  }}
                >
                  /100
                </span>
              </div>
            </div>

            {/* AI explanation */}
            <div
              style={{
                backgroundColor: "rgba(201,168,76,0.05)",
                border:          "1px solid rgba(201,168,76,0.2)",
                borderRadius:    "8px",
                padding:         "0.875rem 1.125rem",
                marginBottom:    "1rem",
              }}
            >
              <p
                style={{
                  fontFamily:    "var(--font-geist-mono), monospace",
                  fontSize:      "0.625rem",
                  fontWeight:    600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color:         "var(--accent)",
                  marginBottom:  "0.375rem",
                }}
              >
                Why this scored 87
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize:   "0.85rem",
                  color:      "var(--pub-text)",
                  lineHeight: 1.65,
                }}
              >
                Primary NAICS 541512 matches solicitation record (strong signal). Place of performance
                is Maryland, your preferred state. SDVOSB set aside aligns with your certification on
                file. Deadline is 12 days out.
              </p>
            </div>

            {/* Metadata */}
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap:                 "0.625rem",
                marginBottom:        "1rem",
              }}
            >
              {[
                { label: "Agency",    value: "Dept. of Veterans Affairs" },
                { label: "Deadline",  value: "Apr 18, 2026"              },
                { label: "Set aside", value: "SDVOSB"                    },
                { label: "State",     value: "Maryland"                  },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: "var(--pub-surface)",
                    border:          "1px solid var(--pub-border)",
                    borderRadius:    "6px",
                    padding:         "0.5rem 0.75rem",
                  }}
                >
                  <p
                    style={{
                      fontFamily:    "var(--font-geist-mono), monospace",
                      fontSize:      "0.575rem",
                      fontWeight:    600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color:         "var(--pub-faint)",
                      marginBottom:  "0.15rem",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize:   "0.8125rem",
                      fontWeight: 600,
                      color:      "var(--pub-text)",
                      lineHeight: 1.3,
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Direct link */}
            <span
              style={{
                display:             "inline-flex",
                alignItems:          "center",
                gap:                 "0.375rem",
                fontFamily:          "var(--font-inter), sans-serif",
                fontSize:            "0.8125rem",
                fontWeight:          600,
                color:               "var(--accent)",
                textDecoration:      "underline",
                textUnderlineOffset: "3px",
                cursor:              "default",
              }}
            >
              View Solicitation on SAM.gov
              <ExternalLink size={12} aria-hidden="true" />
            </span>
          </div>

          {/* Footer bar */}
          <div
            style={{
              borderTop:       "1px solid var(--pub-border)",
              padding:         "0.75rem 1.5rem",
              backgroundColor: "var(--pub-surface-2)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "space-between",
              flexWrap:        "wrap",
              gap:             "0.5rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.75rem",
                color:      "var(--pub-muted)",
              }}
            >
              2 more matches in this digest · scores 74 and 61
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize:   "0.65rem",
                color:      "var(--pub-faint)",
              }}
            >
              example only · not a real solicitation
            </span>
          </div>
        </motion.div>

        {/* Sample digest email form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.25 }}
          style={{
            maxWidth: "480px",
            margin: "1.75rem auto 0",
            textAlign: "center",
          }}
        >
          {sampleStatus === "success" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.25)",
                borderRadius: "10px",
                fontSize: "0.875rem",
                color: "#4ADE80",
                fontWeight: 500,
                fontFamily: "var(--font-inter), sans-serif",
              }}
              role="status"
            >
              <CheckCircle size={15} aria-hidden="true" />
              {sampleMsg}
            </div>
          ) : (
            <>
              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "0.8125rem",
                  color: "var(--pub-muted)",
                  marginBottom: "0.75rem",
                }}
              >
                Want to see a real sample? Enter your email.
              </p>
              <form
                onSubmit={handleSampleDigest}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="email"
                  value={sampleEmail}
                  onChange={(e) => setSampleEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  style={{
                    flex: 1,
                    minWidth: 200,
                    maxWidth: 280,
                    padding: "0.625rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--pub-border)",
                    background: "var(--pub-bg)",
                    color: "var(--pub-text)",
                    fontSize: "0.875rem",
                    fontFamily: "var(--font-inter), sans-serif",
                    outline: "none",
                  }}
                  disabled={sampleStatus === "loading"}
                  aria-label="Email address for sample digest"
                />
                <button
                  type="submit"
                  disabled={sampleStatus === "loading" || !sampleEmail.trim()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--accent)",
                    color: "#1C1917",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: sampleStatus === "loading" ? "wait" : "pointer",
                    fontFamily: "var(--font-inter), sans-serif",
                    opacity: sampleStatus === "loading" ? 0.7 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  <Send size={13} aria-hidden="true" />
                  {sampleStatus === "loading" ? "Sending..." : "Get a sample"}
                </button>
              </form>
              {sampleStatus === "error" && (
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "#F87171",
                    marginTop: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.375rem",
                    fontFamily: "var(--font-inter), sans-serif",
                  }}
                  role="alert"
                >
                  <AlertCircle size={13} aria-hidden="true" />
                  {sampleMsg}
                </p>
              )}
            </>
          )}
        </motion.div>

        {/* CTA below mockup */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{ textAlign: "center", marginTop: "2rem" }}
        >
          <Link
            href="/auth/signup"
            id="digest-preview-cta"
            className="btn-gold"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            Get Your First Digest Tomorrow Morning
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <p
            style={{
              fontFamily:  "var(--font-inter), sans-serif",
              fontSize:    "0.75rem",
              color:       "var(--pub-faint)",
              marginTop:   "0.625rem",
            }}
          >
            7-day free trial. No charge until Day 8.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
