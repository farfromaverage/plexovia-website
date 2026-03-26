import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Plexovia",
  description:
    "Plexovia uses a minimal set of cookies required to keep you signed in and measure basic performance. No advertising trackers.",
  alternates: { canonical: "https://plexovia.com/legal/cookies" },
};

const SECTION: React.CSSProperties = {
  marginBottom: "2.5rem",
};

const H2: React.CSSProperties = {
  fontFamily:    "var(--font-inter), sans-serif",
  fontWeight:    700,
  fontSize:      "1.125rem",
  letterSpacing: "-0.02em",
  color:         "var(--pub-text)",
  marginBottom:  "0.75rem",
};

const P: React.CSSProperties = {
  fontFamily: "var(--font-inter), sans-serif",
  fontSize:   "0.9375rem",
  color:      "var(--pub-muted)",
  lineHeight: 1.7,
  marginBottom: "1rem",
};

export default function CookiePolicyPage() {
  return (
    <div style={{ backgroundColor: "var(--pub-bg)", minHeight: "100dvh" }}>
      <main
        style={{
          maxWidth:     "720px",
          margin:       "0 auto",
          padding:      "clamp(6rem, 10vw, 9rem) 1.5rem 5rem",
        }}
      >
        {/* Header */}
        <p
          style={{
            fontFamily:    "var(--font-geist-mono), monospace",
            fontSize:      "0.6875rem",
            fontWeight:    500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color:         "var(--accent)",
            marginBottom:  "1rem",
          }}
        >
          Legal
        </p>
        <h1
          style={{
            fontFamily:    "var(--font-inter), sans-serif",
            fontWeight:    800,
            fontSize:      "clamp(1.75rem, 3.5vw, 2.5rem)",
            letterSpacing: "-0.05em",
            lineHeight:    1.1,
            color:         "var(--pub-text)",
            marginBottom:  "0.5rem",
          }}
        >
          Cookie Policy
        </h1>
        <p style={{ ...P, color: "var(--pub-faint)", marginBottom: "3rem" }}>
          Last updated: March 2026
        </p>

        <div style={SECTION}>
          <h2 style={H2}>What are cookies?</h2>
          <p style={P}>
            Cookies are small text files stored in your browser when you visit a website.
            They allow the site to remember your preferences and session state across page loads.
          </p>
        </div>

        <div style={SECTION}>
          <h2 style={H2}>What cookies does Plexovia use?</h2>
          <p style={P}>
            Plexovia uses a minimal set of cookies necessary to operate the service. We do not use advertising trackers or sell data to third parties.
          </p>
          <table
            style={{
              width:          "100%",
              borderCollapse: "collapse",
              fontFamily:     "var(--font-inter), sans-serif",
              fontSize:       "0.875rem",
              marginBottom:   "1rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--pub-border)" }}>
                {["Cookie", "Purpose", "Duration"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign:    "left",
                      padding:      "0.625rem 0.75rem",
                      fontWeight:   600,
                      color:        "var(--pub-text)",
                      background:   "var(--pub-surface-2)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["sb-auth-token", "Keeps you signed in to your Plexovia account", "Session"],
                ["plx_csrf", "Protects form submissions against cross-site forgery", "Session"],
                ["plx_prefs", "Remembers your UI preferences such as billing toggle state", "30 days"],
              ].map(([name, purpose, duration]) => (
                <tr
                  key={name}
                  style={{ borderBottom: "1px solid var(--pub-border)" }}
                >
                  <td style={{ padding: "0.625rem 0.75rem", fontFamily: "var(--font-geist-mono), monospace", fontSize: "0.8125rem", color: "var(--pub-text)" }}>{name}</td>
                  <td style={{ padding: "0.625rem 0.75rem", color: "var(--pub-muted)" }}>{purpose}</td>
                  <td style={{ padding: "0.625rem 0.75rem", color: "var(--pub-muted)" }}>{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={SECTION}>
          <h2 style={H2}>Analytics</h2>
          <p style={P}>
            We use anonymized, privacy-preserving analytics to understand how visitors use the site.
            No personally identifiable information is collected in analytics data. No cross-site tracking occurs.
          </p>
        </div>

        <div style={SECTION}>
          <h2 style={H2}>How to control cookies</h2>
          <p style={P}>
            You can block or delete cookies through your browser settings at any time.
            Note that disabling the authentication cookie will sign you out of your account.
            Most browsers allow you to clear cookies under Settings and then Privacy and Security.
          </p>
        </div>

        <div style={SECTION}>
          <h2 style={H2}>Questions</h2>
          <p style={P}>
            Email{" "}
            <a
              href="mailto:support@plexovia.com"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
            >
              support@plexovia.com
            </a>{" "}
            with any questions about how we use cookies.
          </p>
        </div>

        <div
          style={{
            borderTop:  "1px solid var(--pub-border)",
            paddingTop: "2rem",
            display:    "flex",
            gap:        "1.5rem",
            flexWrap:   "wrap",
          }}
        >
          {[
            { label: "Privacy Policy",   href: "/legal/privacy" },
            { label: "Terms of Service", href: "/legal/terms" },
            { label: "Refund Policy",    href: "/legal/refund" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily:     "var(--font-inter), sans-serif",
                fontSize:       "0.875rem",
                color:          "var(--pub-muted)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
