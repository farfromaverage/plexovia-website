"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Target,
  Globe,
  Shield,
  CalendarClock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   AIForecastingSection
   Premium redesign. Features interactive card exploration,
   animated gradient accents, and a bento-style layout that
   makes the intelligence platform feel alive.
   Audit: id="features" anchor maintained for nav link.
───────────────────────────────────────────────────────── */

const CORE_FEATURES = [
  {
    id:    "predict",
    icon:  BrainCircuit,
    tag:   "Predictive Intelligence",
    title: "Know 12 months before the RFP drops",
    body:  "Our TimesFM engine models federal and state budget cycles. It surfaces upcoming solicitations before the incumbent even knows the contract is expiring.",
    metric: { value: "12mo", label: "average forward visibility" },
    accent: "rgba(201,168,76,0.12)",
    border: "rgba(201,168,76,0.25)",
  },
  {
    id:    "score",
    icon:  Target,
    tag:   "AI Match Scoring",
    title: "Every contract scored 0 to 100",
    body:  "Each match includes a plain-English explanation of exactly which signals fired: NAICS alignment, place of performance, set-aside eligibility, keyword density, and deadline proximity.",
    metric: { value: "0 to 100", label: "match score per contract" },
    accent: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
  },
  {
    id:    "coverage",
    icon:  Globe,
    tag:   "Total Market Coverage",
    title: "SAM.gov plus all 50 states in one pipeline",
    body:  "Every federal solicitation, state procurement portal, county registry, and presolicitation in one unified feed. Indexed nightly, deduplicated, and ranked.",
    metric: { value: "50+", label: "portals scanned nightly" },
    accent: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
  },
  {
    id:    "setaside",
    icon:  Shield,
    tag:   "Set Aside Isolation",
    title: "Only contracts you are eligible to win",
    body:  "Strict prefiltering for 8(a), WOSB, SDVOSB, and HUBZone. Contracts outside your certification profile are excluded before scoring, so your digest contains zero noise.",
    metric: { value: "100%", label: "certification-matched results" },
    accent: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.18)",
  },
  {
    id:    "calendar",
    icon:  CalendarClock,
    tag:   "Deadline Intelligence",
    title: "Never miss a closing date",
    body:  "Bid deadlines are tracked from solicitation through award. You receive automated reminders 7 days out, 3 days out, and 1 day before close. No spreadsheet required.",
    metric: { value: "3x", label: "deadline reminders per bid" },
    accent: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
  {
    id:    "spend",
    icon:  TrendingUp,
    tag:   "Agency Spend Intelligence",
    title: "Track agency budget surges before they publish",
    body:  "Our engine identifies agencies entering Q4 use-it-or-lose-it spending patterns weeks before RFPs are released. Position your pipeline to match the right agency at the right time.",
    metric: { value: "Q4", label: "spend surge forecasting" },
    accent: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
  },
];

