import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HowItWorksSection from "@/components/home/how-it-works";

export const metadata: Metadata = {
  title: "How Plexovia Works | Government Contract Monitoring",
  description:
    "Three minutes of setup. Plexovia monitors SAM.gov and all 50 state procurement portals every night — scored contract matches delivered to your inbox by 6 AM. No login required.",
  alternates: {
    canonical: "https://plexovia.com/how-it-works",
  },
  openGraph: {
    title: "How Plexovia Works — Government Contract Monitoring",
    description:
      "Set up your NAICS codes and states in minutes. We scan every portal every night and deliver ranked matches to your inbox by 6 AM.",
    url: "https://plexovia.com/how-it-works",
  },
};

export default function HowItWorksPage() {
  return (
    <div style={{ backgroundColor: "var(--pub-bg)" }}>

      {/* ── Page hero ── */}
      <section
        style={{
          paddingTop:    "clamp(6rem, 10vw, 9rem)",
          paddingBottom: "3rem",
          paddingLeft:   "1.5rem",
          paddingRight:  "1.5rem",
          textAlign:     "center",
          borderBottom:  "1px solid var(--pub-border)",
        }}
        aria-label="How It Works page header"
      >
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <span
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
            aria-hidden="true"
          >
            <span
              style={{
                width:           "6px",
                height:          "6px",
                borderRadius:    "50%",
                backgroundColor: "var(--accent)",
                display:         "block",
              }}
            />
            How It Works
          </span>

          <h1
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    800,
              fontSize:      "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.05em",
              lineHeight:    1.05,
              color:         "var(--pub-text)",
              marginBottom:  "1.25rem",
            }}
          >
            Three minutes of setup.
            <br />
            A lifetime of not missing&nbsp;contracts.
          </h1>

          <p
            style={{
              fontFamily:   "var(--font-inter), sans-serif",
              fontSize:     "1.0625rem",
              color:        "var(--pub-muted)",
              lineHeight:   1.65,
              marginBottom: "2rem",
              maxWidth:     "560px",
              margin:       "0 auto 2rem",
            }}
          >
            Plexovia monitors SAM.gov and every state procurement portal every
            night. You wake up to a ranked list of contracts matched to your
            exact NAICS codes. No login required.
          </p>

          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            "1rem",
              flexWrap:       "wrap",
            }}
          >
            <Link
              href="/auth/signup"
              id="hiw-hero-cta"
              className="btn-gold"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              Start Free Trial
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              style={{
                fontFamily:     "var(--font-inter), sans-serif",
                fontSize:       "0.9375rem",
                fontWeight:     500,
                color:          "var(--pub-muted)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reuse the homepage How It Works section ── */}
      <HowItWorksSection />

      {/* ── FAQ-style explainer ── */}
      <section
        aria-label="Common questions"
        style={{
          backgroundColor: "var(--pub-surface-2)",
          borderTop:       "1px solid var(--pub-border)",
          borderBottom:    "1px solid var(--pub-border)",
          padding:         "4rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.5rem, 2.5vw, 2rem)",
              letterSpacing: "-0.04em",
              color:         "var(--pub-text)",
              marginBottom:  "2.5rem",
            }}
          >
            Common questions
          </h2>

          {[
            {
              q: "Where does the contract data come from?",
              a: "SAM.gov is the federal source. State data comes from each state's official procurement portal — eProcurement, BIDS, Procurement Gateway, and so on. We pull from the source — no data resellers.",
            },
            {
              q: "How are contracts matched to my profile?",
              a: "We match by NAICS code first. If a solicitation includes your codes, it gets scored 0–100 based on how closely it fits your profile — place of performance, set-aside status, and keywords you added.",
            },
            {
              q: "Do I need to log in every day?",
              a: "No. That's the whole point. Your daily digest arrives by 6 AM. You read it in your email, decide what to pursue, and get on with your day. You can log in to review history or update your profile, but it's not required.",
            },
            {
              q: "What's the difference between Essential and Pro?",
              a: "Essential covers SAM.gov and 7 states of your choice with one digest per morning. Pro covers all 50 states plus county portals, DC, Puerto Rico, and Guam — with up to 4 alert batches per day and competitor tracking.",
            },
            {
              q: "How quickly do new solicitations appear?",
              a: "Our engine runs nightly. New opportunities posted before our nightly scan are in your inbox the next morning. Pro subscribers also receive mid-day and evening batches.",
            },
          ].map(({ q, a }) => (
            <div
              key={q}
              style={{
                borderBottom:  "1px solid var(--pub-border)",
                paddingBottom: "1.75rem",
                marginBottom:  "1.75rem",
              }}
            >
              <h3
                style={{
                  fontFamily:    "var(--font-inter), sans-serif",
                  fontWeight:    600,
                  fontSize:      "1rem",
                  letterSpacing: "-0.02em",
                  color:         "var(--pub-text)",
                  marginBottom:  "0.625rem",
                }}
              >
                {q}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize:   "0.9375rem",
                  color:      "var(--pub-muted)",
                  lineHeight: 1.65,
                }}
              >
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        aria-label="Start your trial"
        style={{
          backgroundColor: "#1C1917",
          padding:         "5rem 1.5rem",
          textAlign:       "center",
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.5rem, 3vw, 2.25rem)",
              letterSpacing: "-0.04em",
              color:         "#F5F3EE",
              marginBottom:  "0.875rem",
              lineHeight:    1.15,
            }}
          >
            Your next contract is already posted.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "1rem",
              color:      "#8A8580",
              lineHeight: 1.65,
              marginBottom: "2.5rem",
            }}
          >
            Set up in 3 minutes. Wake up tomorrow with matched contracts in your inbox.
          </p>
          <Link
            href="/auth/signup"
            id="hiw-final-cta"
            className="btn-gold"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.5rem",
              backgroundColor: "var(--accent)",
              color:           "#1C1917",
            }}
          >
            Start Your Free 7-Day Trial
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.8125rem",
              color:      "#4A4845",
              marginTop:  "1rem",
            }}
          >
            Essential plan. Credit card required. No charge until Day 8.
          </p>
        </div>
      </section>

    </div>
  );
}
