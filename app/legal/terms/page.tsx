import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Plexovia",
  description: "Plexovia Terms of Service — governing your use of the Plexovia government contract monitoring platform.",
};

const EFFECTIVE_DATE = "March 26, 2026";
const COMPANY       = "Plexovia";
const EMAIL         = "support@plexovia.com";
const SITE          = "plexovia.com";

export default function TermsPage() {
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
        <p style={label}>Legal</p>
        <h1 style={h1}>Terms of Service</h1>
        <p style={meta}>Effective date: {EFFECTIVE_DATE}</p>

        <Section title="1. Agreement to Terms">
          <p>By accessing or using {COMPANY} at {SITE}, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>{COMPANY} is a government contract monitoring platform that delivers matched federal, state, and county contract opportunities to subscribers via email. The service scans publicly available procurement portals and matches opportunities against user-configured NAICS codes, states, and keywords.</p>
        </Section>

        <Section title="3. Subscriptions and Billing">
          <p>{COMPANY} offers paid subscription plans billed monthly or annually. All plans include a 14-day free trial. Your credit card is not charged until Day 15 of the trial period.</p>
          <p>Subscriptions automatically renew at the end of each billing period. You may cancel at any time from your account settings. Cancellation takes effect at the end of the current paid period.</p>
          <p>All prices are listed in United States Dollars. Applicable taxes may be added at checkout based on your location.</p>
        </Section>

        <Section title="4. Refund Policy">
          <p>If you are not satisfied with {COMPANY} within the first 7 days of a paid subscription (after the trial period), you may request a full refund by emailing {EMAIL}. Refunds are not available after 7 days of a paid period unless required by applicable law. See our <Link href="/legal/refund" style={link}>Refund Policy</Link> for full details.</p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use {COMPANY} to:</p>
          <ul style={list}>
            <li>Resell, sublicense, or redistribute service output without written permission</li>
            <li>Attempt to reverse-engineer, scrape, or copy the platform infrastructure</li>
            <li>Use the service for any unlawful purpose</li>
            <li>Interfere with or disrupt the integrity of the service</li>
          </ul>
        </Section>

        <Section title="6. Data Accuracy">
          <p>{COMPANY} aggregates publicly available government procurement data. We do not guarantee the completeness, accuracy, or timeliness of any contract opportunity delivered through the service. Users are responsible for independently verifying all opportunities before acting on them.</p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>The {COMPANY} platform, branding, software, and all associated materials are owned by {COMPANY} and protected by applicable intellectual property laws. Contract opportunity data sourced from government portals is public domain. AI match scores, interface design, and proprietary matching logic remain the exclusive property of {COMPANY}.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>To the maximum extent permitted by law, {COMPANY} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the service, including any lost profits or contracts. Our total liability to you for any claim arising from these Terms shall not exceed the total amount you paid to {COMPANY} in the 12 months preceding the claim.</p>
        </Section>

        <Section title="9. Termination">
          <p>{COMPANY} reserves the right to suspend or terminate your account at any time for violation of these Terms. You may cancel your account at any time. Upon termination, your right to use the service ends immediately.</p>
        </Section>

        <Section title="10. Governing Law">
          <p>These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.</p>
        </Section>

        <Section title="11. Changes to Terms">
          <p>We reserve the right to modify these Terms at any time. We will notify you of material changes via email or a notice on the platform. Continued use of the service after the effective date of any change constitutes acceptance of the revised Terms.</p>
        </Section>

        <Section title="12. Contact">
          <p>Questions about these Terms? Email us at <a href={`mailto:${EMAIL}`} style={link}>{EMAIL}</a>.</p>
        </Section>

      <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--pub-border)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/legal/privacy" style={link}>Privacy Policy</Link>
          <Link href="/legal/refund" style={link}>Refund Policy</Link>
          <Link href="/" style={link}>Back to {COMPANY}</Link>
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--pub-bg)",
  fontFamily: "var(--font-inter), sans-serif",
};
const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1.25rem 2rem",
  borderBottom: "1px solid var(--pub-border)",
  position: "sticky",
  top: 0,
  background: "var(--pub-bg)",
  zIndex: 50,
};
const main: React.CSSProperties = {
  maxWidth: "720px",
  margin: "0 auto",
  padding: "3rem 2rem 5rem",
};
const label: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--accent)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  margin: "0 0 0.5rem",
};
const h1: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "2rem",
  color: "var(--pub-text)",
  letterSpacing: "-0.04em",
  margin: "0 0 0.5rem",
};
const meta: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--pub-muted)",
  margin: "0 0 2.5rem",
};
const h2: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "1rem",
  color: "var(--pub-text)",
  margin: "0 0 0.5rem",
};
const body: React.CSSProperties = {
  fontSize: "0.9375rem",
  color: "var(--pub-muted)",
  lineHeight: 1.7,
};
const list: React.CSSProperties = {
  paddingLeft: "1.25rem",
  margin: "0.5rem 0",
  color: "var(--pub-muted)",
  lineHeight: 1.8,
};
const link: React.CSSProperties = {
  color: "var(--accent)",
  textDecoration: "none",
  fontWeight: 500,
};
const navLink: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--pub-muted)",
  textDecoration: "none",
};
