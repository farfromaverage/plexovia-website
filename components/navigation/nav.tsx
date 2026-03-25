"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll(); // run immediately in case page loads mid-scroll
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close drawer on desktop resize ── */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Prevent body scroll when drawer open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={`nav-root${scrolled ? " nav-scrolled" : ""}`}
      role="banner"
    >
      <nav className="nav-inner" aria-label="Main navigation">

        {/* ── Wordmark ── */}
        <Link
          href="/"
          aria-label="Plexovia homepage"
          style={{ textDecoration: "none" }}
        >
          <span
            style={{
              fontFamily:    "var(--font-inter), -apple-system, sans-serif",
              fontWeight:    800,
              fontSize:      "1.45rem",
              letterSpacing: "-0.05em",
              lineHeight:    1,
              display:       "block",
            }}
          >
            <span style={{ color: "#C9A84C" }}>P</span>
            <span style={{ color: "#1C1917" }}>lexovia</span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className="nav-links" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="nav-link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Desktop CTA group ── */}
        <div className="nav-cta-group">
          <Link href="/auth/login" className="nav-link">
            Sign In
          </Link>
          <Link href="/auth/signup" className="btn-gold nav-cta">
            Start Free Trial
          </Link>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className="nav-hamburger"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className={`ham-line${mobileOpen ? " ham-open-1" : ""}`} />
          <span className={`ham-line${mobileOpen ? " ham-open-2" : ""}`} />
          <span className={`ham-line${mobileOpen ? " ham-open-3" : ""}`} />
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          className="nav-mobile-drawer"
          role="dialog"
          aria-label="Navigation menu"
        >
          <ul role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/auth/login"
                className="nav-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
            </li>
          </ul>
          <Link
            href="/auth/signup"
            className="btn-gold nav-mobile-cta"
            onClick={() => setMobileOpen(false)}
          >
            Start Free Trial
          </Link>
        </div>
      )}
    </header>
  );
}
