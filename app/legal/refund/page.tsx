import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Plexovia",
  description: "Plexovia Refund Policy — when and how to request a refund.",
};

const EFFECTIVE_DATE = "March 26, 2026";
const COMPANY       = "Plexovia";
const EMAIL         = "support@plexovia.com";

export default function RefundPage() {
  return (
    <div style={page}>
      <header style={header}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.05em", fontFamily: "var(--font-inter), sans-serif" }}>
            <span style={{ color: "#C9A84C" }}>P</span>
            <span style={{ color: "var(--pub-text)" }}>lexovia</span>
          </span>
        </Link>
        <Link href="/" style={navLink}>Back to Home</Link>
      </header>

      <main style={main}>
        <p style={labelStyle}>Legal</p>
        <h1 style={h1}>Refund Policy</h1>
        <p style={metaStyle}>Effective date: {EFFECTIVE_DATE}</p>

        <Section title="Our Commitment">
          <p>We want every {COMPANY} customer to feel confident in their purchase. If our platform does not deliver the value you expected, we want to make it right.</p>
        </Section>

        <Section title="Free Trial">
          <p>Every new {COMPANY} subscription starts with a 14-day free trial. Your payment method is not charged until Day 15. You can cancel at any time during the trial with no charge. No refund is needed for trial cancellations because you are never billed.</p>
        </Section>

        <Section title="Paid Subscription Refunds">
          <p>If you are charged and are not satisfied with the service, you may request a full refund within 7 days of the charge date by emailing <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>.</p>
          <p>To qualify for a refund:</p>
          <ul style={list}>
            <li>Your refund request must be received within 7 calendar days of the billing date</li>
            <li>You must have completed the onboarding profile (NAICS codes and states configured)</li>
            <li>You must not have previously received a refund for a {COMPANY} subscription</li>
          </ul>
          <p>Approved refunds are returned to the original payment method within 5 to 10 business days.</p>
        </Section>

        <Section title="Non-Refundable Situations">
          <p>Refunds are not issued in the following cases:</p>
          <ul style={list}>
            <li>Requests received more than 7 days after the billing date</li>
            <li>Partial billing period refunds after a cancellation mid-cycle</li>
            <li>Annual plan purchases more than 7 days old (unless required by applicable law)</li>
            <li>Accounts terminated for violation of our Terms of Service</li>
          </ul>
        </Section>

        <Section title="Annual Plans">
          <p>Annual subscriptions are eligible for a full refund within 7 days of the initial purchase date. After 7 days, annual plans are non-refundable but you retain access to the service through the end of the paid period.</p>
        </Section>

        <Section title="How to Request a Refund">
          <p>Email <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a> with the subject line "Refund Request" and include:</p>
          <ul style={list}>
            <li>The email address on your {COMPANY} account</li>
            <li>The date of the charge</li>
            <li>A brief description of why the service did not meet your expectations</li>
          </ul>
          <p>We will respond within 2 business days and process any approved refund promptly.</p>
        </Section>

        <Section title="Questions">
          <p>If you have questions about this policy, email us at <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>.</p>
        </Section>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--pub-border)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/legal/terms" style={linkStyle}>Terms of Service</Link>
          <Link href="/legal/privacy" style={linkStyle}>Privacy Policy</Link>
          <Link href="/" style={linkStyle}>Back to {COMPANY}</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={h2}>{title}</h2>
      <div style={body}>{children}</div>
    </section>
  );
}

const page: React.CSSProperties       = { minHeight: "100vh", background: "var(--pub-bg)", fontFamily: "var(--font-inter), sans-serif" };
const header: React.CSSProperties     = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid var(--pub-border)", position: "sticky", top: 0, background: "var(--pub-bg)", zIndex: 50 };
const main: React.CSSProperties       = { maxWidth: "720px", margin: "0 auto", padding: "3rem 2rem 5rem" };
const labelStyle: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.5rem" };
const h1: React.CSSProperties         = { fontWeight: 800, fontSize: "2rem", color: "var(--pub-text)", letterSpacing: "-0.04em", margin: "0 0 0.5rem" };
const metaStyle: React.CSSProperties  = { fontSize: "0.875rem", color: "var(--pub-muted)", margin: "0 0 2.5rem" };
const h2: React.CSSProperties         = { fontWeight: 700, fontSize: "1rem", color: "var(--pub-text)", margin: "0 0 0.5rem" };
const body: React.CSSProperties       = { fontSize: "0.9375rem", color: "var(--pub-muted)", lineHeight: 1.7 };
const list: React.CSSProperties       = { paddingLeft: "1.25rem", margin: "0.5rem 0", color: "var(--pub-muted)", lineHeight: 1.8 };
const linkStyle: React.CSSProperties  = { color: "var(--accent)", textDecoration: "none", fontWeight: 500 };
const navLink: React.CSSProperties    = { fontSize: "0.875rem", color: "var(--pub-muted)", textDecoration: "none" };
