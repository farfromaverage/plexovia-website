"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { fadeInUp } from "@/lib/motion";

/* ─────────────────────────────────────────────────────────
   ComparisonTable
   Plexovia vs "the typical alternative" — no names
   Named competitor comparison lives on /pricing page.

   Icon key:
   ✓  Check (green)  = included / advantage
   –  Minus (muted)  = not included / neutral
   Text cells = nuanced values
───────────────────────────────────────────────────────── */

type CellValue =
  | { type: "check" }
  | { type: "minus" }
  | { type: "text"; value: string; highlight?: boolean };

interface Row {
  feature:     string;
  plexovia:    CellValue;
  alternative: CellValue;
}

const ROWS: Row[] = [
  {
    feature:     "AI Forecasting with 7 Predictive Core Features",
    plexovia:    { type: "text", value: "Predictive budget curves mapped to your NAICS", highlight: true },
    alternative: { type: "minus" },
  },
  {
    feature:     "Time required per day",
    plexovia:    { type: "text", value: "Under 5 min (read your email)", highlight: true },
    alternative: { type: "text", value: "2 to 4 hours of manual searching" },
  },
  {
    feature:     "Monitoring & Coverage",
    plexovia:    { type: "text", value: "SAM.gov + 50 states + county + DC & PR", highlight: true },
    alternative: { type: "text", value: "Often requires paid add-ons per state" },
  },
  {
    feature:     "NAICS codes & Custom Keywords",
    plexovia:    { type: "text", value: "Unlimited" },
    alternative: { type: "text", value: "Keywords only / strict limits" },
  },
  {
    feature:     "AI match score (0–100) and reasoning",
    plexovia:    { type: "text", value: "Score 0–100 + plain-English reason per contract", highlight: true },
    alternative: { type: "minus" },
  },
  {
    feature:     "Email delivery. No login required.",
    plexovia:    { type: "text", value: "Full digest in your inbox by 6 AM, no login ever", highlight: true },
    alternative: { type: "minus" },
  },
  {
    feature:     "Competitor award tracking",
    plexovia:    { type: "check" },
    alternative: { type: "text", value: "Partial / extra cost" },
  },
  {
    feature:     "Annual contract required",
    plexovia:    { type: "text", value: "Monthly billing, cancel anytime", highlight: true },
    alternative: { type: "text", value: "Yes, most require 1 year" },
  },
  {
    feature:     "Starting price",
    plexovia:    { type: "text", value: "$249 per month, everything included", highlight: true },
    alternative: { type: "text", value: "$500 to $1,200+ per month" },
  },
  {
    feature:     "Free trial",
    plexovia:    { type: "text", value: "7 days, fully featured" },
    alternative: { type: "text", value: "Demo call only" },
  },
];

/* ── Icon renderers ── */
function CheckIcon() {
  return (
    <Check
      size={17}
      strokeWidth={2.5}
      style={{ color: "var(--success)", display: "block", margin: "0 auto" }}
      aria-label="Included"
    />
  );
}

function MinusIcon() {
  return (
    <Minus
      size={17}
      strokeWidth={2}
      style={{ color: "var(--pub-faint)", display: "block", margin: "0 auto" }}
      aria-label="Not included"
    />
  );
}

function Cell({ value }: { value: CellValue }) {
  if (value.type === "check") return <CheckIcon />;
  if (value.type === "minus") return <MinusIcon />;
  return (
    <span
      style={{
        fontFamily: "var(--font-inter), sans-serif",
        fontSize:   "0.8125rem",
        fontWeight: value.highlight ? 600 : 400,
        color:      value.highlight ? "var(--pub-text)" : "var(--pub-muted)",
        lineHeight: 1.4,
      }}
    >
      {value.value}
    </span>
  );
}

/* ── Column header shared styles ── */
const COL_HEADER: React.CSSProperties = {
  fontFamily:    "var(--font-inter), sans-serif",
  fontSize:      "0.875rem",
  fontWeight:    600,
  letterSpacing: "-0.01em",
  color:         "var(--pub-text)",
  padding:       "0.875rem 1rem",
  textAlign:     "center",
};

const PLEXOVIA_BG = "rgba(201, 168, 76, 0.05)";

