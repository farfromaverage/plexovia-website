"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   FinalCTA — Full-width dark closing band
   Background: #111110 (deep warm near-black)
   Headline: Inter 800, off-white — maximum authority
   Button: Parchment (#F7F5F0) + #1C1917 text
           Same zero-animation policy as btn-gold
   Copy: PAS closing — name the enemy, imply the fix
───────────────────────────────────────────────────────── */

export default function FinalCTA() {
  return (
    <section
      aria-label="Get started with Plexovia"
      style={{
        backgroundColor: "#111110",
        padding:         "6rem 1.5rem",
        textAlign:       "center",
        borderTop:       "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          aria-hidden="true"
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            "0.375rem",
            fontFamily:     "var(--font-geist-mono), monospace",
            fontSize:       "0.6875rem",
            fontWeight:     500,
            letterSpacing:  "0.09em",
            textTransform:  "uppercase",
            color:          "var(--accent)",
            marginBottom:   "1.5rem",
          }}
        >
          <span
            style={{
              width:  "5px",
              height: "5px",
              borderRadius:    "50%",
              backgroundColor: "var(--accent)",
              display:         "block",
              animation:       "pulse-gold 2.5s ease-in-out infinite",
            }}
          />
          7-day free trial
        </motion.span>

        {/* H2 — Inter 800, off-white, confrontational close */}
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            fontFamily:    "var(--font-inter), sans-serif",
            fontWeight:    800,
            fontSize:      "clamp(2rem, 4.5vw, 3.25rem)",
            letterSpacing: "-0.05em",
            lineHeight:    1.08,
            color:         "#F5F3EE",
            marginBottom:  "1.25rem",
          }}
        >
          Your competitor bid on Friday.
          <br />
          You found out Monday.
          <br />
          <span style={{ color: "var(--accent)" }}>Fix that tomorrow morning.</span>
        </motion.h2>

        {/* Supporting line */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize:   "1.0625rem",
            fontWeight: 400,
            lineHeight: 1.65,
            color:      "#8A8580",
            marginBottom: "2.25rem",
            maxWidth:   "560px",
            margin:     "0 auto 2.25rem",
          }}
        >
          Setup takes three minutes. No charge until Day 8.
          Your first scored digest arrives tomorrow morning.
        </motion.p>

        {/* CTA group */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, delay: 0.32 }}
          style={{
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            gap:            "1rem",
          }}
        >
          {/* Primary — parchment button on dark bg */}
          <Link
            href="/auth/signup"
            id="final-cta-btn"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.5rem",
              padding:         "0.875rem 2rem",
              borderRadius:    "var(--radius-pill)",
              backgroundColor: "#F7F5F0",
              color:           "#1C1917",
              fontFamily:      "var(--font-inter), sans-serif",
              fontSize:        "1rem",
              fontWeight:      600,
              letterSpacing:   "-0.01em",
              textDecoration:  "none",
              border:          "none",
              cursor:          "pointer",
              whiteSpace:      "nowrap",
              transition:      "opacity 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
            }}
          >
            Start Your Free 7-Day Trial
            <ArrowRight size={17} aria-hidden="true" />
          </Link>

          {/* Secondary — ghost text link */}
          <a
            href="#pricing"
            style={{
              fontFamily:     "var(--font-inter), sans-serif",
              fontSize:       "0.875rem",
              fontWeight:     400,
              color:          "#6B6560",
              textDecoration: "none",
              transition:     "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#8A8580";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#6B6560";
            }}
          >
            See what is included →
          </a>
        </motion.div>

      </div>
    </section>
  );
}
