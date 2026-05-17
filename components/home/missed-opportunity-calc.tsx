"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Activity, AlertTriangle, Calculator, TrendingDown, ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   MissedOpportunityCalc
   - Light theme, inline styles, CSS variables
   - Gold accent (urgency, not alarm)
   - Fully responsive: stacks on mobile
   - Slider thumbs properly centered cross-browser
───────────────────────────────────────────────────────── */

function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const duration = 600;
    const startValue = display;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValue + (value - startValue) * ease));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

/* ──────────────────────────────────────────────────────────
   CSS injected once:
   1. Slider thumb — 44px input height so margin-top math
      centers thumb (22px) on the 6px track perfectly.
      thumb_margin_top = -(thumb_height - track_height) / 2
                       = -(22 - 6) / 2 = -8px
      => thumb center = 22px = 44px input center ✓
   2. Responsive — card stacks single column below 720px
   3. Media query for sliders panel border direction
────────────────────────────────────────────────────────── */
const CALC_CSS = `
  /* Range input */
  .calc-slider {
    -webkit-appearance: none;
    appearance: none;
    display: block;
    width: 100%;
    height: 44px;
    background: transparent;
    outline: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
  }
  .calc-slider::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 99px;
    background: transparent;
    cursor: pointer;
  }
  .calc-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--pub-bg);
    border: 2px solid var(--accent);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    margin-top: -8px;
  }
  .calc-slider::-moz-range-track {
    height: 6px;
    border-radius: 99px;
    background: transparent;
    cursor: pointer;
  }
  .calc-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--pub-bg);
    border: 2px solid var(--accent);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .calc-slider:hover::-webkit-slider-thumb,
  .calc-slider:focus::-webkit-slider-thumb,
  .calc-slider:active::-webkit-slider-thumb {
    transform: scale(1.15);
    box-shadow: 0 0 0 5px rgba(201,168,76,0.18), 0 2px 8px rgba(0,0,0,0.15);
    background: var(--accent);
    border-color: var(--accent);
  }
  .calc-slider:hover::-moz-range-thumb,
  .calc-slider:focus::-moz-range-thumb,
  .calc-slider:active::-moz-range-thumb {
    transform: scale(1.15);
    box-shadow: 0 0 0 5px rgba(201,168,76,0.18), 0 2px 8px rgba(0,0,0,0.15);
    background: var(--accent);
    border-color: var(--accent);
  }

  /* Responsive card layout */
  .calc-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .calc-sliders-panel {
    border-right: 1px solid var(--pub-border);
    border-bottom: none;
  }

  @media (max-width: 720px) {
    .calc-card-grid {
      grid-template-columns: 1fr;
    }
    .calc-sliders-panel {
      border-right: none;
      border-bottom: 1px solid var(--pub-border);
    }
  }
`;