export default function ComparisonTable() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      aria-label="Feature comparison"
      style={{
        backgroundColor: "var(--pub-surface-2)",
        borderTop:       "1px solid var(--pub-border)",
        padding:         "5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ marginBottom: "2.5rem" }}
        >
          <span
            aria-hidden="true"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "0.375rem",
              fontFamily:     "var(--font-geist-mono), monospace",
              fontSize:       "0.6875rem",
              fontWeight:     500,
              letterSpacing:  "0.08em",
              textTransform:  "uppercase",
              color:          "var(--accent)",
              marginBottom:   "1rem",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "block" }} />
            How We Compare
          </span>
          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.625rem, 2.8vw, 2.25rem)",
              letterSpacing: "-0.04em",
              lineHeight:    1.15,
              color:         "var(--pub-text)",
              marginBottom:  "0.625rem",
              maxWidth:      "520px",
            }}
          >
            Why contractors switch to Plexovia.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.9375rem",
              color:      "var(--pub-muted)",
              lineHeight: 1.6,
            }}
          >
            No annual contract. No confusing tiers. No login required to use the product. See exactly what you get versus manually doing it yourself.
          </p>
        </motion.div>

        {/* Table — horizontal scroll on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            overflowX:    "auto",
            borderRadius: "var(--radius-md)",
            border:       "1px solid var(--pub-border)",
          }}
        >
          <table
            style={{
              width:          "100%",
              minWidth:       "580px",
              borderCollapse: "collapse",
              backgroundColor:"var(--pub-surface)",
            }}
          >
            {/* Column headers */}
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{
                    ...COL_HEADER,
                    textAlign:   "left",
                    color:       "var(--pub-text)",
                    fontWeight:  600,
                    fontSize:    "0.875rem",
                    width:       "33%",
                    paddingLeft: "1.25rem",
                    borderBottom:"1px solid var(--pub-border)",
                  }}
                >
                  Feature
                </th>

                {/* Plexovia column */}
                <th
                  scope="col"
                  style={{
                    ...COL_HEADER,
                    color:           "var(--accent)",
                    width:           "33%",
                    backgroundColor: PLEXOVIA_BG,
                    borderLeft:      "2px solid var(--accent)",
                    borderBottom:    "1px solid var(--pub-border)",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Plexovia</div>
                </th>

                {/* Alternative */}
                <th
                  scope="col"
                  style={{
                    ...COL_HEADER,
                    width:       "33%",
                    color:       "var(--pub-muted)",
                    fontWeight:  500,
                    borderLeft:  "1px solid var(--pub-border)",
                    borderBottom:"1px solid var(--pub-border)",
                  }}
                >
                  Without Plexovia
                </th>
              </tr>
            </thead>

            {/* Data rows — stagger in on scroll */}
            <tbody>
              {ROWS.map((row, i) => (
                <motion.tr
                  key={row.feature}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  variants={fadeInUp}
                  transition={{ delay: 0.2 + i * 0.045 }}
                  style={{
                    borderBottom: i < ROWS.length - 1 ? "1px solid var(--pub-border)" : "none",
                  }}
                >
                  {/* Feature label */}
                  <td
                    style={{
                      fontFamily:  "var(--font-inter), sans-serif",
                      fontSize:    "0.875rem",
                      fontWeight:  500,
                      color:       "var(--pub-text)",
                      padding:     "0.875rem 1rem 0.875rem 1.25rem",
                      lineHeight:  1.4,
                    }}
                  >
                    {row.feature}
                  </td>

                  {/* Plexovia */}
                  <td
                    style={{
                      backgroundColor: PLEXOVIA_BG,
                      borderLeft:      "2px solid var(--accent)",
                      textAlign:       "center",
                      padding:         "0.875rem 1rem",
                    }}
                  >
                    <Cell value={row.plexovia} />
                  </td>

                  {/* Alternative */}
                  <td
                    style={{
                      borderLeft: "1px solid var(--pub-border)",
                      textAlign:  "center",
                      padding:    "0.875rem 1rem",
                    }}
                  >
                    <Cell value={row.alternative} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>



      </div>
    </section>
  );
}
