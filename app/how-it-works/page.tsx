import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "How Plexovia Works | Government Contract Monitoring",
  description:
    "Three minutes of setup. Plexovia monitors SAM.gov and all 50 state procurement portals every night. Scored contract matches delivered to your inbox by 6 AM. No login required.",
  alternates: { canonical: "https://plexovia.com/how-it-works" },
  openGraph: {
    title: "How Plexovia Works",
    description:
      "Set up your NAICS codes and states in minutes. We scan every portal every night and deliver ranked matches to your inbox by 6 AM.",
    url: "https://plexovia.com/how-it-works",
  },
};

const steps = [
  {
    number: "01",
    label: "Setup",
    title: "Tell us what you bid on. Takes three minutes.",
    body: "Enter the NAICS codes your firm pursues and pick your states. Essential covers 7 states. Pro covers all 50 plus DC, Puerto Rico, and Guam. You will never manually filter a search results page again.",
    detail: [
      "Up to 10 NAICS codes on Essential. Unlimited on Pro.",
      "Add custom keywords to catch contracts your NAICS codes miss.",
      "Set your place of performance preference so irrelevant states drop out.",
      "One user on Essential. Up to 3 team seats on Pro with individual profiles.",
    ],
    accent: "#C9A84C",
  },
  {
    number: "02",
    label: "Monitoring",
    title: "We scan every portal every night. You do nothing.",
    body: "Our engine checks SAM.gov and every state procurement portal on your list while you sleep. New solicitations are matched against your profile by NAICS code. Not keywords scraped from a description. Actual NAICS codes from the solicitation record.",
    detail: [
      "SAM.gov federal awards and pre-solicitations updated daily.",
      "State portals checked nightly. Pro portals checked every 6 hours.",
      "Set-aside types flagged automatically: 8(a), WOSB, SDVOSB, HUBZone.",
      "Bid deadlines tracked. Reminders sent 3 days and 1 day before close.",
    ],
    accent: "#C9A84C",
  },
  {
    number: "03",
    label: "Delivery",
    title: "Ranked matches in your inbox. No login, ever.",
    body: "Every contract that matches your profile arrives by 6 AM, ranked from 100 down to 0. The score reflects how well the solicitation fits your codes, keywords, and location preferences. You open the email, decide what to pursue, and get on with your day.",
    detail: [
      "Essential: one digest per morning at 6 AM.",
      "Pro: four alert batches per day at 6 AM, 12 PM, 6 PM, and midnight.",
      "Each match shows the agency, deadline, place of performance, set-aside status, and your score.",
      "Click any contract to go directly to the solicitation. No platform login required.",
    ],
    accent: "#C9A84C",
  },
];

const proFeatures = [
  {
    title: "Competitor tracking",
    body: "Enter competitor vendor names. Plexovia shows you every federal award they have received in your NAICS codes over the past year. You see who is winning, how often, and at what dollar amounts.",
  },
  {
    title: "Weekly bid calendar",
    body: "Every Sunday morning you receive a calendar of contracts closing in the next 7 days. Sorted by score. You plan your week around what is actually worth pursuing instead of reacting to whatever appeared last.",
  },
  {
    title: "Weekly performance digest",
    body: "Every Monday you receive a summary of last week. How many contracts matched your profile. How many you viewed. How the numbers compare to the prior week. A simple signal whether your coverage is working.",
  },
  {
    title: "AI match explanation",
    body: "Every match on Pro includes a short paragraph explaining exactly why it scored the way it did. Which NAICS code matched. Which keyword triggered a bonus. Which set-aside added weight. You spend time on the right ones.",
  },
];

