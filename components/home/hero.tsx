"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { fadeInUp, stagger, viewportConfig } from "@/lib/motion";
import MatchScoreBadge from "@/components/ui/match-score-badge";

/* ── Simulated email digest preview data ── */
const mockMatches = [
  {
    id:     "fdic-001",
    score:  94,
    title:  "Network Infrastructure Modernization",
    agency: "FDIC (Federal Deposit Insurance Corp)",
    state:  "VA",
    due:    "Apr 30, 2026",
    naics:  "541511",
  },
  {
    id:     "navy-002",
    score:  71,
    title:  "Facilities Management Services",
    agency: "Naval Surface Warfare Center",
    state:  "MD",
    due:    "May 12, 2026",
    naics:  "561210",
  },
  {
    id:     "gsa-003",
    score:  58,
    title:  "IT Security Assessment Support",
    agency: "GSA (Federal Acquisition Service)",
    state:  "DC",
    due:    "May 24, 2026",
    naics:  "541519",
  },
];

function EmailMockup() {
  const mockupRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mockupRef,
    offset:  ["start end", "end start"],
  });

  /* Parallax: floats up as page scrolls down */
  const rawY  = useTransform(scrollYProgress, [0, 1], [0, -55]);
  const floatY = useSpring(rawY, { stiffness: 80, damping: 22 });

  const badgeVariants = {
    hidden:  { opacity: 0, scale: 0.85, y: 6 },
    visible: (i: number) => ({
      opacity: 1,
      scale:   1,
      y:       0,
      transition: {
        delay:    0.45 + i * 0.1,
        duration: 0.4,
        ease:     [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    }),
  };

  return (
    <motion.div
      ref={mockupRef}
      style={{ y: floatY }}
      className="relative w-full max-w-md select-none"
      aria-hidden="true"
    >
      {/* Email client chrome */}
      <div
        className="
          rounded-2xl overflow-hidden
          shadow-[0_24px_80px_-12px_rgba(28,25,23,0.20),0_4px_16px_-4px_rgba(28,25,23,0.08)]
          border border-[#E2DDD6]
          bg-white
        "
      >
        {/* Email header bar */}
        <div className="bg-[#F0EDE7] px-5 py-3.5 border-b border-[#E2DDD6]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]/40" />
          </div>
          <div className="text-xs text-[#6B6560]">
            <span className="font-medium text-[#1C1917]">From:</span>{" "}
            alerts@plexovia.com
          </div>
          <div className="mt-0.5 text-xs text-[#6B6560]">
            <span className="font-medium text-[#1C1917]">Subject:</span>{" "}
            3 contracts match your profile | Thu, Mar 27
          </div>
        </div>

        {/* Email body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-[#6B6560] font-medium">
            Good morning. Here are today&apos;s matches for NAICS 541511, 561210, 541519.
          </p>

          {mockMatches.map((match, i) => (
            <motion.div
              key={match.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={badgeVariants}
              className="
                rounded-xl border border-[#E2DDD6] bg-[#F7F5F0]
                px-4 py-3 flex items-start gap-3
              "
            >
              <MatchScoreBadge score={match.score} className="mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1C1917] leading-snug truncate">
                  {match.title}
                </p>
                <p className="text-xs text-[#6B6560] mt-0.5 truncate">{match.agency}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-mono text-[#A8A29E]">{match.state}</span>
                  <span className="text-[#E2DDD6]">·</span>
                  <span className="text-xs text-[#A8A29E]">Due {match.due}</span>
                  <span className="text-[#E2DDD6]">·</span>
                  <span className="text-xs font-mono text-[#A8A29E]">{match.naics}</span>
                </div>
              </div>
            </motion.div>
          ))}

          <p className="text-xs text-[#A8A29E] pt-1">
            Alerts sent daily by 6 AM.{" "}
            <span className="text-[#C9A84C] font-medium underline decoration-dotted cursor-pointer">
              View all matches
            </span>
          </p>
        </div>
      </div>

      {/* Decorative glow behind card */}
      <div
        className="absolute -inset-8 -z-10 rounded-3xl opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, #C9A84C22 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

export default function Hero() {
  const trustPoints = [
    "Takes 3 minutes to set up.",
    "Credit card required. No charge until Day 8.",
    "Cancel anytime. No annual contract.",
  ];

  return (
    <section
      id="hero"
      className="
        relative pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-40 lg:pb-32
        px-5 sm:px-8 lg:px-12
        overflow-hidden
      "
      aria-label="Hero"
    >
      {/* Parchment grain texture */}
      <div className="grain absolute inset-0 -z-10" aria-hidden="true" />

      {/* Warm radial bg */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #F0EDE7 0%, #F7F5F0 70%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── Left: copy ── */}
          <motion.div
            className="flex-1 max-w-2xl lg:max-w-none w-full"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Eyebrow */}
            <motion.div variants={fadeInUp}>
              <span
                className="
                  inline-flex items-center gap-1.5
                  text-xs font-semibold tracking-widest uppercase
                  text-[#C9A84C] mb-6
                "
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse"
                  aria-hidden="true"
                />
                Government Contract Monitoring
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={fadeInUp}
              className="
                text-4xl sm:text-5xl lg:text-6xl
                text-[#1C1917] leading-[1.1] mb-6
              "
            >
              Every contract
              <br />
              matching your
              <br />
              <span className="text-[#C9A84C]">NAICS codes.</span>
              <br />
              In your inbox by 6 AM.
            </motion.h1>

            {/* Subline */}
            <motion.p
              variants={fadeInUp}
              className="
                text-lg sm:text-xl text-[#6B6560]
                leading-relaxed max-w-xl mb-8
              "
            >
              Plexovia monitors SAM.gov and all 50 state portals every night.
              You wake up to a ranked list of contracts you can actually win.
              Your competitor is already doing this. Now you can too.
            </motion.p>

            {/* CTA group */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
            >
              <Link
                href="/auth/signup"
                id="hero-cta"
                className="btn-gold text-base px-7 py-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Start Your Free 7-Day Trial
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/pricing"
                className="
                  text-sm font-medium text-[#6B6560]
                  hover:text-[#1C1917] transition-colors
                  underline decoration-[#E2DDD6] underline-offset-4
                "
              >
                See pricing
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.ul
              variants={stagger}
              className="flex flex-col sm:flex-row flex-wrap gap-x-5 gap-y-2"
              role="list"
            >
              {trustPoints.map((point) => (
                <motion.li
                  key={point}
                  variants={fadeInUp}
                  className="flex items-center gap-1.5 text-xs text-[#A8A29E]"
                >
                  <CheckCircle
                    size={13}
                    className="text-[#C9A84C] flex-shrink-0"
                    aria-hidden="true"
                  />
                  {point}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* ── Right: floating email mockup ── */}
          <motion.div
            className="flex-shrink-0 w-full max-w-md mx-auto lg:mx-0"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <EmailMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
