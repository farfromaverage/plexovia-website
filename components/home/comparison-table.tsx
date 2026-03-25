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
  essential:   CellValue;
  pro:         CellValue;
  alternative: CellValue;
}

const ROWS: Row[] = [
  {
    feature:     "Time required per day",
    essential:   { type: "text", value: "Under 5 min (read your email)" },
    pro:         { type: "text", value: "Under 5 min (read your email)", highlight: true },
    alternative: { type: "text", value: "2 to 4 hours of manual searching" },
  },
  {
    feature:     "Federal monitoring (SAM.gov)",
    essential:   { type: "check" },
    pro:         { type: "check" },
    alternative: { type: "text", value: "Paid add-on" },
  },
  {
    feature:     "State portal coverage",
    essential:   { type: "text", value: "7 states" },
    pro:         { type: "text", value: "All 50 states" },
    alternative: { type: "text", value: "1 state or federal only" },
  },
  {
    feature:     "AI match score (0–100)",
    essential:   { type: "check" },
    pro:         { type: "check" },
    alternative: { type: "minus" },
  },
  {
    feature:     "Email delivery. No login required.",
    essential:   { type: "check" },
    pro:         { type: "check" },
    alternative: { type: "minus" },
  },
  {
    feature:     "Alert frequency",
    essential:   { type: "text", value: "Once per morning" },
    pro:         { type: "text", value: "4 times per day" },
    alternative: { type: "text", value: "Log in to check" },
  },
  {
    feature:     "NAICS code matching",
    essential:   { type: "text", value: "Up to 10 codes" },
    pro:         { type: "text", value: "Unlimited" },
    alternative: { type: "text", value: "Keywords only" },
  },
  {
    feature:     "Competitor award tracking",
    essential:   { type: "minus" },
    pro:         { type: "check" },
    alternative: { type: "text", value: "Partial / extra cost" },
  },
  {
    feature:     "Annual contract required",
    essential:   { type: "text", value: "Month-to-month", highlight: true },
    pro:         { type: "text", value: "Month-to-month", highlight: true },
    alternative: { type: "text", value: "Yes, most require 1 year" },
  },
  {
    feature:     "Free trial",
    essential:   { type: "text", value: "7 days" },
    pro:         { type: "text", value: "7 days" },
    alternative: { type: "text", value: "Demo call only" },
  },
  {
    feature:     "Starting price",
    essential:   { type: "text", value: "$119/mo", highlight: true },
    pro:         { type: "text", value: "$299/mo", highlight: true },
    alternative: { type: "text", value: "$150–$1,000+/seat" },
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
            What both plans get you that nothing else does.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.9375rem",
              color:      "var(--pub-muted)",
              lineHeight: 1.6,
            }}
          >
            No annual contract. No per-seat fees. No login required to use the product.
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
                    color:       "var(--pub-muted)",
                    fontWeight:  400,
                    fontSize:    "0.8125rem",
                    width:       "34%",
                    paddingLeft: "1.25rem",
                    borderBottom:"1px solid var(--pub-border)",
                  }}
                >
                  Feature
                </th>

                {/* Plexovia Pro — primary column */}
                <th
                  scope="col"
                  style={{
                    ...COL_HEADER,
                    backgroundColor: PLEXOVIA_BG,
                    borderLeft:      "2px solid var(--accent)",
                    borderBottom:    "1px solid var(--pub-border)",
                    position:        "relative",
                  }}
                >
                  <span
                    style={{
                      display:         "inline-block",
                      fontFamily:      "var(--font-geist-mono), monospace",
                      fontSize:        "0.5625rem",
                      fontWeight:      600,
                      letterSpacing:   "0.07em",
                      textTransform:   "uppercase",
                      backgroundColor: "var(--accent-bg-pub)",
                      color:           "var(--accent)",
                      padding:         "0.1rem 0.4rem",
                      borderRadius:    "var(--radius-pill)",
                      marginBottom:    "0.3rem",
                    }}
                  >
                    Most popular
                  </span>
                  <div style={{ fontWeight: 700 }}>Pro</div>
                  <div
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize:   "0.6875rem",
                      fontWeight: 400,
                      color:      "var(--accent)",
                      marginTop:  "0.2rem",
                    }}
                  >
                    $299/mo
                  </div>
                </th>

                {/* Plexovia Essential — secondary column */}
                <th
                  scope="col"
                  style={{
                    ...COL_HEADER,
                    backgroundColor: PLEXOVIA_BG,
                    borderLeft:      "1px solid rgba(201,168,76,0.25)",
                    borderBottom:    "1px solid var(--pub-border)",
                  }}
                >
                  Essential
                  <div
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize:   "0.6875rem",
                      fontWeight: 400,
                      color:      "var(--pub-muted)",
                      marginTop:  "0.2rem",
                    }}
                  >
                    $119/mo
                  </div>
                </th>

                {/* Alternative */}
                <th
                  scope="col"
                  style={{
                    ...COL_HEADER,
                    color:       "var(--pub-muted)",
                    fontWeight:  500,
                    borderLeft:  "1px solid var(--pub-border)",
                    borderBottom:"1px solid var(--pub-border)",
                  }}
                >
                  Typical Alternative
                  <div
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize:   "0.6875rem",
                      fontWeight: 400,
                      color:      "var(--pub-faint)",
                      marginTop:  "0.2rem",
                    }}
                  >
                    $150 to $1,000+/seat
                  </div>
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

                  {/* Pro — primary, strong gold border */}
                  <td
                    style={{
                      backgroundColor: PLEXOVIA_BG,
                      borderLeft:      "2px solid var(--accent)",
                      textAlign:       "center",
                      padding:         "0.875rem 1rem",
                    }}
                  >
                    <Cell value={row.pro} />
                  </td>

                  {/* Essential — secondary */}
                  <td
                    style={{
                      backgroundColor: PLEXOVIA_BG,
                      borderLeft:      "1px solid rgba(201,168,76,0.2)",
                      textAlign:       "center",
                      padding:         "0.875rem 1rem",
                    }}
                  >
                    <Cell value={row.essential} />
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

        {/* Source note */}
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize:   "0.75rem",
            color:      "var(--pub-faint)",
            marginTop:  "0.875rem",
            textAlign:  "right",
          }}
        >
          Pricing based on publicly listed rates as of March 2026. Full comparison at{" "}
          <a
            href="/pricing"
            style={{ color: "var(--pub-muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            /pricing
          </a>
          .
        </p>

      </div>
    </section>
  );
}
