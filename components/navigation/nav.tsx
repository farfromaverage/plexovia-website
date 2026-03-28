"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

function MagneticCTA({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.2); // dampen the effect
    y.set((clientY - centerY) * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
}

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const background = useTransform(
    scrollY,
    [0, 20],
    ["rgba(247, 245, 240, 0)", "rgba(247, 245, 240, 0.85)"]
  );
  const backdropFilter = useTransform(
    scrollY,
    [0, 20],
    ["blur(0px)", "blur(12px)"]
  );
  const borderBottom = useTransform(
    scrollY,
    [0, 20],
    ["1px solid rgba(226, 221, 214, 0)", "1px solid rgba(226, 221, 214, 1)"]
  );

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
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-colors"
      style={{ background, backdropFilter, borderBottom }}
      role="banner"
    >
      <nav className="max-w-[1200px] mx-auto px-6 h-16 flex items-center relative" aria-label="Main navigation">
        {/* ── Wordmark ── */}
        <Link href="/" aria-label="Plexovia homepage" className="no-underline z-10">
          <span
            className="flex items-center text-[1.45rem] font-bold tracking-tighter"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#C9A84C" }}>P</span>
            <span style={{ color: "#1C1917" }}>lexovia</span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <ul
          className="hidden md:flex items-center gap-1 list-none p-0 m-0 absolute left-1/2 -translate-x-1/2"
          role="list"
        >
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="px-3 py-2 rounded-md font-medium text-sm text-[var(--pub-muted)] hover:text-[var(--pub-text)] transition-colors inline-block"
                style={{ fontFamily: "var(--font-inter), sans-serif" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Desktop CTA group ── */}
        <div className="hidden md:flex items-center gap-4 ml-auto z-10">
          <Link
            href="/auth/login"
            className="font-medium text-[var(--pub-muted)] hover:text-[var(--pub-text)] transition-colors text-sm"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
          >
            Sign In
          </Link>
          <MagneticCTA>
            <Link href="/auth/signup" className="btn-gold !text-[0.875rem] !py-2 !px-5 shadow-sm hover:shadow-md transition-shadow">
              Start Free Trial
            </Link>
          </MagneticCTA>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className="md:hidden ml-auto flex flex-col justify-center items-center gap-[5px] w-10 h-10 p-2 rounded-md hover:bg-[var(--pub-surface-2)] transition-colors z-10 border-none bg-transparent cursor-pointer"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span
            className={`block w-[20px] h-[1.5px] bg-[var(--pub-text)] rounded-[2px] transition-transform duration-200 origin-center ${
              mobileOpen ? "translate-y-[6.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block w-[20px] h-[1.5px] bg-[var(--pub-text)] rounded-[2px] transition-opacity duration-200 origin-center ${
              mobileOpen ? "opacity-0 scale-x-0" : ""
            }`}
          />
          <span
            className={`block w-[20px] h-[1.5px] bg-[var(--pub-text)] rounded-[2px] transition-transform duration-200 origin-center ${
              mobileOpen ? "-translate-y-[6.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id="mobile-nav-drawer"
            className="md:hidden bg-[var(--pub-bg)] border-y border-[var(--pub-border)] px-6 pt-4 pb-6 flex flex-col gap-1 shadow-md absolute w-full"
            role="dialog"
            aria-label="Navigation menu"
          >
            <ul role="list" className="list-none m-0 p-0 mb-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-3.5 border-b border-[var(--pub-border)] font-medium text-[var(--pub-muted)] hover:text-[var(--pub-text)] transition-colors text-base"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/auth/login"
                  className="block py-3.5 border-b border-[var(--pub-border)] font-medium text-[var(--pub-muted)] hover:text-[var(--pub-text)] transition-colors text-base"
                  style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
              </li>
            </ul>
            <Link
              href="/auth/signup"
              className="btn-gold w-full text-center mt-2 shadow-sm py-[0.75rem]"
              onClick={() => setMobileOpen(false)}
            >
              Start Free Trial
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