/* ── Reusable slider row ── */
function SliderRow({
  id,
  label,
  hint,
  icon,
  displayValue,
  fillPct,
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
}: {
  id:           string;
  label:        string;
  hint:         string;
  icon:         React.ReactNode;
  displayValue: string;
  fillPct:      number;
  min:          number;
  max:          number;
  step:         number;
  value:        number;
  onChange:     (v: number) => void;
  ariaLabel:    string;
}) {
  return (
    <div>
      {/* Label row */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
          marginBottom:   "0.625rem",
          gap:            "1rem",
        }}
      >
        <div>
          <label
            htmlFor={id}
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.9375rem",
              fontWeight: 600,
              color:      "var(--pub-text)",
              display:    "flex",
              alignItems: "center",
              gap:        "0.5rem",
              cursor:     "pointer",
            }}
          >
            {icon}
            {label}
          </label>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.8125rem",
              color:      "var(--pub-faint)",
              marginTop:  "0.2rem",
            }}
          >
            {hint}
          </p>
        </div>
        <span
          style={{
            fontFamily:    "var(--font-geist-mono), monospace",
            fontSize:      "1.25rem",
            fontWeight:    600,
            color:         "var(--accent)",
            letterSpacing: "-0.02em",
            whiteSpace:    "nowrap",
            flexShrink:    0,
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* Slider track + input
          Container height = 44px (touch target + input height).
          Track overlays centered with top:50% + translateY(-50%).
          Input also 44px so thumb margin-top:-8px centers it. */}
      <div style={{ position: "relative", height: "44px" }}>
        {/* Track background */}
        <div
          style={{
            position:        "absolute",
            left:            0,
            right:           0,
            top:             "50%",
            transform:       "translateY(-50%)",
            height:          "6px",
            borderRadius:    "99px",
            backgroundColor: "var(--pub-border)",
            pointerEvents:   "none",
          }}
        />
        {/* Track fill */}
        <div
          style={{
            position:        "absolute",
            left:            0,
            top:             "50%",
            transform:       "translateY(-50%)",
            height:          "6px",
            borderRadius:    "99px",
            backgroundColor: "var(--accent)",
            width:           `${fillPct}%`,
            transition:      "width 0.08s ease",
            pointerEvents:   "none",
          }}
        />
        {/* Actual input — 44px height, transparent */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="calc-slider"
          style={{ position: "absolute", inset: 0, zIndex: 2 }}
          aria-label={ariaLabel}
        />
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function MissedOpportunityCalc() {
  const [contractValue,  setContractValue]  = useState(120000);
  const [missedPerMonth, setMissedPerMonth] = useState(3);
  const [liveScanned,    setLiveScanned]    = useState(15847);

  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/engine-stats?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.total_contracts) setLiveScanned(data.total_contracts);
        }
      } catch { /* fallback */ }
    }
    fetchStats();
  }, []);

  const annualLoss  = contractValue * missedPerMonth * 12;
  const displayLoss = useAnimatedNumber(annualLoss);

  const valueFillPct  = ((contractValue  - 10000) / 490000) * 100;
  const missedFillPct = ((missedPerMonth - 1)      / 9)      * 100;

  return (
    <section
      ref={ref}
      aria-label="Impact calculator"
      style={{
        backgroundColor: "var(--pub-surface-2)",
        borderTop:       "1px solid var(--pub-border)",
        padding:         "5rem 1.5rem",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CALC_CSS }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
          <span
            aria-hidden="true"
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           "0.375rem",
              fontFamily:    "var(--font-geist-mono), monospace",
              fontSize:      "0.6875rem",
              fontWeight:    500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color:         "var(--accent)",
              marginBottom:  "1rem",
            }}
          >
            <Calculator size={13} aria-hidden="true" />
            Impact Calculator
          </span>

          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.625rem, 3vw, 2.5rem)",
              letterSpacing: "-0.04em",
              lineHeight:    1.1,
              color:         "var(--pub-text)",
              marginBottom:  "0.75rem",
            }}
          >
            Calculate what manual contract searching costs you each year.
          </h2>

          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "1rem",
              color:      "var(--pub-muted)",
              lineHeight: 1.65,
              maxWidth:   "600px",
              margin:     "0 auto",
            }}
          >
            Over{" "}
            <strong style={{ color: "var(--pub-text)", fontWeight: 600 }}>
              {liveScanned.toLocaleString()}
            </strong>{" "}
            new government contracts were published in the last 7 days.
            Adjust the sliders to see what missed opportunities cost your business each year.
          </p>
        </motion.div>

        {/* ── Calculator card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            backgroundColor: "var(--pub-surface)",
            border:          "1px solid var(--pub-border)",
            borderRadius:    "var(--radius-md)",
            overflow:        "hidden",
          }}
        >
          <div className="calc-card-grid">

            {/* ── Left: sliders ── */}
            <div
              className="calc-sliders-panel"
              style={{
                padding:        "2.5rem",
                display:        "flex",
                flexDirection:  "column",
                justifyContent: "center",
                gap:            "2.5rem",
              }}
            >
              <SliderRow
                id="calc-value"
                label="Average contract value"
                hint="What is a typical win worth?"
                icon={<Activity size={16} style={{ color: "var(--pub-faint)", flexShrink: 0 }} aria-hidden="true" />}
                displayValue={`$${contractValue.toLocaleString()}`}
                fillPct={valueFillPct}
                min={10000}
                max={500000}
                step={10000}
                value={contractValue}
                onChange={setContractValue}
                ariaLabel="Average contract value"
              />

              <SliderRow
                id="calc-missed"
                label="Opportunities missed per month"
                hint="Based on industry averages"
                icon={<AlertTriangle size={16} style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden="true" />}
                displayValue={String(missedPerMonth)}
                fillPct={missedFillPct}
                min={1}
                max={10}
                step={1}
                value={missedPerMonth}
                onChange={setMissedPerMonth}
                ariaLabel="Missed opportunities per month"
              />
            </div>

            {/* ── Right: result ── */}
            <div
              style={{
                padding:         "2.5rem",
                display:         "flex",
                flexDirection:   "column",
                justifyContent:  "center",
                backgroundColor: "var(--accent-bg-pub)",
              }}
            >
              {/* Label */}
              <div
                style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:         "0.625rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(201,168,76,0.15)",
                    padding:         "0.5rem",
                    borderRadius:    "50%",
                    border:          "1px solid rgba(201,168,76,0.25)",
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    flexShrink:      0,
                  }}
                >
                  <TrendingDown size={16} style={{ color: "var(--accent)" }} aria-hidden="true" />
                </div>
                <span
                  style={{
                    fontFamily:    "var(--font-geist-mono), monospace",
                    fontSize:      "0.6875rem",
                    fontWeight:    600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color:         "var(--pub-muted)",
                  }}
                >
                  Estimated annual revenue at risk
                </span>
              </div>

              {/* Animated number */}
              <div
                style={{
                  display:     "flex",
                  alignItems:  "baseline",
                  gap:         "0.2rem",
                  marginBottom: "1.75rem",
                  flexWrap:    "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "clamp(1.5rem, 3vw, 1.75rem)",
                    fontWeight: 700,
                    color:      "var(--accent)",
                    lineHeight: 1,
                  }}
                >
                  $
                </span>
                <motion.span
                  key={displayLoss}
                  initial={{ opacity: 0.7, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    fontFamily:    "var(--font-geist-mono), monospace",
                    fontSize:      "clamp(2.25rem, 6vw, 3.5rem)",
                    fontWeight:    700,
                    letterSpacing: "-0.04em",
                    color:         "var(--pub-text)",
                    lineHeight:    1,
                  }}
                >
                  {displayLoss.toLocaleString()}
                </motion.span>
              </div>

              {/* Copy */}
              <div
                style={{
                  borderTop:     "1px solid var(--pub-border)",
                  paddingTop:    "1.5rem",
                  display:       "flex",
                  flexDirection: "column",
                  gap:           "0.625rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "0.9375rem",
                    color:      "var(--pub-muted)",
                    lineHeight: 1.65,
                    margin:     0,
                  }}
                >
                  These are contracts your competitors are finding while you search manually.
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "0.9375rem",
                    fontWeight: 600,
                    color:      "var(--accent)",
                    lineHeight: 1.65,
                    margin:     0,
                  }}
                >
                  Plexovia surfaces every matching opportunity so nothing slips through.
                </p>
              </div>

              {/* CTA — H3: conversion exit after emotional loss calc */}
              <div
                style={{
                  borderTop: "1px solid var(--pub-border)",
                  paddingTop: "1.5rem",
                  textAlign:  "center",
                }}
              >
                <Link
                  href="/auth/signup"
                  id="calculator-cta"
                  className="btn-gold"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                >
                  Stop Leaving Revenue on the Table
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "0.75rem",
                    color:      "var(--pub-faint)",
                    marginTop:  "0.5rem",
                  }}
                >
                  14-day free trial. No charge until Day 15.
                </p>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
