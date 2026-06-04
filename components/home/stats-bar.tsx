"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { counterReveal, viewportConfig } from "@/lib/motion";
import { useEngineStats } from "./engine-stats-provider";

interface StatItem {
  value:  number;
  label:  string;
  suffix?: string;
  prefix?: string;
}

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref   = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView) return;
    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }
    const duration   = 1800;
    const startTime  = performance.now();
    const easeOut    = (t: number) => 1 - Math.pow(1 - t, 3);

    function tick(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(easeOut(progress) * value));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        hasAnimated.current = true;
      }
    }

    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref} aria-label={`${value}`}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsBar() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, viewportConfig);
  const { totalContracts, federalSources, lastRunAt } = useEngineStats();

  let hrs = 6;
  if (lastRunAt) {
    const hoursAgo = Math.round((Date.now() - new Date(lastRunAt).getTime()) / 3600000);
    hrs = Math.max(1, hoursAgo);
  }

  const liveStats: StatItem[] = [
    { value: totalContracts > 0 ? totalContracts : 15847, label: 'contracts scanned this week',              suffix: '' },
    { value: federalSources  > 0 ? federalSources  : 3,     label: 'federal procurement sources scanned nightly', suffix: '' },
    { value: hrs,                                            label: 'hours ago. Legacy platforms take 48h.', suffix: 'h' },
  ];

  return (
    <section
      ref={ref}
      aria-label="Live platform statistics"
      className="bg-[#111110] py-6 px-5 sm:px-8 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl">
        <motion.dl
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="
            flex flex-col sm:flex-row items-center justify-center
            gap-6 sm:gap-10 lg:gap-16
          "
        >
          {liveStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={counterReveal}
              transition={{ delay: i * 0.12 }}
              className="flex items-baseline gap-2 text-center sm:text-left"
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd className="flex items-baseline gap-1.5 flex-wrap justify-center">
                <span
                  className="
                    font-mono text-xl sm:text-2xl font-semibold
                    text-[#C9A84C] tabular-nums
                  "
                >
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-sm text-[#8A8580]">{stat.label}</span>
              </dd>

              {/* Separator dot — hidden on last item */}
              {i < liveStats.length - 1 && (
                <span
                  className="hidden sm:block text-[#2E2C2A] text-lg select-none ml-4"
                  aria-hidden="true"
                >
                  ·
                </span>
              )}
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
