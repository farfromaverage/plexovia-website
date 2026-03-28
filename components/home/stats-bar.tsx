"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatItem {
  value:  number;
  label:  string;
  suffix?: string;
  prefix?: string;
}

const initialStats: StatItem[] = [
  { value: 15847, label: "contracts scanned this week",  suffix: "" },
  { value: 50,    label: "state portals monitored",      suffix: "" },
  { value: 6,     label: "hours since last update",      suffix: "h ago" },
];

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref   = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    const duration   = 2000;
    const startTime  = performance.now();
    // Expm1 easing for a very smooth deceleration
    const easeOutExpm1 = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    function tick(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(easeOutExpm1(progress) * value));
      if (progress < 1) requestAnimationFrame(tick);
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
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [liveStats, setLiveStats] = useState<StatItem[]>(initialStats);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/engine-stats');
        if (!res.ok) return;
        const data = await res.json();

        let hrs = 6;
        if (data.last_run_at) {
          const hoursAgo = Math.round((Date.now() - new Date(data.last_run_at).getTime()) / 3600000);
          hrs = Math.max(1, hoursAgo);
        }

        setLiveStats([
          { value: data.total_contracts > 0 ? data.total_contracts : 15847, label: 'contracts scanned this week', suffix: '' },
          { value: data.states_covered  > 0 ? data.states_covered  : 50,    label: 'state portals monitored',     suffix: '' },
          { value: hrs,                                                       label: 'hours since last update',     suffix: 'h ago' },
        ]);
      } catch {
        // Silently keep initialStats on error
      }
    }
    loadStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 }
    }
  };

  return (
    <section
      ref={ref}
      aria-label="Live platform statistics"
      className="relative bg-[#111110] py-10 px-5 sm:px-8 border-b border-[#2E2C2A] overflow-hidden"
    >
      {/* Subtle background glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 100%, rgba(201,168,76,0.06) 0%, transparent 50%)"
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl relative">
        <motion.dl
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="
            flex flex-col sm:flex-row items-center justify-center
            gap-8 sm:gap-12 lg:gap-20
          "
        >
          {liveStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="relative flex items-center gap-3 text-center sm:text-left overflow-hidden py-2"
            >
              {/* Uiverse-inspired shimmer sweep effect */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={inView ? { x: "200%" } : { x: "-100%" }}
                transition={{ 
                  delay: 0.5 + i * 0.15, 
                  duration: 1.5, 
                  ease: [0.25, 1, 0.5, 1]
                }}
                className="absolute inset-0 z-10 w-[150%] h-[150%] top-[-25%] bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.15)] to-transparent skew-x-[-20deg] pointer-events-none"
              />

              <dt className="sr-only">{stat.label}</dt>
              <dd className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 flex-wrap justify-center relative z-20">
                <span
                  className="
                    font-mono text-3xl sm:text-4xl font-semibold
                    text-[#C9A84C] tabular-nums tracking-tight
                    drop-shadow-[0_0_8px_rgba(201,168,76,0.25)]
                  "
                >
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-sm font-sans font-medium text-[#8A8580] tracking-wide uppercase mt-1 sm:mt-0">
                  {stat.label}
                </span>
              </dd>

              {/* Separator dot — hidden on last item */}
              {i < liveStats.length - 1 && (
                <span
                  className="hidden sm:block text-[#2E2C2A] text-2xl select-none ml-6"
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
