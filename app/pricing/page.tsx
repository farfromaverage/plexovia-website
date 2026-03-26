"use client";

import { useState } from "react";
import Link from "next/link";
import type { Metadata } from "next";

/* ─── SEO ─────────────────────────────────────────────────── */
// Note: export const metadata goes in a server component.
// SEO is handled via root layout template.

/* ─── Icons ──────────────────────────────────────────────────*/
function Check() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="8.5" cy="8.5" r="7.5" fill="#EDFAED" stroke="#BBE8BB" />
      <path d="M5.5 8.5l2.2 2.2 4-4.5" stroke="#15803D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
function Cross() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="8.5" cy="8.5" r="7.5" fill="#FEF2F2" stroke="#FECACA" />
      <path d="M6 6l5 5M11 6l-5 5" stroke="#DC2626" strokeWidth="1.75" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function Partial() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="8.5" cy="8.5" r="7.5" fill="#FFFBEB" stroke="#FDE68A" />
      <path d="M5.5 8.5h6" stroke="#B45309" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: "9px", fontSize: "0.875rem", color: "#5A534A", lineHeight: 1.55, padding: "3px 0" }}>
      <span style={{ marginTop: "2px", flexShrink: 0 }}><Check /></span>
      <span>{children}</span>
    </li>
  );
}

function TC({ v }: { v: string }) {
  if (v === "yes")  return <td style={td}><div style={{ display: "flex", justifyContent: "center" }}><Check /></div></td>;
  if (v === "no")   return <td style={td}><div style={{ display: "flex", justifyContent: "center" }}><Cross /></div></td>;
  if (v === "part") return <td style={td}><div style={{ display: "flex", justifyContent: "center" }}><Partial /></div></td>;
  return <td style={{ ...td, fontSize: "0.8125rem", color: "#5A534A", textAlign: "center" }}>{v}</td>;
}

function GroupLabel({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <li style={{ listStyle: "none", paddingTop: "0.75rem", paddingBottom: "0.25rem" }}>
      <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: gold ? "#B8860B" : "#C0B8AE" }}>
        {children}
      </span>
    </li>
  );
}

/* ─── FAQ data ───────────────────────────────────────────── */
const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel before your next billing date and you will not be charged. No contracts, no cancellation fees, no calls required.",
  },
  {
    q: "Is a credit card required for the trial?",
    a: "Yes. Your card is saved but not charged until Day 8. If you cancel before then, you pay nothing.",
  },
  {
    q: "What is a NAICS code?",
    a: "A 6 digit code the federal government uses to classify your business type. Most contractors track 2 to 5 codes. You can look yours up at census.gov.",
  },
  {
    q: "Can I upgrade from Essential to Pro at any time?",
    a: "Yes. You pay the prorated difference for the remaining days in your billing period. Your trial days carry over.",
  },
  {
    q: "What if I need more than 3 user seats?",
    a: "Email support@plexovia.com. Enterprise plans cover teams of any size and are fully configured before your first alert sends.",
  },
];

