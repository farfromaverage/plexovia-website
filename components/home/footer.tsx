"use client";

import Link from "next/link";


/* ─────────────────────────────────────────────────────────
   Footer — 4-column dark layout
   Background: #1C1917 (warm near-black, 1 step above Final CTA)
   Structure: Brand | Product | Legal | Contact
   Bottom bar: copyright + government disclaimer
───────────────────────────────────────────────────────── */

const NAV_PRODUCT = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing",      href: "/pricing" },
  { label: "FAQ",          href: "/#faq" },
  { label: "Changelog",    href: "/changelog" },
];

const NAV_LEGAL = [
  { label: "Privacy Policy",    href: "/privacy" },
  { label: "Terms of Service",  href: "/terms" },
  { label: "Cookie Policy",     href: "/cookies" },
  { label: "Refund Policy",     href: "/refunds" },
];

const NAV_CONTACT = [
  { label: "support@plexovia.com", href: "mailto:support@plexovia.com" },
  { label: "Request a Feature",    href: "https://plexovia.canny.io" },
  { label: "System Status",        href: "https://status.plexovia.com" },
];

/* Shared link styles */
const LINK_STYLE: React.CSSProperties = {
  fontFamily:     "var(--font-inter), sans-serif",
  fontSize:       "0.875rem",
  fontWeight:     400,
  color:          "#6B6560",
  textDecoration: "none",
  lineHeight:     1.5,
  transition:     "color 0.15s ease",
  display:        "block",
};

const COL_HEADING: React.CSSProperties = {
  fontFamily:    "var(--font-geist-mono), monospace",
  fontSize:      "0.6875rem",
  fontWeight:    500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color:         "#A8A29E",
  marginBottom:  "1rem",
  display:       "block",
};

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <span style={COL_HEADING}>{heading}</span>
      <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              style={LINK_STYLE}
              /* Inline hover via onMouse since CSS pseudo isn't in inline styles */
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#D4CFC9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#6B6560"; }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: "#1C1917",
        borderTop:       "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Main grid ── */}
      <div
        style={{
          maxWidth: "1200px",
          margin:   "0 auto",
          padding:  "4rem 1.5rem 3rem",
          display:  "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap:      "3rem",
        }}
      >

        {/* Column 1 — Brand */}
        <div style={{ gridColumn: "1 / -1", maxWidth: "280px" }}>
          <Link
            href="/"
            aria-label="Plexovia homepage"
            style={{ textDecoration: "none", display: "block", marginBottom: "1rem" }}
          >
            <span
              style={{
                fontFamily:    "var(--font-inter), -apple-system, sans-serif",
                fontWeight:    800,
                fontSize:      "1.35rem",
                letterSpacing: "-0.05em",
                lineHeight:    1,
              }}
            >
              <span style={{ color: "#C9A84C" }}>P</span>
              <span style={{ color: "#F7F5F0" }}>lexovia</span>
            </span>
          </Link>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.875rem",
              fontWeight: 400,
              color:      "#6B6560",
              lineHeight: 1.65,
              marginBottom: "1.25rem",
            }}
          >
            Government contract monitoring for all 50 states.
            Scored alerts delivered to your inbox. No login required.
          </p>
          <Link
            href="/auth/signup"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.375rem",
              fontFamily:      "var(--font-inter), sans-serif",
              fontSize:        "0.8125rem",
              fontWeight:      600,
              color:           "#C9A84C",
              textDecoration:  "none",
              letterSpacing:   "-0.01em",
              transition:      "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.75"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          >
            Start free trial →
          </Link>
        </div>

        {/* Column 2 — Product */}
        <FooterCol heading="Product" links={NAV_PRODUCT} />

        {/* Column 3 — Legal */}
        <FooterCol heading="Legal" links={NAV_LEGAL} />

        {/* Column 4 — Contact */}
        <FooterCol heading="Contact & Support" links={NAV_CONTACT} />
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          borderTop:  "1px solid rgba(255,255,255,0.06)",
          padding:    "1.25rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth:       "1200px",
            margin:         "0 auto",
            display:        "flex",
            flexWrap:       "wrap",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            "0.75rem",
          }}
        >
          {/* Copyright */}
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.75rem",
              color:      "#4B4744",
              lineHeight: 1.5,
            }}
          >
            © {year} Plexovia, Inc. All rights reserved.
          </p>

          {/* Government disclaimer */}
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.6875rem",
              color:      "#4B4744",
              lineHeight: 1.5,
              maxWidth:   "480px",
              textAlign:  "right",
            }}
          >
            Not affiliated with, endorsed by, or sponsored by SAM.gov, GSA, or
            any federal or state government agency. Contract data is sourced from
            publicly available procurement portals.
          </p>
        </div>
      </div>
    </footer>
  );
}
