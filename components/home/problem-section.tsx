"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeInUp, stagger } from "@/lib/motion";

/* ─────────────────────────────────────────────────────────
   ProblemSection — PAS Framework
   P: You're checking SAM.gov manually. Your competitor isn't.
   A: A bid posted Thursday. Their inbox Friday. You saw it Monday.
   S: Plexovia scans everything. Scored matches arrive by 6 AM.
───────────────────────────────────────────────────────── */

const PAINS = [
  {
    id:       "p1",
    stat:     "24,000+",
    unit:     "new opportunities posted to SAM.gov every month",
    headline: "No calendar. No alert. No email to you.",
    body:     "SAM.gov posts new solicitations daily. There is no calendar, no reminder, no email. By the time you log in and search, many have already passed their question deadline. A third of all bids close within 10 days of posting.",
  },
  {
    id:       "p2",
    stat:     "3 to 5",
    unit:     "portals your competitor checks weekly",
    headline: "While you're checking one",
    body:     "The average BD manager checks SAM.gov and maybe one state portal. Your competitor in the same NAICS code may be watching five. The gap shows up in win rates. It compounds every week.",
  },
  {
    id:       "p3",
    stat:     "50",
    unit:     "state portals",
    headline: "You're not monitoring",
    body:     "SAM.gov is federal only. Each state runs its own procurement system. Your competitor watches all 50. You're searching one source and calling it due diligence.",
  },
];

export default function ProblemSection() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      aria-label="The problem with manual contract searching"
      style={{
        backgroundColor: "var(--pub-surface-2)",
        borderTop:       "1px solid var(--pub-border)",
        padding:         "5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── Problem Statement ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ maxWidth: "720px", marginBottom: "3.5rem" }}
        >
          {/* Eyebrow */}
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
              marginBottom:  "1.25rem",
            }}
          >
            <span
              style={{
                width:           "6px",
                height:          "6px",
                borderRadius:    "50%",
                backgroundColor: "var(--accent)",
                display:         "block",
                flexShrink:      0,
              }}
            />
            The Problem
          </span>

          {/* H2 — confrontational, direct, Inter 700 */}
          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.875rem, 3.5vw, 2.875rem)",
              letterSpacing: "-0.04em",
              lineHeight:    1.1,
              color:         "var(--pub-text)",
              marginBottom:  "1.25rem",
            }}
          >
            You&apos;re checking SAM.gov manually.
            <br />
            Your competitor isn&apos;t.
          </h2>

          {/* Agitate — specific and personal */}
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "1.125rem",
              fontWeight: 400,
              lineHeight: 1.7,
              color:      "var(--pub-muted)",
            }}
          >
            A contract posted Thursday was in their inbox Friday morning.
            They read it. They started the proposal. You found out Monday when
            you happened to log in. Every week this pattern repeats. Every
            missed bid is revenue you never got a chance to earn.
          </p>
        </motion.div>

        {/* ── Pain Cards ── */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap:                 "1.25rem",
            marginBottom:        "3.5rem",
          }}
        >
          {PAINS.map((pain) => (
            <motion.article
              key={pain.id}
              variants={fadeInUp}
              style={{
                backgroundColor: "var(--pub-surface)",
                border:          "1px solid var(--pub-border)",
                borderRadius:    "var(--radius-md)",
                padding:         "1.75rem",
              }}
            >
              {/* Gold stat number */}
              <div
                aria-label={`${pain.stat} ${pain.unit}`}
                style={{
                  fontFamily:    "var(--font-geist-mono), monospace",
                  fontSize:      "2.25rem",
                  fontWeight:    600,
                  letterSpacing: "-0.03em",
                  color:         "var(--accent)",
                  lineHeight:    1,
                  marginBottom:  "0.25rem",
                }}
              >
                {pain.stat}
              </div>

              <div
                aria-hidden="true"
                style={{
                  fontFamily:    "var(--font-geist-mono), monospace",
                  fontSize:      "0.6875rem",
                  fontWeight:    400,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color:         "var(--pub-faint)",
                  marginBottom:  "1.125rem",
                }}
              >
                {pain.unit}
              </div>

              <h3
                style={{
                  fontFamily:    "var(--font-inter), sans-serif",
                  fontSize:      "1rem",
                  fontWeight:    600,
                  letterSpacing: "-0.02em",
                  lineHeight:    1.3,
                  color:         "var(--pub-text)",
                  marginBottom:  "0.625rem",
                }}
              >
                {pain.headline}
              </h3>

              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize:   "0.9375rem",
                  fontWeight: 400,
                  lineHeight: 1.7,
                  color:      "var(--pub-muted)",
                }}
              >
                {pain.body}
              </p>
            </motion.article>
          ))}
        </motion.div>

        {/* ── Solution Bridge ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            display:         "flex",
            flexDirection:   "column",
            gap:             "1.25rem",
            padding:         "2rem 2.25rem",
            backgroundColor: "var(--pub-bg)",
            border:          "1px solid var(--pub-border)",
            borderRadius:    "var(--radius-lg)",
            maxWidth:        "680px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "1.0625rem",
              fontWeight: 500,
              lineHeight: 1.65,
              color:      "var(--pub-text)",
            }}
          >
            Plexovia scans SAM.gov and all 50 state portals every night.
            Contracts matching your NAICS codes land in your inbox, scored 0
            to 100 based on relevance. You get competitor tracking and complete
            daily digests without restrictions. No limits. No manual
            searching. Just the contracts you can win.
          </p>

          <div>
            <Link
              href="/auth/signup"
              className="btn-gold"
              id="problem-cta"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              Start Free Trial
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
