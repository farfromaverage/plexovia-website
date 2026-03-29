"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { fadeInUp, stagger } from "@/lib/motion";

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
        <div className="flex flex-col items-center text-center gap-12 lg:gap-16">

          {/* ── Center: copy ── */}
          <motion.div
            className="flex-1 max-w-3xl w-full flex flex-col items-center"
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
                Government Contract Intelligence
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={fadeInUp}
              className="
                text-4xl sm:text-5xl lg:text-6xl
                text-[#1C1917] font-semibold leading-[1.1] mb-6 tracking-tight
              "
            >
              Stop searching.
              <br />
              Start <span className="text-[#C9A84C]">winning</span> contracts.
            </motion.h1>

            {/* Subline */}
            <motion.p
              variants={fadeInUp}
              className="
                text-lg sm:text-xl text-[#6B6560]
                leading-relaxed max-w-2xl mb-8
              "
            >
              Plexovia’s AI monitors all 50 state portals and SAM.gov simultaneously. We filter the noise, score solicitations against your exact capabilities, and deliver only the highest-value opportunities you have an unfair advantage to win.
            </motion.p>

            {/* CTA group */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
            >
              <Link
                href="/auth/signup"
                id="hero-cta"
                className="btn-gold text-base px-7 py-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-lg font-bold shadow-xl shadow-[#C9A84C]/20 hover:shadow-2xl hover:shadow-[#C9A84C]/30 transition-all"
              >
                Start Free Trial
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
              className="flex flex-col sm:flex-row flex-wrap justify-center gap-x-5 gap-y-2"
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
        </div>
      </div>
    </section>
  );
}
