"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeInUp, stagger, pathDraw, viewportConfig } from "@/lib/motion";

const steps = [
  {
    number: "01",
    title:  "Tell us your NAICS codes and states",
    body:
      "Set up takes under three minutes. Enter the NAICS codes your firm bids under and choose your states. Essential covers 7 states. Pro covers all 50. You never touch a search bar again.",
  },
  {
    number: "02",
    title:  "We scan your portals and SAM.gov every night",
    body:
      "Our engine runs nightly. It checks SAM.gov plus every procurement portal in your selected states. New solicitations are matched against your profile. Not keywords. NAICS codes.",
  },
  {
    number: "03",
    title:  "Scored matches land in your inbox. No login required.",
    body:
      "Every matching contract gets a score from 0 to 100. Essential subscribers get one digest per morning. Pro subscribers get up to 4 alerts per day. You read, you decide, you bid.",
  },
];

export default function HowItWorks() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, viewportConfig);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-20 md:py-28 px-5 sm:px-8 lg:px-12 bg-[#F7F5F0]"
      aria-label="How Plexovia works"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          className="mb-16 max-w-xl"
        >
          <motion.p
            variants={fadeInUp}
            className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-3"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            How It Works
          </motion.p>
          <motion.h2
            variants={fadeInUp}
            className="text-4xl sm:text-5xl text-[#1C1917]"
            style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1 }}
          >
            Three minutes of setup.
            A lifetime of not missing contracts.
          </motion.h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line — drawn on scroll */}
          <div
            className="absolute left-6 top-8 bottom-8 w-px bg-[#E2DDD6] hidden md:block"
            aria-hidden="true"
          >
            <motion.div
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
              className="absolute inset-0 origin-top bg-[#C9A84C]"
              style={{ opacity: 0.4 }}
            />
          </div>

          <motion.ol
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={stagger}
            className="relative space-y-10 md:space-y-12 md:pl-20"
            role="list"
          >
            {steps.map((step, i) => (
              <motion.li
                key={step.number}
                variants={fadeInUp}
                className="relative flex gap-6 md:gap-8"
              >
                {/* Step number — gold Geist Mono */}
                <div
                  className="
                    flex-shrink-0 w-12 h-12 rounded-full
                    border-2 border-[#E2DDD6] bg-[#F7F5F0]
                    flex items-center justify-center
                    font-mono text-sm font-semibold text-[#C9A84C]
                    md:absolute md:-left-20 md:top-0
                    transition-colors duration-300
                    z-10
                  "
                  aria-hidden="true"
                >
                  {step.number}
                </div>

                <div className="pt-2 md:pt-0">
                  <h3 className="text-xl font-semibold text-[#1C1917] mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-base text-[#6B6560] leading-relaxed max-w-2xl">
                    {step.body}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
