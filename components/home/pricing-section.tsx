"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Check, ArrowRight, Mail } from "lucide-react";
import { fadeInUp, stagger } from "@/lib/motion";

/* ─────────────────────────────────────────────────────────
   PricingSection — 2 tiers + Enterprise callout
   Source of truth: pricing_plan.md
   Rules:
   - CTA buttons: #1C1917 solid, zero animation
   - Pro card: gold left border + pulse-gold shadow
   - Yearly: ~31% savings, displayed per month
   - Credit card required — never say "no credit card"
───────────────────────────────────────────────────────── */

type BillingCycle = "monthly" | "yearly";

const PLANS = [
  {
    id:           "pro",
    name:         "Pro",
    monthly:      299,
    yearly:       2490,
    perMonthYr:   208,
    savePercent:  31,
    tagline:      "All 50 states. 4 alerts per day. Competitor tracking. 3-seat team.",
    audience:     "Active BD teams (2-10 people) with $500K-$10M in government revenue.",
    features: [
      "Everything in Essential",
      "All 50 states + county portals + DC, Puerto Rico, Guam",
      "Unlimited NAICS codes and custom keywords",
      "4 alert batches: 6 AM · 12 PM · 6 PM · midnight",
      "AI match explanation with reasons why each contract matched",
      "Set-aside filtering (8(a) · WOSB · SDVOSB · HUBZone)",
      "Competitor tracking by NAICS code and vendor name",
      "Weekly bid calendar digest (Sundays) + performance digest",
      "90-day match history",
      "Up to 3 user seats with individual profiles",
      "Priority support with 8hr response SLA",
    ],
    highlighted:  true,
    ctaHref:      "/auth/signup?plan=pro",
  },
  {
    id:           "essential",
    name:         "Essential",
    monthly:      119,
    yearly:       990,
    perMonthYr:   83,
    savePercent:  31,
    tagline:      "SAM.gov and 7 state portals of your choice. One scored digest per morning.",
    audience:     "Solo operators and small firms (1-5 people) manually checking SAM.gov.",
    features: [
      "SAM.gov federal monitoring, updated daily",
      "7 state portals of your choice",
      "Up to 10 NAICS codes",
      "AI match score (0-100) per contract",
      "Daily email digest by 6 AM. No login required.",
      "Bid deadline reminders: 3 days and 1 day before close",
      "30-day match history · Unlimited CSV exports",
      "1 user seat",
      "Month-to-month. Cancel anytime.",
    ],
    highlighted:  false,
    ctaHref:      "/auth/signup?plan=essential",
  },
] as const;

/* Yearly savings banner for toggle */
const SAVE_BADGE = "Save 31%";

