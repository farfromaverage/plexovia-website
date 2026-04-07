"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BrainCircuit, LineChart, Target, Eye, Combine, Scale, Clock } from "lucide-react";
import { fadeInUp, stagger } from "@/lib/motion";

/* ─────────────────────────────────────────────────────────
   AIForecastingSection
   Positioned: Under Coverage Map
   Objective: Emphasize the TimesFM integration via 7 Core 
   Predictive Features, using psychological agitation (RFP lag).
───────────────────────────────────────────────────────── */

const CORE_FEATURES = [
  {
    icon: BrainCircuit,
    title: "12 Month Predictive Horizon",
    desc: "Stop reacting to RFPs. We model budget cycles to expose upcoming solicitations up to a year before the incumbent knows it's up for renewal."
  },
  {
    icon: Target,
    title: "AI Solicit Match Scoring",
    desc: "Every contract is scored from 0 to 100 against your exact capacity with a plain English rationale. Read only the winners."
  },
  {
    icon: Eye,
    title: "Zero Competition Extraction",
    desc: "Automatically uncovers highly fragmented micro purchases under the $10k threshold that traditional aggregators ignore."
  },
  {
    icon: Combine,
    title: "Total Market Aggregation",
    desc: "SAM.gov, 50 phase state portals, and hidden municipal registries parsed overnight and unified into a single pipeline."
  },
  {
    icon: LineChart,
    title: "Competitor Intelligence",
    desc: "Track rival incumbent awards in real time. Know exactly who won, for how much, and precisely when their contract expires."
  },
  {
    icon: Scale,
    title: "Set Aside Precision Isolation",
    desc: "Strict prefiltering for 8(a), WOSB, SDVOSB, and HUBZone pipelines so you only spend time on contracts you are legally prioritized to win."
  },
  {
    icon: Clock,
    title: "Unlimited Asymmetric Scale",
    desc: "Unlimited tracking and keywords with an 8 hour human response SLA. No hidden caps to limit your growth."
  }
];

export default function AIForecastingSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      style={{
        backgroundColor: "var(--pub-bg)",
        padding: "6rem 1.5rem",
        borderTop: "1px solid var(--pub-border)"
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header Block */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
          style={{ maxWidth: "800px", margin: "0 auto 4rem auto", textAlign: "center" }}
        >
          <span
            aria-hidden="true"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "0.5rem",
              fontFamily:     "var(--font-geist-mono), monospace",
              fontSize:       "0.6875rem",
              fontWeight:     500,
              letterSpacing:  "0.08em",
              textTransform:  "uppercase",
              color:          "var(--accent)",
              marginBottom:   "1rem",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]"></span>
            </span>
            The Prediction Advantage
          </span>
          
          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(2rem, 3.5vw, 3rem)",
              letterSpacing: "-0.04em",
              lineHeight:    1.15,
              color:         "var(--pub-text)",
              marginBottom:  "1.25rem",
            }}
          >
            If you wait for the RFP to drop,<br /> it’s already too late.
          </h2>
          
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "1.125rem",
              color:      "var(--pub-muted)",
              lineHeight: 1.65,
              maxWidth:   "700px",
              margin:     "0 auto",
            }}
          >
            Winning government contracts isn’t about searching faster. It’s about knowing earlier. 
            Our <strong style={{ color: "var(--pub-text)", fontWeight: 600 }}>AI Forecasting</strong> analyzes 
            decades of historical spending and agency budget cycles to build your pipeline 
            months before the competition even starts looking.
          </p>
        </motion.div>

        {/* 7 Core Features Grid */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={stagger}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {CORE_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            const isHeroCard = idx === 0;

            return (
              <motion.div
                key={idx}
                variants={fadeInUp}
                style={{
                  gridColumn: isHeroCard ? "1 / -1" : "auto",
                  padding: "2.5rem",
                  backgroundColor: isHeroCard ? "transparent" : "var(--pub-bg)",
                  border: "1px solid var(--pub-border)",
                  borderRadius: "16px",
                  display: "flex",
                  flexDirection: isHeroCard ? "row" : "column",
                  alignItems: isHeroCard ? "center" : "flex-start",
                  gap: "1.5rem",
                  boxShadow: isHeroCard ? "0 0 0 1px rgba(201,168,76,0.1), 0 20px 40px rgba(0,0,0,0.05)" : "none",
                }}
                className={isHeroCard ? "hero-feature-card" : ""}
              >
                <div
                  style={{
                    color: "var(--accent)",
                    padding: isHeroCard ? "1rem" : "0.75rem",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    backgroundColor: "transparent",
                    border: "1px solid var(--pub-border)",
                  }}
                >
                  <Icon size={isHeroCard ? 32 : 24} strokeWidth={1.5} />
                </div>
                
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: isHeroCard ? "1.5rem" : "1.125rem",
                      fontWeight: 600,
                      color: "var(--pub-text)",
                      marginBottom: "0.5rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.9375rem",
                      color: "var(--pub-muted)",
                      lineHeight: 1.65,
                      maxWidth: isHeroCard ? "700px" : "100%",
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .hero-feature-card {
              flex-direction: column !important;
              align-items: flex-start !important;
            }
          }
        `}} />
      </div>
    </section>
  );
}