const faqs = [
  {
    q: "Where does the contract data come from?",
    a: "SAM.gov is the federal source. Every state portal is an official government procurement system: eProcurement, BIDS, Procurement Gateway, DemandStar, and others depending on the state. We pull directly from each source. No data resellers.",
  },
  {
    q: "How is the match score calculated?",
    a: "It starts with NAICS code. If the solicitation lists your code, the base score is high. We then weight for place of performance, set-aside type if you have a certification, keyword density, and deadline proximity. Scores run 0 to 100. Anything above 70 is a strong match.",
  },
  {
    q: "Do I need to log in every day?",
    a: "No. The entire point is that you do not have to. Everything you need is in your email. You can log in to review match history, export to CSV, or update your profile. But if you never log in after setup, the alerts still arrive every morning.",
  },
  {
    q: "What is the difference between Essential and Pro?",
    a: "Essential covers SAM.gov and 7 states of your choice with one digest per morning. Pro covers all 50 states plus county portals, DC, Puerto Rico, and Guam with up to 4 alerts per day, competitor tracking, and a weekly bid calendar.",
  },
  {
    q: "How fast do new solicitations appear?",
    a: "Essential subscribers see new solicitations the morning after they are posted. Pro subscribers on portals with 6-hour scanning can receive an alert within hours of a new posting depending on the batch timing.",
  },
  {
    q: "Can I cancel before Day 8 and pay nothing?",
    a: "Yes. If you cancel your Essential trial before Day 8, your card is never charged. Pro does not include a trial period. You can cancel Pro at any time before your next billing date.",
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ backgroundColor: "var(--pub-bg)" }}>

      {/* HERO */}
      <section
        style={{
          paddingTop:    "clamp(6rem, 10vw, 9rem)",
          paddingBottom: "5rem",
          paddingLeft:   "1.5rem",
          paddingRight:  "1.5rem",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <span
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           "0.375rem",
              fontFamily:    "var(--font-geist-mono), monospace",
              fontSize:      "0.6875rem",
              fontWeight:    500,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color:         "var(--accent)",
              marginBottom:  "1.5rem",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", display: "block" }} />
            How It Works
          </span>

          <h1
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    800,
              fontSize:      "clamp(2.25rem, 5vw, 3.5rem)",
              letterSpacing: "-0.05em",
              lineHeight:    1.05,
              color:         "var(--pub-text)",
              marginBottom:  "1.5rem",
            }}
          >
            You set it up once.
            <br />
            <span style={{ color: "var(--accent)" }}>Every contract finds you</span> after that.
          </h1>

          <p
            style={{
              fontFamily:  "var(--font-inter), sans-serif",
              fontSize:    "1.125rem",
              color:       "var(--pub-muted)",
              lineHeight:  1.7,
              maxWidth:    "580px",
              margin:      "0 auto 2.5rem",
            }}
          >
            Plexovia monitors SAM.gov and every state procurement portal every night.
            Matched contracts land in your inbox scored and ranked before you start work.
            No login. No searching. No portals.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/signup" id="hiw-hero-cta" className="btn-gold"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Start Your 7-Day Free Trial
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/pricing"
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.9375rem",
                fontWeight: 500,
                color:      "var(--pub-muted)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                alignSelf: "center",
              }}>
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* STAT STRIP */}
      <div style={{ borderTop: "1px solid var(--pub-border)", borderBottom: "1px solid var(--pub-border)", backgroundColor: "var(--pub-surface-2)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2rem", textAlign: "center" }}>
          {[
            { stat: "50", unit: "states", label: "covered nightly" },
            { stat: "6 AM", unit: "", label: "matches in your inbox" },
            { stat: "0 to 100", unit: "", label: "match score per contract" },
            { stat: "3 min", unit: "", label: "to complete setup" },
          ].map(({ stat, unit, label }) => (
            <div key={label}>
              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.05em", color: "var(--pub-text)", lineHeight: 1, marginBottom: "0.25rem" }}>
                {stat} <span style={{ fontWeight: 400, fontSize: "1rem", color: "var(--pub-muted)" }}>{unit}</span>
              </p>
              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.875rem", color: "var(--pub-muted)", lineHeight: 1.5 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* THREE STEPS */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ maxWidth: "560px", marginBottom: "4rem" }}>
            <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--accent)", marginBottom: "0.75rem" }}>
              The process
            </p>
            <h2 style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.04em", color: "var(--pub-text)", lineHeight: 1.1 }}>
              Three steps. One time.
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0" }}>
            {steps.map((step, idx) => (
              <div
                key={step.number}
                style={{
                  display:     "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap:         "4rem",
                  padding:     "4rem 0",
                  borderBottom: idx < steps.length - 1 ? "1px solid var(--pub-border)" : "none",
                  alignItems:  "start",
                }}
              >
                {/* Left */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.06em", color: "var(--accent)", backgroundColor: "rgba(201,168,76,0.1)", padding: "0.3rem 0.75rem", borderRadius: "var(--radius-pill)" }}>
                      {step.number}
                    </span>
                    <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontWeight: 500, fontSize: "0.6875rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--pub-faint)" }}>
                      {step.label}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, fontSize: "clamp(1.375rem, 2.5vw, 1.75rem)", letterSpacing: "-0.03em", color: "var(--pub-text)", lineHeight: 1.2, marginBottom: "1.25rem" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "1rem", color: "var(--pub-muted)", lineHeight: 1.75 }}>
                    {step.body}
                  </p>
                </div>

                {/* Right — detail bullets */}
                <div style={{ backgroundColor: "var(--pub-surface)", border: "1px solid var(--pub-border)", borderRadius: "var(--radius-md)", padding: "2rem" }}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
                    {step.detail.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <CheckCircle size={16} style={{ color: "var(--success)", flexShrink: 0, marginTop: "0.2rem" }} aria-hidden="true" />
                        <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.9375rem", color: "var(--pub-text)", lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRO FEATURES SPOTLIGHT */}
      <section style={{ backgroundColor: "#1C1917", padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ maxWidth: "560px", marginBottom: "3.5rem" }}>
            <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--accent)", display: "block", marginBottom: "0.75rem" }}>
              Pro plan
            </span>
            <h2 style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.04em", color: "#F5F3EE", lineHeight: 1.1, marginBottom: "0.875rem" }}>
              Built for teams that are serious about winning.
            </h2>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "1rem", color: "#6B6560", lineHeight: 1.7 }}>
              Pro unlocks four features that Essential does not include. Each one is designed for BD teams actively pursuing contracts in multiple states.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {proFeatures.map((feat) => (
              <div key={feat.title} style={{ backgroundColor: "#222120", border: "1px solid #2E2C2A", borderRadius: "var(--radius-md)", padding: "1.75rem" }}>
                <h3 style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 600, fontSize: "1rem", letterSpacing: "-0.02em", color: "#F5F3EE", marginBottom: "0.75rem" }}>
                  {feat.title}
                </h3>
                <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.9375rem", color: "#6B6560", lineHeight: 1.7 }}>
                  {feat.body}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "3rem", paddingTop: "3rem", borderTop: "1px solid #2E2C2A", display: "flex", gap: "1rem", flexWrap: "wrap" as const, alignItems: "center" }}>
            <Link href="/auth/signup?plan=pro" id="hiw-pro-cta" className="btn-gold"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--accent)", color: "#1C1917" }}>
              Start with Pro
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.875rem", color: "#4A4845" }}>
              $299 per month. No annual contract. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* PLAN COMPARISON STRIP */}
      <section style={{ backgroundColor: "var(--pub-surface-2)", borderTop: "1px solid var(--pub-border)", borderBottom: "1px solid var(--pub-border)", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2rem)", letterSpacing: "-0.04em", color: "var(--pub-text)", marginBottom: "2.5rem", textAlign: "center" }}>
            Which plan fits your team?
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {[
              {
                name: "Essential",
                price: "$119",
                desc: "For solo operators and small firms checking SAM.gov manually every week.",
                bullets: [
                  "SAM.gov and 7 states of your choice",
                  "One scored digest per morning at 6 AM",
                  "Up to 10 NAICS codes",
                  "30 days of match history",
                  "1 user seat",
                  "7-day free trial",
                ],
                cta: "Start Free Trial",
                href: "/auth/signup?plan=essential",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "$299",
                desc: "For BD teams actively pursuing contracts across multiple states every week.",
                bullets: [
                  "All 50 states plus DC, Puerto Rico, and Guam",
                  "4 alert batches per day",
                  "Unlimited NAICS codes and keywords",
                  "Competitor tracking by NAICS code",
                  "Weekly bid calendar and performance digest",
                  "Up to 3 user seats",
                ],
                cta: "Start with Pro",
                href: "/auth/signup?plan=pro",
                highlighted: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                style={{
                  backgroundColor: plan.highlighted ? "var(--pub-surface)" : "var(--pub-surface)",
                  border:          plan.highlighted ? "1.5px solid var(--accent)" : "1px solid var(--pub-border)",
                  borderRadius:    "var(--radius-md)",
                  padding:         "2rem",
                }}
              >
                {plan.highlighted && (
                  <span style={{ display: "inline-block", fontFamily: "var(--font-geist-mono), monospace", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, backgroundColor: "rgba(201,168,76,0.1)", color: "var(--accent)", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-pill)", marginBottom: "0.75rem" }}>
                    Most popular
                  </span>
                )}
                <p style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 600, fontSize: "1rem", color: "var(--pub-text)", marginBottom: "0.25rem" }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 800, fontSize: "2.25rem", letterSpacing: "-0.05em", color: "var(--pub-text)", lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.875rem", color: "var(--pub-muted)" }}>/mo</span>
                </div>
                <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.875rem", color: "var(--pub-muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>{plan.desc}</p>
                <ul style={{ listStyle: "none", margin: "0 0 1.75rem", padding: 0, display: "flex", flexDirection: "column" as const, gap: "0.625rem" }}>
                  {plan.bullets.map((b) => (
                    <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <CheckCircle size={14} style={{ color: "var(--success)", flexShrink: 0, marginTop: "0.2rem" }} aria-hidden="true" />
                      <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.875rem", color: "var(--pub-text)", lineHeight: 1.5 }}>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="btn-gold"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%" }}>
                  {plan.cta}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 2.5vw, 2rem)", letterSpacing: "-0.04em", color: "var(--pub-text)", marginBottom: "3rem" }}>
            Questions people ask before signing up
          </h2>

          {faqs.map(({ q, a }, i) => (
            <div key={q} style={{ borderBottom: "1px solid var(--pub-border)", paddingBottom: "1.75rem", marginBottom: "1.75rem" }}>
              <h3 style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 600, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--pub-text)", marginBottom: "0.625rem" }}>
                {q}
              </h3>
              <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.9375rem", color: "var(--pub-muted)", lineHeight: 1.7 }}>
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ backgroundColor: "#1C1917", padding: "6rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, fontSize: "clamp(1.625rem, 3.5vw, 2.5rem)", letterSpacing: "-0.05em", color: "#F5F3EE", lineHeight: 1.1, marginBottom: "1rem" }}>
            Your next contract is already posted somewhere.
          </h2>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "1rem", color: "#6B6560", lineHeight: 1.7, marginBottom: "2.5rem" }}>
            Set up today. Your first matched contracts arrive tomorrow morning at 6 AM.
          </p>
          <Link href="/auth/signup" id="hiw-bottom-cta" className="btn-gold"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--accent)", color: "#1C1917" }}>
            Start Your 7-Day Free Trial
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.8125rem", color: "#4A4845", marginTop: "1rem" }}>
            Essential plan. Credit card required. No charge until Day 8.
          </p>
        </div>
      </section>

    </div>
  );
}