/* ─── Page ───────────────────────────────────────────────── */
export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const essentialPrice = annual ? 83  : 119;
  const proPrice       = annual ? 208 : 299;
  const essentialNote  = annual ? "billed $990 per year. Save $462." : "billed monthly. Cancel anytime.";
  const proNote        = annual ? "billed $2,490 per year. Save $1,098." : "billed monthly. Cancel anytime.";

  return (
    <>
      <style>{`
        .px-page       { background: #F7F5F0; font-family: var(--font-inter), sans-serif; }
        .px-main       { max-width: 1100px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
        .px-hero       { text-align: center; margin-bottom: 3rem; }
        .px-h1         { font-weight: 800; font-size: clamp(1.75rem, 4.5vw, 2.875rem); color: #1C1917; letter-spacing: -0.04em; margin: 0 0 1rem; line-height: 1.1; }
        .px-toggle     { display: inline-flex; align-items: center; gap: 10px; background: #EDE8E1; border: 1px solid #D8D3CC; border-radius: 9999px; padding: 5px 6px; }
        .px-cards      { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; margin-bottom: 4rem; align-items: start; }
        .px-card       { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 16px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .px-card-pro   { background: #FFFDF5; border: 1.5px solid #C9A84C; border-radius: 16px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; position: relative; box-shadow: 0 4px 32px rgba(201,168,76,0.10); }
        .px-table-wrap { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 16px; overflow: hidden; margin-bottom: 4rem; }
        .px-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .px-table      { width: 100%; border-collapse: collapse; min-width: 700px; }
        .px-faq        { max-width: 680px; margin: 0 auto 4rem; }
        .px-faq-item   { border-bottom: 1px solid #E5E0D8; }
        .px-faq-btn    { width: 100%; text-align: left; padding: 1.125rem 0; background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-family: var(--font-inter), sans-serif; }
        .px-footer     { border-top: 1px solid #E5E0D8; padding: 2rem; display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; }
        .scroll-hint   { display: none; font-size: 0.75rem; color: #8A7F74; padding: 0.625rem 1.5rem; }

        @media (max-width: 900px) {
          .px-cards { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .px-main   { padding: 2rem 1rem 4rem; }
          .scroll-hint { display: block; }
        }
      `}</style>

      <div className="px-page">
        <main className="px-main">

          {/* ── Hero ── */}
          <div className="px-hero">
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#B8860B", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 1rem" }}>
              Federal, State, and County Contract Monitoring
            </p>
            <h1 className="px-h1">
              Government bids in your inbox.<br />No SAM.gov login ever required.
            </h1>
            <p style={{ fontSize: "1rem", color: "#5A534A", maxWidth: "500px", margin: "0 auto 2rem", lineHeight: 1.65 }}>
              Every bid matched to your NAICS codes and keywords. Federal access included in every plan. No annual contract.
            </p>

            {/* Billing toggle */}
            <div className="px-toggle">
              <button
                onClick={() => setAnnual(false)}
                style={{ padding: "7px 20px", borderRadius: "9999px", border: "none", background: annual ? "transparent" : "#1C1917", color: annual ? "#8A7F74" : "#F7F5F0", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-inter), sans-serif", transition: "background 0.15s, color 0.15s" }}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                style={{ padding: "7px 20px", borderRadius: "9999px", border: "none", background: annual ? "#1C1917" : "transparent", color: annual ? "#F7F5F0" : "#8A7F74", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-inter), sans-serif", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.15s, color 0.15s" }}
              >
                Annual
                <span style={{ padding: "2px 8px", background: "#FEF9EC", border: "1px solid #C9A84C40", borderRadius: "9999px", fontSize: "0.7rem", color: "#B8860B", fontWeight: 700 }}>
                  Save up to 31%
                </span>
              </button>
            </div>
          </div>

          {/* ── Cards ── */}
          <div className="px-cards">

            {/* Essential */}
            <div className="px-card">
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8A7F74", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 0.5rem" }}>Essential</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", margin: "0 0 0.25rem" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1C1917", letterSpacing: "-0.05em", lineHeight: 1 }}>${essentialPrice}</span>
                  <span style={{ fontSize: "0.875rem", color: "#8A7F74", marginBottom: "5px" }}>/mo</span>
                </div>
                <p style={{ fontSize: "0.78125rem", color: "#8A7F74", margin: "0 0 1.25rem" }}>{essentialNote}</p>
                <p style={{ fontSize: "0.9375rem", color: "#1C1917", fontWeight: 600, margin: "0 0 0.375rem", lineHeight: 1.35 }}>
                  You are manually checking SAM.gov. They are not.
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#5A534A", margin: 0, lineHeight: 1.55 }}>
                  A bid posted Thursday is in your competitor's inbox Friday morning. You saw it Monday. Plexovia puts matching bids in your inbox by 6 AM.
                </p>
              </div>

              <Link href="/auth/signup" style={ctaBtn}>
                Start Free Trial
              </Link>
              <p style={{ fontSize: "0.75rem", color: "#8A7F74", textAlign: "center", margin: "-0.75rem 0 0" }}>No charge until Day 8</p>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                <GroupLabel>Coverage</GroupLabel>
                <Feat>SAM.gov federal monitoring, updated daily</Feat>
                <Feat>7 state portals of your choice</Feat>
                <Feat>County-level portals within selected states</Feat>
                <GroupLabel>Matching</GroupLabel>
                <Feat>Up to 10 NAICS codes</Feat>
                <Feat>Up to 10 custom keywords</Feat>
                <Feat>AI match score 0 to 100 for every contract</Feat>
                <Feat>Results ranked by relevance, highest match first</Feat>
                <GroupLabel>Alerts and Delivery</GroupLabel>
                <Feat>Daily email digest at 6 AM</Feat>
                <Feat>Deadline reminders at 3 days and 1 day before close</Feat>
                <Feat>No login ever required</Feat>
                <GroupLabel>History and Export</GroupLabel>
                <Feat>30 days of match history</Feat>
                <Feat>Unlimited CSV exports</Feat>
                <GroupLabel>Account</GroupLabel>
                <Feat>1 user seat</Feat>
                <Feat>Monthly billing. Cancel anytime.</Feat>
                <Feat>Email support, 48 hour response</Feat>
              </ul>
            </div>

            {/* Pro */}
            <div className="px-card-pro">
              <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", padding: "4px 16px", background: "#C9A84C", color: "#1C1917", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Most Popular
              </div>
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#B8860B", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 0.5rem" }}>Pro</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", margin: "0 0 0.25rem" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1C1917", letterSpacing: "-0.05em", lineHeight: 1 }}>${proPrice}</span>
                  <span style={{ fontSize: "0.875rem", color: "#8A7F74", marginBottom: "5px" }}>/mo</span>
                </div>
                <p style={{ fontSize: "0.78125rem", color: "#8A7F74", margin: "0 0 1.25rem" }}>{proNote}</p>
                <p style={{ fontSize: "0.9375rem", color: "#1C1917", fontWeight: 600, margin: "0 0 0.375rem", lineHeight: 1.35 }}>
                  Your competitor won $2.1M in contracts last year in your NAICS codes. You do not know which ones.
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#5A534A", margin: 0, lineHeight: 1.55 }}>
                  They are monitoring all 50 states with 4 daily alerts. You are monitoring 7 states with one morning email. Pro closes that gap.
                </p>
              </div>

              {/* Pro CTA — dark per spec, price does the selling */}
              <Link href="/auth/signup?plan=pro" style={ctaBtn}>
                Start with Pro
              </Link>
              <p style={{ fontSize: "0.75rem", color: "#8A7F74", textAlign: "center", margin: "-0.75rem 0 0" }}>Credit card required. Cancel anytime.</p>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                <GroupLabel gold>Everything in Essential, plus</GroupLabel>
                <GroupLabel>Coverage</GroupLabel>
                <Feat>All 50 states, DC, Puerto Rico, and Guam</Feat>
                <Feat>Portals scanned every 6 hours, 24 hours a day</Feat>
                <GroupLabel>Matching</GroupLabel>
                <Feat>Unlimited NAICS codes</Feat>
                <Feat>Unlimited keywords</Feat>
                <Feat>AI match explanation for every result</Feat>
                <Feat>Set-aside filtering including 8(a), WOSB, SDVOSB, HUBZone, and VOSB</Feat>
                <Feat>Competitor tracking, see which vendors won in your NAICS codes</Feat>
                <GroupLabel>Alerts and Delivery</GroupLabel>
                <Feat>4 alert batches per day at 6 AM, 12 PM, 6 PM, and midnight</Feat>
                <Feat>Deadline reminders at 7 days, 3 days, and 1 day before close</Feat>
                <Feat>Bid calendar weekly digest every Sunday</Feat>
                <GroupLabel>History and Export</GroupLabel>
                <Feat>90 days of match history</Feat>
                <Feat>Unlimited CSV and Excel export</Feat>
                <Feat>Weekly performance digest, your matches vs. prior week</Feat>
                <GroupLabel>Account</GroupLabel>
                <Feat>Up to 3 user seats, each with their own profile</Feat>
                <Feat>Monthly billing. No annual contract required.</Feat>
                <Feat>Priority support, 8 hour response</Feat>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="px-card">
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8A7F74", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 0.5rem" }}>Enterprise</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", margin: "0 0 0.25rem" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1C1917", letterSpacing: "-0.05em", lineHeight: 1 }}>Custom</span>
                </div>
                <p style={{ fontSize: "0.78125rem", color: "#8A7F74", margin: "0 0 1.25rem" }}>scoped to your BD team size and workflow</p>
                <p style={{ fontSize: "0.9375rem", color: "#1C1917", fontWeight: 600, margin: "0 0 0.375rem", lineHeight: 1.35 }}>
                  For BD teams of 10 or more people with $10M or more in government revenue.
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#5A534A", margin: 0, lineHeight: 1.55 }}>
                  Email us with your team size, NAICS codes, and state coverage needs. We scope your requirements and configure the platform before your first alert sends.
                </p>
              </div>

              <a href="mailto:support@plexovia.com?subject=Enterprise%20Inquiry" style={ctaBtn}>
                Email support@plexovia.com
              </a>
              <p style={{ fontSize: "0.75rem", color: "#8A7F74", textAlign: "center", margin: "-0.75rem 0 0" }}>Response within 24 hours</p>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                <GroupLabel>Everything in Pro, plus</GroupLabel>
                <Feat>Instant webhook alerts to your CRM or Slack</Feat>
                <Feat>Dedicated account manager</Feat>
                <Feat>2 hour Slack response SLA</Feat>
                <Feat>Quarterly Business Review</Feat>
                <Feat>Custom configuration for your team workflow</Feat>
                <Feat>Flexible monthly or annual pricing</Feat>
              </ul>
            </div>
          </div>

          {/* ── Comparison table ── */}
          <div className="px-table-wrap">
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #E5E0D8" }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#1C1917", margin: 0, letterSpacing: "-0.03em" }}>Full Feature Comparison</h2>
              <p style={{ fontSize: "0.875rem", color: "#8A7F74", margin: "4px 0 0" }}>Plexovia vs. the tools contractors are currently paying for</p>
            </div>
            <p className="scroll-hint">Scroll right to see all columns</p>
            <div className="px-table-scroll">
              <table className="px-table">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                    <th style={{ ...th, textAlign: "left", width: "28%", background: "#F7F5F0" }}>Feature</th>
                    <th style={{ ...th, color: "#B8860B", background: "#FFFDF5" }}>Essential $119</th>
                    <th style={{ ...th, color: "#B8860B", background: "#FFFDF5" }}>Pro $299</th>
                    <th style={th}>BidSync ~$150</th>
                    <th style={th}>GovTribe $458</th>
                    <th style={th}>GovWin $1,000+</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ["Federal (SAM.gov)",           "yes",  "yes",    "no",          "yes",    "yes"],
                    ["State portals",               "7",    "All 50", "1 state",     "Limited","Limited"],
                    ["County portals",              "yes",  "yes",    "no",          "no",     "no"],
                    ["AI match scoring",            "yes",  "yes",    "no",          "part",   "no"],
                    ["Email delivery, no login",    "yes",  "yes",    "no",          "no",     "no"],
                    ["NAICS codes",                 "10",   "Unlimited","Keyword only","Unlimited","Unlimited"],
                    ["Alert speed",                 "6 AM", "4x daily","Daily",      "Daily digest","Login required"],
                    ["Weekly bid calendar digest",  "no",   "yes",    "no",          "no",     "no"],
                    ["Weekly performance digest",   "no",   "yes",    "no",          "no",     "no"],
                    ["Competitor tracking",         "no",   "yes",    "no",          "yes",    "yes"],
                    ["User seats",                  "1",    "3",      "1",           "5",      "Per seat"],
                    // "Cancel anytime" — green = good (you CAN cancel), red = locked in
                    ["Cancel anytime",              "yes",  "yes",    "no",          "no",     "no"],
                    ["Free trial",                  "7 days","No",     "no",          "no",     "Demo only"],
                    ["Starting price",              "$119/mo","$299/mo","~$150/mo",  "$458/mo","$1,000+/seat"],
                  ] as [string, string, string, string, string, string][]).map(([feature, ...vals]) => (
                    <tr key={feature} style={{ borderBottom: "1px solid #F0EDE8" }}>
                      <td style={{ ...td, textAlign: "left", color: "#1C1917", fontWeight: 500 }}>{feature}</td>
                      {vals.map((v, i) => <TC key={i} v={v} />)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="px-faq">
            <h2 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#1C1917", margin: "0 0 0.5rem", letterSpacing: "-0.03em", textAlign: "center" }}>
              Common questions
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#8A7F74", textAlign: "center", margin: "0 0 2rem" }}>
              Everything you need to know before you sign up.
            </p>

            {FAQ.map((item, i) => (
              <div key={i} className="px-faq-item">
                <button
                  className="px-faq-btn"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1C1917" }}>{item.q}</span>
                  <span style={{ color: "#8A7F74", fontSize: "1.1rem", flexShrink: 0, transition: "transform 0.15s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)", display: "inline-block", lineHeight: 1 }}>+</span>
                </button>
                {openFaq === i && (
                  <p style={{ fontSize: "0.875rem", color: "#5A534A", lineHeight: 1.65, margin: "0 0 1.25rem", paddingRight: "2rem" }}>
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{ textAlign: "center", padding: "1rem 0 2rem" }}>
            <p style={{ fontSize: "1.0625rem", color: "#1C1917", fontWeight: 600, maxWidth: "520px", margin: "0 auto 0.75rem", lineHeight: 1.5 }}>
              Most contractors spend 3 to 5 hours per week checking portals manually. That time disappears on Day 1.
            </p>
            <p style={{ fontSize: "0.9rem", color: "#8A7F74", maxWidth: "440px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
              Your first matched contracts arrive at 6 AM the morning after you sign up. Questions first?{" "}
              <a href="mailto:support@plexovia.com" style={{ color: "#B8860B", textDecoration: "none", fontWeight: 500 }}>
                Email support@plexovia.com
              </a>
            </p>
            <Link href="/auth/signup" style={{ ...ctaBtn, display: "inline-flex", padding: "14px 40px", fontSize: "1.0625rem" }}>
              Start Your Free Trial
            </Link>
            <p style={{ fontSize: "0.8125rem", color: "#8A7F74", marginTop: "0.75rem" }}>
              No charge until Day 8. Cancel anytime. No annual contract.
            </p>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="px-footer">
          {[
            { href: "/legal/terms",   label: "Terms of Service" },
            { href: "/legal/privacy", label: "Privacy Policy" },
            { href: "/legal/refund",  label: "Refund Policy" },
            { href: "/",              label: "Home" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ fontSize: "0.8125rem", color: "#8A7F74", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </footer>
      </div>
    </>
  );
}

/* ─── Shared styles ─────────────────────────────────────── */
const ctaBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "13px 20px",
  background: "#1C1917",
  color: "#F7F5F0",
  border: "1px solid #1C1917",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "0.9375rem",
  textDecoration: "none",
  fontFamily: "var(--font-inter), sans-serif",
  cursor: "pointer",
  letterSpacing: "-0.01em",
  minHeight: "48px",
};

const th: React.CSSProperties = {
  padding: "0.875rem 1rem",
  fontSize: "0.78125rem",
  fontWeight: 700,
  color: "#8A7F74",
  textAlign: "center",
  background: "#F7F5F0",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "0.6875rem 1rem",
  textAlign: "center",
  verticalAlign: "middle",
};
