"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Search, AlertTriangle } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   ProblemSection — Names the pain explicitly (PAS framework)
   Audit item H1: Homepage had no "why your current approach 
   is failing" section. This fills that gap.
───────────────────────────────────────────────────────── */

const PROBLEMS = [
  {
    icon: Clock,
    stat: "2 to 4 hrs",
    title: "Wasted on manual searching every day",
    body:  "You log into SAM.gov, check DLA DIBBS, cross-reference NAICS codes, and repeat. Every single morning. That is not business development. That is data entry.",
  },
  {
    icon: Search,
    stat: "73%",
    title: "Of relevant contracts are missed",
    body:  "SAM.gov does not cover state or county portals. If you are only searching one source, the majority of matching opportunities are invisible to you.",
  },
  {
    icon: AlertTriangle,
    stat: "48 hrs",
    title: "Behind your competitors on every alert",
    body:  "Legacy aggregators rely on third-party data resellers. By the time you see a listing, your competitors have already started writing their proposal.",
  },
];

export default function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

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
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
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
            The Problem
          </span>

          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.625rem, 3vw, 2.25rem)",
              letterSpacing: "-0.04em",
              lineHeight:    1.15,
              color:         "var(--pub-text)",
              marginBottom:  "0.75rem",
            }}
          >
            Manual contract searching is costing you more than you think.
          </h2>

          <p
            style={{
              fontFamily:  "var(--font-inter), sans-serif",
              fontSize:    "1rem",
              color:       "var(--pub-muted)",
              lineHeight:  1.65,
              maxWidth:    "580px",
              margin:      "0 auto",
            }}
          >
            Every hour you spend logging into portals and filtering results is an hour
            you are not writing proposals, meeting agencies, or winning contracts.
          </p>
        </motion.div>

        {/* 3 problem cards */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap:                 "1.25rem",
          }}
        >
          {PROBLEMS.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  backgroundColor: "var(--pub-surface)",
                  border:          "1px solid var(--pub-border)",
                  borderRadius:    "var(--radius-md)",
                  padding:         "2rem",
                  display:         "flex",
                  flexDirection:   "column",
                  gap:             "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                  <div
                    style={{
                      width:           "40px",
                      height:          "40px",
                      borderRadius:    "50%",
                      backgroundColor: "rgba(201,168,76,0.1)",
                      border:          "1px solid rgba(201,168,76,0.2)",
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      flexShrink:      0,
                    }}
                  >
                    <Icon size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
                  </div>
                  <span
                    style={{
                      fontFamily:    "var(--font-inter), sans-serif",
                      fontWeight:    800,
                      fontSize:      "1.5rem",
                      letterSpacing: "-0.04em",
                      color:         "var(--pub-text)",
                      lineHeight:    1,
                    }}
                  >
                    {problem.stat}
                  </span>
                </div>

                <p
                  style={{
                    fontFamily:    "var(--font-inter), sans-serif",
                    fontWeight:    600,
                    fontSize:      "1rem",
                    letterSpacing: "-0.01em",
                    color:         "var(--pub-text)",
                    lineHeight:    1.3,
                    margin:        0,
                  }}
                >
                  {problem.title}
                </p>

                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "0.9rem",
                    fontWeight: 400,
                    color:      "var(--pub-muted)",
                    lineHeight: 1.65,
                    margin:     0,
                  }}
                >
                  {problem.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
