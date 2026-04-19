"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { fadeInUp, stagger } from "@/lib/motion";

/* ─────────────────────────────────────────────────────────
   FAQSection — 5 objection-crushing questions
   Framework: PAS per question
   Q = names the problem/concern
   A = acknowledge → stakes → Plexovia as the precise fix
   SEO: FAQPage JSON-LD injected via <script>
───────────────────────────────────────────────────────── */

const FAQS = [
  {
    id: "faq-0",
    q:  "SAM.gov is free. Why would I pay $249 per month?",
    a:  "SAM.gov is a data source. It lists contracts but does not filter, score, or alert you. To use it effectively, you need to log in daily, set up searches manually per NAICS code, check each state portal separately, and repeat that process every single day. Most contractors spend 2 to 4 hours doing this, and still miss contracts posted on state or county portals that SAM.gov does not cover. Plexovia replaces that entire process. You set your profile once. Every morning, your dashboard shows a scored list of exactly what changed overnight, ranked by how well each contract matches your business. The question is not whether SAM.gov is free. The question is what 2 to 4 hours of your time is worth every day.",
  },
  {
    id: "faq-1",
    q:  "Do I have to log in to a dashboard every day to see results?",
    a:  "Your dashboard is the primary interface. Every contract matching your NAICS codes and keywords appears there automatically, scored and ranked. You log in, review your matches, and decide which to bid on. We also send system notifications for critical events like approaching deadlines.",
  },
  {
    id: "faq-2",
    q:  "What states and portals do you actually monitor?",
    a:  "We cover three federal procurement sources: SAM.gov (all active federal solicitations), DLA DIBBS (Defense Logistics Agency micro-purchases), and SBA SubNet (subcontracting opportunities). These sources together represent the vast majority of U.S. government contract opportunities.",
  },
  {
    id: "faq-3",
    q:  "How accurate is the AI match score?",
    a:  "The score (0 to 100) is calculated from your NAICS codes, custom keywords, set-aside eligibility, and geographic match. Above 70 means the contract matches your primary NAICS, location, and keywords. You also get a plain-English explanation per contract so you know exactly which signals fired and which did not. No guesswork.",
  },
  {
    id: "faq-4",
    q:  "What happens after my trial, and can I cancel at any time?",
    a:  "You receive a reminder email on Day 6. On Day 8, your card is charged for your first billing cycle. If you cancel before Day 8, you pay nothing. After that, cancellation takes under 60 seconds from your billing page. No phone call, no support ticket, no lock-in. If you cancel mid-cycle, you keep access until your paid period ends.",
  },
  {
    id: "faq-5",
    q:  "Is my NAICS profile and tracking data kept private?",
    a:  "Yes. Your NAICS codes, custom keywords, states, and set-aside eligibility are never shared, sold, or visible to other users. Competitors cannot see what you are tracking. Your profile is used solely to generate your personalized contract matches. We do not aggregate, benchmark, or expose individual account configurations.",
  },
  {
    id: "faq-6",
    q:  "I have used other contract tracking tools before. Why is this different?",
    a:  "Most contract tracking platforms sell the same data feed to thousands of subscribers. You see the same contracts as everyone else, at the same time. Plexovia builds a unique scoring model around your exact NAICS codes, certifications, set-aside eligibility, and PSC codes. No two users see the same dashboard. Beyond basic matching, Plexovia uses tiered NAICS scoring, title-weighted keywords, and deadline proximity analysis to surface the contracts most likely to result in a win. Because your dashboard updates daily with AI-scored matches, there is no data to manually search and no subscription tier to navigate.",
  },
] as const;


/* JSON-LD FAQ schema */
const JSONLD = {
  "@context": "https://schema.org",
  "@type":    "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type":        "Question",
    name:           faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

/* ── Single accordion item ── */
function AccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq:      { id: string; q: string; a: string };
  isOpen:   boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--pub-border)",
      }}
    >
      <button
        id={`${faq.id}-trigger`}
        aria-controls={`${faq.id}-panel`}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); }
        }}
        style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          width:           "100%",
          padding:         "1.25rem 0",
          background:      "none",
          border:          "none",
          cursor:          "pointer",
          gap:             "1rem",
          textAlign:       "left",
        }}
      >
        <span
          style={{
            fontFamily:    "var(--font-inter), sans-serif",
            fontSize:      "1rem",
            fontWeight:    600,
            letterSpacing: "-0.01em",
            lineHeight:    1.4,
            color:         "var(--pub-text)",
          }}
        >
          {faq.q}
        </span>

        {/* Gold chevron — rotates 180° on open */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          style={{ flexShrink: 0, display: "flex", color: "var(--accent)" }}
          aria-hidden="true"
        >
          <ChevronDown size={20} strokeWidth={2} />
        </motion.span>
      </button>

      {/* Answer panel — spring height reveal */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`${faq.id}-panel`}
            role="region"
            aria-labelledby={`${faq.id}-trigger`}
            key={faq.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.9375rem",
                fontWeight: 400,
                lineHeight: 1.75,
                color:      "var(--pub-muted)",
                paddingBottom: "1.375rem",
                maxWidth:   "700px",
              }}
            >
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Main section */
export default function FAQSection({
  items,
  title = "Questions contractors ask before signing up.",
  hideCta = false,
}: {
  items?: { id: string; q: string; a: string }[];
  title?: React.ReactNode;
  hideCta?: boolean;
} = {}) {
  const displayFaqs = items || FAQS;
  const [openId, setOpenId] = useState<string | null>(null);
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  const dynamicJsonLd = {
    "@context": "https://schema.org",
    "@type":    "FAQPage",
    mainEntity: displayFaqs.map((faq) => ({
      "@type":        "Question",
      name:           faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      {/* JSON-LD SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dynamicJsonLd) }}
      />

      <section
        ref={ref}
        id="faq"
        aria-label="Frequently asked questions"
        style={{
          backgroundColor: "var(--pub-bg)",
          borderTop:       "1px solid var(--pub-border)",
          padding:         "5rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin:   "0 auto",
            display:  "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap:      "3rem",
            alignItems: "start",
          }}
        >
          {/* Left: header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
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
              Common Questions
            </span>

            <h2
              style={{
                fontFamily:    "var(--font-inter), sans-serif",
                fontWeight:    700,
                fontSize:      "clamp(1.625rem, 2.8vw, 2.25rem)",
                letterSpacing: "-0.04em",
                lineHeight:    1.15,
                color:         "var(--pub-text)",
                marginBottom:  "1rem",
              }}
            >
              {title}
            </h2>

            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.9375rem",
                color:      "var(--pub-muted)",
                lineHeight: 1.65,
                marginBottom: "1.5rem",
              }}
            >
              Anything not answered here, email{" "}
              <a
                href="mailto:support@plexovia.com"
                style={{ color: "var(--pub-text)", textDecoration: "underline", textUnderlineOffset: "2px" }}
              >
                support@plexovia.com
              </a>
              . Priority support, 8-hour response included in your plan.
            </p>

            <Link
              href="/auth/signup"
              className="btn-gold"
              id="faq-cta"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              See Matching Contracts in Your Dashboard
            </Link>
          </motion.div>

          {/* Right: accordion */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {displayFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                faq={faq}
                isOpen={openId === faq.id}
                onToggle={() => toggle(faq.id)}
              />
            ))}
          </motion.div>
        </div>
      </section>

    </>
  );
}