export default function PricingSection() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="pricing"
      aria-label="Pricing plans"
      style={{
        backgroundColor: "var(--pub-bg)",
        borderTop:       "1px solid var(--pub-border)",
        padding:         "5rem 1.5rem 4rem",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: "center", marginBottom: "2.5rem" }}
        >
          <span
            aria-hidden="true"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "0.375rem",
              fontFamily:     "var(--font-geist-mono), monospace",
              fontSize:       "0.6875rem",
              fontWeight:     500,
              letterSpacing:  "0.08em",
              textTransform:  "uppercase",
              color:          "var(--accent)",
              marginBottom:   "1.125rem",
            }}
          >
            <span
              style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "block" }}
            />
            Pricing
          </span>

          <h1
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.75rem, 3vw, 2.5rem)",
              letterSpacing: "-0.04em",
              lineHeight:    1.1,
              color:         "var(--pub-text)",
              marginBottom:  "0.875rem",
            }}
          >
            Two plans. No per-seat traps. Cancel anytime.
          </h1>

          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "1rem",
              fontWeight: 400,
              color:      "var(--pub-muted)",
              lineHeight: 1.6,
              marginBottom: "0.5rem",
            }}
          >
            Essential plan includes a 7-day free trial. No charge until Day 8. Pro plan charges on day 1.
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize:   "0.75rem",
              fontWeight: 500,
              color:      "var(--pub-faint)",
              letterSpacing: "0.01em",
            }}
          >
            Manual monitoring costs 10+ hours per week. Plexovia starts at $119 per month.
          </p>
        </motion.div>

        {/* ── Monthly / Yearly toggle ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: "2.75rem" }}
          aria-label="Billing cycle selector"
        >
          <div
            role="group"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.25rem",
              padding:         "0.25rem",
              backgroundColor: "var(--pub-surface-2)",
              border:          "1px solid var(--pub-border)",
              borderRadius:    "var(--radius-pill)",
            }}
          >
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                role="radio"
                aria-checked={billing === cycle}
                onClick={() => setBilling(cycle)}
                style={{
                  fontFamily:      "var(--font-inter), sans-serif",
                  fontSize:        "0.875rem",
                  fontWeight:      billing === cycle ? 600 : 400,
                  padding:         "0.4rem 1rem",
                  borderRadius:    "var(--radius-pill)",
                  border:          "none",
                  cursor:          "pointer",
                  backgroundColor: billing === cycle ? "#1C1917" : "transparent",
                  color:           billing === cycle ? "#FFFFFF" : "var(--pub-muted)",
                  transition:      "background-color 0.18s ease, color 0.18s ease, font-weight 0.18s ease",
                  display:         "inline-flex",
                  alignItems:      "center",
                  gap:             "0.5rem",
                }}
              >
                {cycle === "monthly" ? "Monthly" : "Yearly"}
                {cycle === "yearly" && (
                  <span
                    style={{
                      fontFamily:      "var(--font-geist-mono), monospace",
                      fontSize:        "0.6875rem",
                      fontWeight:      600,
                      padding:         "0.125rem 0.4rem",
                      borderRadius:    "var(--radius-pill)",
                      backgroundColor: billing === "yearly" ? "var(--accent)" : "var(--accent-bg-pub)",
                      color:           billing === "yearly" ? "#1C1917" : "var(--accent)",
                      transition:      "background-color 0.18s ease, color 0.18s ease",
                    }}
                  >
                    {SAVE_BADGE}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Pricing cards ── */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap:                 "1.25rem",
            marginBottom:        "2.5rem",
            alignItems:          "start",
          }}
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              variants={fadeInUp}
              style={{
                backgroundColor: "var(--pub-surface)",
                border:          plan.highlighted
                  ? "1px solid var(--accent)"
                  : "1px solid var(--pub-border)",
                borderLeft:      plan.highlighted
                  ? "3px solid var(--accent)"
                  : undefined,
                borderRadius:    "var(--radius-md)",
                overflow:        "hidden",
                animation:       plan.highlighted ? "pulse-gold 3.5s ease-in-out infinite" : undefined,
                transition:      "box-shadow 0.2s ease",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  padding:      "1.75rem 1.75rem 1.25rem",
                  borderBottom: "1px solid var(--pub-border)",
                }}
              >
                {plan.highlighted && (
                  <span
                    style={{
                      display:         "inline-block",
                      fontFamily:      "var(--font-geist-mono), monospace",
                      fontSize:        "0.625rem",
                      fontWeight:      600,
                      letterSpacing:   "0.08em",
                      textTransform:   "uppercase",
                      backgroundColor: "var(--accent-bg-pub)",
                      color:           "var(--accent)",
                      padding:         "0.2rem 0.6rem",
                      borderRadius:    "var(--radius-pill)",
                      marginBottom:    "0.75rem",
                    }}
                  >
                    Most popular
                  </span>
                )}

                <div style={{ marginBottom: "0.375rem" }}>
                  <span
                    style={{
                      fontFamily:    "var(--font-inter), sans-serif",
                      fontSize:      "1.125rem",
                      fontWeight:    600,
                      letterSpacing: "-0.02em",
                      color:         "var(--pub-text)",
                    }}
                  >
                    {plan.name}
                  </span>
                </div>

                {/* Price display — animates on toggle */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.5rem" }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={billing + plan.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.22 }}
                      style={{
                        fontFamily:    "var(--font-inter), sans-serif",
                        fontSize:      "2.75rem",
                        fontWeight:    800,
                        letterSpacing: "-0.05em",
                        color:         "var(--pub-text)",
                        lineHeight:    1,
                      }}
                    >
                      ${billing === "monthly" ? plan.monthly : plan.perMonthYr}
                    </motion.span>
                  </AnimatePresence>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize:   "0.875rem",
                      fontWeight: 400,
                      color:      "var(--pub-muted)",
                    }}
                  >
                    /mo
                  </span>
                </div>

                {billing === "yearly" && (
                  <p
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize:   "0.75rem",
                      color:      "var(--pub-muted)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    ${plan.yearly}/yr, saves ${(plan.monthly * 12) - plan.yearly}/year
                  </p>
                )}

                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "0.875rem",
                    color:      "var(--pub-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {plan.tagline}
                </p>
              </div>

              {/* Feature list */}
              <div style={{ padding: "1.5rem 1.75rem 1.75rem" }}>
                <ul
                  role="list"
                  style={{
                    listStyle:    "none",
                    margin:       "0 0 1.5rem",
                    padding:      0,
                    display:      "flex",
                    flexDirection:"column",
                    gap:          "0.625rem",
                  }}
                >
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      style={{
                        display:    "flex",
                        alignItems: "flex-start",
                        gap:        "0.625rem",
                      }}
                    >
                      <Check
                        size={15}
                        strokeWidth={2.5}
                        style={{
                          color:     "var(--success)",
                          flexShrink: 0,
                          marginTop: "0.15rem",
                        }}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize:   "0.875rem",
                          fontWeight: i === 0 && plan.id === "pro" ? 600 : 400,
                          color:      "var(--pub-text)",
                          lineHeight: 1.5,
                        }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA — black button, zero animation */}
                <Link
                  href={plan.ctaHref}
                  className="btn-gold"
                  id={`pricing-cta-${plan.id}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%" }}
                >
                  {plan.id === "pro" ? "Start with Pro" : "Start Free Trial"}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>

                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "0.75rem",
                    color:      "var(--pub-faint)",
                    textAlign:  "center",
                    marginTop:  "0.625rem",
                  }}
                >
                  {plan.id === "pro"
                    ? "Credit card required. Cancel anytime."
                    : "Credit card required. No charge until Day 8."}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Enterprise callout ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.45 }}
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            flexWrap:       "wrap",
            gap:            "1rem",
            padding:        "1.25rem 1.75rem",
            backgroundColor:"var(--pub-surface-2)",
            border:         "1px solid var(--pub-border)",
            borderRadius:   "var(--radius-md)",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.9375rem",
                fontWeight: 600,
                color:      "var(--pub-text)",
                marginBottom: "0.25rem",
              }}
            >
              Enterprise: For teams of 10+ with custom coverage and dedicated support
            </p>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.875rem",
                fontWeight: 400,
                color:      "var(--pub-muted)",
              }}
            >
              Webhook alerts, white-label reports, custom configuration. Email us with your team size and NAICS codes.
            </p>
          </div>

          <a
            href="mailto:support@plexovia.com?subject=Enterprise%20Inquiry"
            className="btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}
          >
            <Mail size={15} aria-hidden="true" />
            support@plexovia.com
          </a>
        </motion.div>

      </div>
    </section>
  );
}
