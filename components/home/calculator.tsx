"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { fadeInUp, stagger, viewportConfig } from "@/lib/motion";
import { DollarSign } from "lucide-react";

const HOURLY_RATE = 125; /* GSA Schedule average for IT services, NAICS 541511 */

export default function Calculator() {
  const [hours, setHours]         = useState(8);
  const ref                       = useRef<HTMLDivElement>(null);
  const inView                    = useInView(ref, viewportConfig);

  const weeklyLoss   = Math.round(hours * HOURLY_RATE * 52);
  const formatted    = weeklyLoss.toLocaleString();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setHours(Number(e.target.value));
    },
    []
  );

  return (
    <section
      id="calculator"
      ref={ref}
      className="py-20 md:py-28 px-5 sm:px-8 lg:px-12 bg-[#F0EDE7]"
      aria-label="Missed opportunity calculator"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <motion.div
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={stagger}
          >
            <motion.p variants={fadeInUp} className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-3">
              The real cost of manual searching
            </motion.p>
            <motion.h2 variants={fadeInUp} className="editorial text-4xl sm:text-5xl text-[#1C1917] mb-5">
              How much is manual searching costing your firm?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-base text-[#6B6560] leading-relaxed">
              Every hour your team spends checking SAM.gov manually is a billable hour spent not bidding and not winning. Use the slider. The number on the right is what your competitor earned from contracts you never saw.
            </motion.p>
          </motion.div>

          {/* Right: interactive calculator */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 28 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="card-parchment p-8"
          >
            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-baseline mb-3">
                <label
                  htmlFor="hours-slider"
                  className="text-sm font-medium text-[#1C1917]"
                >
                  Hours spent on SAM.gov per week
                </label>
                <span className="font-mono text-lg font-semibold text-[#C9A84C]">
                  {hours}h
                </span>
              </div>

              <input
                id="hours-slider"
                type="range"
                min={1}
                max={40}
                value={hours}
                onChange={handleChange}
                className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
                aria-label={`${hours} hours per week spent on manual SAM.gov searching`}
                style={{
                  background: `linear-gradient(to right, #C9A84C ${(hours / 40) * 100}%, #E2DDD6 ${(hours / 40) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-[#A8A29E] mt-1.5">
                <span>1 hr</span>
                <span>40 hrs</span>
              </div>
            </div>

            {/* Output */}
            <div className="bg-[#F0EDE7] rounded-xl p-6 text-center">
              <p className="text-sm text-[#6B6560] mb-2">
                Annual cost in billable hours
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <DollarSign size={28} className="text-[#C9A84C]" aria-hidden="true" />
                <span
                  className="font-mono text-5xl font-semibold text-[#1C1917] tabular-nums"
                  aria-live="polite"
                  aria-label={`$${formatted} per year`}
                >
                  {formatted}
                </span>
                <span className="text-sm text-[#6B6560] ml-1">/yr</span>
              </div>
              <p className="text-xs text-[#A8A29E] mt-3 max-w-xs mx-auto">
                Based on {hours}h/week at ${HOURLY_RATE}/hr. Source: GSA Schedule average for IT services, NAICS 541511.
                That is what your competitor earned while you were searching.
              </p>
            </div>

            {/* CTA from calculator */}
            <a
              href="/auth/signup"
              id="calc-cta"
              className="btn-gold mt-5 w-full text-center text-sm py-3.5"
            >
              Recover those hours. Start Free Trial.
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
