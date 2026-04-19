import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Plexovia",
  description: "Plexovia Privacy Policy — how we collect, use, and protect your data.",
};

const EFFECTIVE_DATE = "March 26, 2026";
const COMPANY       = "Plexovia";
const EMAIL         = "support@plexovia.com";

export default function PrivacyPage() {
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
        <h1 style={h1}>Privacy Policy</h1>
        <p style={meta}>Effective date: {EFFECTIVE_DATE}</p>

        <Section title="1. Information We Collect">
          <p>When you create a {COMPANY} account, we collect:</p>
          <ul style={list}>
            <li>Your email address and password (or OAuth identity if you use Google Sign-In)</li>
            <li>Your company name (optional, provided during onboarding)</li>
            <li>Your monitoring preferences: NAICS codes, states, keywords, and set-aside designations</li>
            <li>Subscription and billing data managed through our payment processor (LemonSqueezy)</li>
          </ul>
          <p>When you use the service, we may also collect usage data such as pages visited, features used, and session timestamps. We do not collect or store payment card information directly.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul style={list}>
            <li>Surface daily contract matches in your dashboard based on your monitoring profile</li>
            <li>Operate, maintain, and improve the {COMPANY} platform</li>
            <li>Process payments and manage your subscription</li>
            <li>Send transactional emails such as welcome messages, trial reminders, and billing notifications</li>
            <li>Respond to your support requests</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>We do not sell your personal data to third parties. We do not use your data for advertising purposes.</p>
        </Section>

        <Section title="3. Data Storage and Security">
          <p>Your data is stored in a Supabase PostgreSQL database hosted on AWS infrastructure. We use industry-standard encryption in transit (TLS) and at rest. Access to your data is restricted to authorized personnel only.</p>
          <p>While we take security seriously, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.</p>
        </Section>

        <Section title="4. Your Monitoring Profile">
          <p>The NAICS codes, states, keywords, and set-aside preferences you provide are used exclusively to match government procurement opportunities on your behalf. This data is stored in your profile and can be updated or deleted at any time through the dashboard.</p>
        </Section>

        <Section title="5. Email Communications">
          <p>By creating an account, you consent to receiving transactional emails from {COMPANY}, including welcome messages, trial reminders, and billing notifications. Contract matches are delivered through your dashboard, not by email. You cannot opt out of critical account emails such as billing receipts and password resets.</p>
        </Section>

        <Section title="6. Third-Party Services">
          <p>We use the following third-party services to operate the platform:</p>
          <ul style={list}>
            <li>Supabase (authentication and database)</li>
            <li>LemonSqueezy (payment processing and subscription management)</li>
            <li>Resend (transactional email delivery)</li>
          </ul>
          <p>Each of these providers has their own privacy policy governing data they process. We do not share your data beyond what is necessary to operate these integrations.</p>
        </Section>

        <Section title="7. Cookies">
          <p>We use session cookies to maintain your authenticated state. We do not use advertising or tracking cookies. Browser local storage may be used to persist UI preferences.</p>
        </Section>

        <Section title="8. Data Retention">
          <p>We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law or to resolve disputes.</p>
        </Section>

        <Section title="9. Your Rights">
          <p>Depending on your location, you may have rights to access, correct, delete, or export your personal data. To exercise any of these rights, email us at <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>. We will respond within 30 days.</p>
        </Section>

        <Section title="10. Children">
          <p>{COMPANY} is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, contact us and we will delete it.</p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or a notice on the platform. Your continued use of the service after changes become effective constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="12. Contact">
          <p>Questions about this Privacy Policy? Email us at <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>.</p>
        </Section>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid #252320", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/legal/terms" style={linkStyle}>Terms of Service</Link>
          <Link href="/legal/refund" style={linkStyle}>Refund Policy</Link>
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

const page: React.CSSProperties        = { minHeight: "100vh", background: "var(--pub-bg)", fontFamily: "var(--font-inter), sans-serif" };
const header: React.CSSProperties      = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid var(--pub-border)", position: "sticky", top: 0, background: "var(--pub-bg)", zIndex: 50 };
const main: React.CSSProperties        = { maxWidth: "720px", margin: "0 auto", padding: "3rem 2rem 5rem" };
const labelStyle: React.CSSProperties  = { fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 0.5rem" };
const h1: React.CSSProperties          = { fontWeight: 800, fontSize: "2rem", color: "var(--pub-text)", letterSpacing: "-0.04em", margin: "0 0 0.5rem" };
const meta: React.CSSProperties        = { fontSize: "0.875rem", color: "var(--pub-muted)", margin: "0 0 2.5rem" };
const h2: React.CSSProperties          = { fontWeight: 700, fontSize: "1rem", color: "var(--pub-text)", margin: "0 0 0.5rem" };
const body: React.CSSProperties        = { fontSize: "0.9375rem", color: "var(--pub-muted)", lineHeight: 1.7 };
const list: React.CSSProperties        = { paddingLeft: "1.25rem", margin: "0.5rem 0", color: "var(--pub-muted)", lineHeight: 1.8 };
const linkStyle: React.CSSProperties   = { color: "var(--accent)", textDecoration: "none", fontWeight: 500 };
const navLink: React.CSSProperties     = { fontSize: "0.875rem", color: "var(--pub-muted)", textDecoration: "none" };