export default function AIForecastingSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [activeId, setActiveId] = useState<string>(CORE_FEATURES[0].id);

  const active = CORE_FEATURES.find((f) => f.id === activeId) ?? CORE_FEATURES[0];
  const ActiveIcon = active.icon;

  return (
    <section
      ref={ref}
      id="features"
      aria-label="Platform intelligence features"
      style={{
        backgroundColor: "var(--pub-bg)",
        padding:         "6rem 1.5rem 5rem",
        borderTop:       "1px solid var(--pub-border)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
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
            <span
              style={{
                width:           6,
                height:          6,
                borderRadius:    "50%",
                backgroundColor: "var(--accent)",
                display:         "block",
                animation:       "pulse 2.5s ease-in-out infinite",
              }}
            />
            The Prediction Advantage
          </span>

          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.875rem, 3.5vw, 3rem)",
              letterSpacing: "-0.04em",
              lineHeight:    1.12,
              color:         "var(--pub-text)",
              marginBottom:  "1rem",
            }}
          >
            If you wait for the RFP,
            <br />
            <span style={{ color: "var(--accent)" }}>it is already too late.</span>
          </h2>

          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "1.0625rem",
              color:      "var(--pub-muted)",
              lineHeight: 1.65,
              maxWidth:   "640px",
              margin:     "0 auto",
            }}
          >
            Winning government contracts is not about searching faster.
            It is about knowing earlier. Six intelligence modules work in parallel
            to build your pipeline months before the public posting.
          </p>
        </motion.div>

        {/* ── Interactive Bento Layout ── */}
        <motion.div
          id="features-bento"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            display:   "grid",
            gridTemplateColumns: "320px 1fr",
            gap:       "1.25rem",
            alignItems: "stretch",
          }}
        >
          {/* Left: Feature list */}
          <div
            id="features-list"
            style={{
              display:       "flex",
              flexDirection: "column",
              gap:           "0.5rem",
            }}
          >
            {CORE_FEATURES.map((feature, i) => {
              const Icon    = feature.icon;
              const isActive = activeId === feature.id;

              return (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveId(feature.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                  aria-pressed={isActive}
                  style={{
                    display:         "flex",
                    alignItems:      "center",
                    gap:             "0.875rem",
                    padding:         "0.875rem 1rem",
                    borderRadius:    "10px",
                    border:          isActive ? `1px solid ${feature.border}` : "1px solid transparent",
                    backgroundColor: isActive ? feature.accent : "transparent",
                    cursor:          "pointer",
                    textAlign:       "left",
                    transition:      "all 0.2s ease",
                    outline:         "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--pub-surface)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor     = "var(--pub-border)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.borderColor     = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      width:           "36px",
                      height:          "36px",
                      borderRadius:    "8px",
                      backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "var(--pub-surface)",
                      border:          "1px solid var(--pub-border)",
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      flexShrink:      0,
                    }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      style={{ color: isActive ? "var(--accent)" : "var(--pub-muted)" }}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily:  "var(--font-inter), sans-serif",
                        fontSize:    "0.625rem",
                        fontWeight:  600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color:       isActive ? "var(--accent)" : "var(--pub-faint)",
                        marginBottom: "0.1rem",
                      }}
                    >
                      {feature.tag}
                    </p>
                    <p
                      style={{
                        fontFamily:  "var(--font-inter), sans-serif",
                        fontSize:    "0.875rem",
                        fontWeight:  isActive ? 600 : 400,
                        color:       isActive ? "var(--pub-text)" : "var(--pub-muted)",
                        lineHeight:  1.3,
                        overflow:    "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace:  "nowrap",
                      }}
                    >
                      {feature.title}
                    </p>
                  </div>

                  {isActive && (
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      style={{ color: "var(--accent)", marginLeft: "auto", flexShrink: 0 }}
                      aria-hidden="true"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right: Detail panel */}
          <div
            style={{
              borderRadius:    "16px",
              border:          `1px solid ${active.border}`,
              backgroundColor: active.accent,
              overflow:        "hidden",
              position:        "relative",
              minHeight:       "380px",
              display:         "flex",
              flexDirection:   "column",
            }}
          >
            {/* Subtle radial glow in top-right corner */}
            <div
              aria-hidden="true"
              style={{
                position:        "absolute",
                top:             "-80px",
                right:           "-80px",
                width:           "300px",
                height:          "300px",
                borderRadius:    "50%",
                background:      active.accent,
                filter:          "blur(60px)",
                pointerEvents:   "none",
                opacity:         0.8,
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  padding:       "2.5rem",
                  display:       "flex",
                  flexDirection: "column",
                  gap:           "1.5rem",
                  height:        "100%",
                  position:      "relative",
                  zIndex:        1,
                  flexGrow:      1,
                }}
              >
                {/* Tag + icon row */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width:           "48px",
                      height:          "48px",
                      borderRadius:    "12px",
                      backgroundColor: "var(--pub-bg)",
                      border:          `1px solid ${active.border}`,
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      flexShrink:      0,
                    }}
                  >
                    <ActiveIcon size={24} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                  </div>
                  <span
                    style={{
                      fontFamily:    "var(--font-geist-mono), monospace",
                      fontSize:      "0.6875rem",
                      fontWeight:    600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color:         "var(--accent)",
                      padding:       "0.25rem 0.625rem",
                      borderRadius:  "4px",
                      backgroundColor: "rgba(201,168,76,0.1)",
                      border:        "1px solid rgba(201,168,76,0.2)",
                    }}
                  >
                    {active.tag}
                  </span>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontFamily:    "var(--font-inter), sans-serif",
                    fontWeight:    700,
                    fontSize:      "clamp(1.25rem, 2.5vw, 1.625rem)",
                    letterSpacing: "-0.03em",
                    lineHeight:    1.2,
                    color:         "var(--pub-text)",
                    margin:        0,
                  }}
                >
                  {active.title}
                </h3>

                {/* Body */}
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "1rem",
                    color:      "var(--pub-muted)",
                    lineHeight: 1.7,
                    margin:     0,
                    maxWidth:   "540px",
                  }}
                >
                  {active.body}
                </p>

                {/* Metric chip */}
                <div
                  style={{
                    marginTop:       "auto",
                    display:         "flex",
                    alignItems:      "center",
                    gap:             "0.875rem",
                    padding:         "1rem 1.25rem",
                    borderRadius:    "10px",
                    backgroundColor: "var(--pub-surface)",
                    border:          "1px solid var(--pub-border)",
                    boxShadow:       "0 1px 4px rgba(0,0,0,0.04)",
                    alignSelf:       "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontFamily:    "var(--font-inter), sans-serif",
                      fontWeight:    800,
                      fontSize:      "1.5rem",
                      letterSpacing: "-0.05em",
                      color:         "var(--accent)",
                      lineHeight:    1,
                    }}
                  >
                    {active.metric.value}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize:   "0.8125rem",
                      color:      "var(--pub-muted)",
                      lineHeight: 1.3,
                    }}
                  >
                    {active.metric.label}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mobile grid fallback — stacked cards */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 860px) {
            #features-bento {
              grid-template-columns: 1fr !important;
            }
            #features-list {
              display: grid !important;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
              gap: 0.5rem !important;
            }
          }
        ` }} />

        {/* ── Bottom CTA strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{
            marginTop:      "3rem",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            flexWrap:       "wrap",
            gap:            "1rem",
            padding:        "1.5rem 2rem",
            borderRadius:   "12px",
            backgroundColor: "var(--pub-surface)",
            border:          "1px solid var(--pub-border)",
          }}
        >
          <div>
            <p
              style={{
                fontFamily:    "var(--font-inter), sans-serif",
                fontWeight:    600,
                fontSize:      "1rem",
                color:         "var(--pub-text)",
                margin:        0,
                letterSpacing: "-0.01em",
              }}
            >
              All six modules are included in every plan.
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.875rem",
                color:      "var(--pub-muted)",
                margin:     "0.2rem 0 0",
              }}
            >
              No add-ons. No enterprise tier required.
            </p>
          </div>
          <Link
            href="/auth/signup"
            id="features-cta"
            className="btn-gold"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            Activate Your Intelligence Feed
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
