"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  fadeInUp, fadeInLeft, fadeInRight,
  stagger,
  accordionContent,
  viewportConfig,
} from "@/lib/motion";
import Button, { ButtonLink } from "@/components/ui/button";
import Card, { CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import MatchScoreBadge from "@/components/ui/match-score-badge";
import { ChevronDown, CheckCircle, Zap, Shield, BarChart } from "lucide-react";

/* ─── Animated counter ─── */
function AnimatedCounter({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref     = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-60px" });

  if (inView && display === 0) {
    const duration  = 1600;
    const start     = performance.now();
    const ease      = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick      = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(ease(p) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  return (
    <div ref={ref} className="text-center">
      <span className="font-mono text-3xl font-semibold text-[#C9A84C] tabular-nums">
        {display.toLocaleString()}
      </span>
      <p className="text-sm text-[#6B6560] mt-1">{label}</p>
    </div>
  );
}

/* ─── FAQ accordion item ─── */
function AccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E2DDD6] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="
          w-full flex items-center justify-between
          py-4 px-0 text-left
          text-[#1C1917] font-medium
          hover:text-[#C9A84C] transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]
          min-h-[44px]
        "
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.28 }}
          className="flex-shrink-0 ml-4 text-[#C9A84C]"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={accordionContent}
            className="overflow-hidden"
          >
            <p className="pb-4 text-[#6B6560] text-sm leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Dev QA page
═══════════════════════════════════════════════════ */
export default function DevPageClient() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const featInView  = useInView(featuresRef, viewportConfig);
  const statsRef    = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-[#F7F5F0]">

      {/* ── Header ── */}
      <header className="bg-[#111110] px-8 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-mono text-xs text-[#C9A84C] tracking-widest uppercase">
            Plexovia / Design QA
          </span>
          <span className="text-xs text-[#4A4845]">
            Phase 2A Quality Gate — localhost only
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 space-y-24">

        {/* ── Section 1: Buttons ── */}
        <section aria-label="Button variants">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            01 — Buttons
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary" size="sm">Small Primary</Button>
            <Button variant="primary" size="md">Start Free Trial</Button>
            <Button variant="primary" size="lg">Large Primary</Button>
            <Button variant="ghost"   size="md">Ghost Button</Button>
            <Button variant="ghost"   size="sm">See How It Works</Button>
            <Button variant="primary" size="md" disabled>Disabled</Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <ButtonLink href="#" variant="primary">ButtonLink Primary</ButtonLink>
            <ButtonLink href="#" variant="ghost">ButtonLink Ghost</ButtonLink>
          </div>
          <p className="mt-4 text-xs text-[#A8A29E]">
            Hover primary buttons — the magnetic cursor-offset spring is active. Check min-height ≥44px.
          </p>
        </section>

        {/* ── Section 2: Cards ── */}
        <section aria-label="Card variants">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            02 — Cards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card surface="parchment">
              <CardHeader>
                <h3 className="font-semibold text-[#1C1917]">Parchment card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-[#6B6560]">
                  Hover to test the elevation lift spring. Ambient shadow → deeper shadow.
                </p>
              </CardBody>
              <CardFooter>
                <span className="text-xs text-[#A8A29E]">Hover me</span>
              </CardFooter>
            </Card>

            <Card surface="parchment" hoverable={false}>
              <CardBody>
                <p className="text-sm text-[#6B6560]">
                  Non-hoverable card — static, no animation. Used for non-interactive content blocks.
                </p>
              </CardBody>
            </Card>

            <div className="bg-[#111110] p-4 rounded-xl">
              <Card surface="dark">
                <CardHeader>
                  <h3 className="font-semibold text-[#F5F3EE]">Dark card</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-[#8A8580]">
                    Dashboard surface. Gold accent consistent on dark bg.
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Section 3: Match Score Badges ── */}
        <section aria-label="Match score badges">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            03 — Match Score Badges
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <MatchScoreBadge score={94} size="md" />
            <MatchScoreBadge score={78} size="md" />
            <MatchScoreBadge score={61} size="md" />
            <MatchScoreBadge score={45} size="md" />
            <MatchScoreBadge score={32} size="md" />
            <MatchScoreBadge score={12} size="md" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <MatchScoreBadge score={94} size="sm" />
            <MatchScoreBadge score={61} size="sm" />
            <MatchScoreBadge score={28} size="sm" />
          </div>
          <div className="mt-4 bg-[#111110] p-4 rounded-xl flex gap-4">
            <MatchScoreBadge score={94} size="md" />
            <MatchScoreBadge score={61} size="md" />
            <MatchScoreBadge score={28} size="md" />
            <span className="text-xs text-[#8A8580] pt-1">— Scores on dark surface (verify contrast)</span>
          </div>
        </section>

        {/* ── Section 4: Scroll Reveal Animations ── */}
        <section aria-label="Scroll reveal test" ref={featuresRef}>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            04 — Scroll Reveals (stagger + fadeInUp)
          </h2>
          <motion.div
            initial="hidden"
            animate={featInView ? "visible" : "hidden"}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: <CheckCircle size={20} />, title: "3 federal sources", body: "SAM.gov + DLA DIBBS + SBA SubNet in a single subscription." },
              { icon: <Zap         size={20} />, title: "Score 0–100",   body: "AI match score on every bid. High scores at the top. Noise removed." },
              { icon: <Shield      size={20} />, title: "Month to month", body: "No annual contracts. Cancel anytime. No questions." },
              { icon: <BarChart    size={20} />, title: "Updated daily",    body: "Your matching bids appear in your dashboard every morning, scored and ranked." },
            ].map((f) => (
              <motion.div
                key={f.title}
                variants={fadeInUp}
                className="bg-white border border-[#E2DDD6] rounded-[12px] p-6"
              >
                <span className="text-[#C9A84C] mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-[#1C1917] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B6560]">{f.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Section 5: Counter Animations ── */}
        <section aria-label="Counter animations" ref={statsRef}>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            05 — Count-Up Counters (viewport-triggered)
          </h2>
          <div className="bg-[#111110] rounded-2xl p-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <AnimatedCounter value={15847} label="contracts scanned this week" />
            <AnimatedCounter value={3}     label="federal procurement sources"     />
            <AnimatedCounter value={4}     label="hours since last update"     />
          </div>
        </section>

        {/* ── Section 6: Accordion ── */}
        <section aria-label="Accordion FAQ">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            06 — Accordion (spring physics + gold chevron rotation)
          </h2>
          <div className="max-w-2xl bg-white border border-[#E2DDD6] rounded-[12px] px-6">
            {[
              {
                question: "Do I need to log in to see my matches?",
                answer:   "Your dashboard updates every morning with all matched contracts, scored and ranked. The dashboard is your primary interface for reviewing matches, history, and settings.",
              },
              {
                question: "What sources does Plexovia cover?",
                answer:   "Plexovia covers three federal procurement sources: SAM.gov (all federal solicitations), DLA DIBBS (defense micro-purchases), and SBA SubNet (subcontracting opportunities).",
              },
              {
                question: "What is a match score?",
                answer:   "A match score from 0 to 100 tells you how closely a contract matches your profile. It factors in your NAICS codes, selected states, and keywords. A score of 70 or above means strong relevance.",
              },
              {
                question: "Can I cancel anytime?",
                answer:   "Yes. Plexovia is month-to-month on all plans. Cancel before your next billing date and you will never be charged again. No cancellation fee, no questions.",
              },
            ].map((faq) => (
              <AccordionItem key={faq.question} {...faq} />
            ))}
          </div>
        </section>

        {/* ── Section 7: Typography scale ── */}
        <section aria-label="Typography specimens">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            07 — Typography
          </h2>
          <div className="space-y-4">
            <p className="editorial text-5xl sm:text-6xl text-[#1C1917]">
              Instrument Serif Italic
            </p>
            <p className="font-semibold text-2xl text-[#1C1917]">
              Geist 600 — Section heading
            </p>
            <p className="font-medium text-lg text-[#1C1917]">
              Geist 500 — Sub-heading level
            </p>
            <p className="text-base text-[#6B6560] max-w-lg leading-relaxed">
              Geist 400 body — Grade 8 reading level, short sentences. Active voice.
              No semicolons in copy. No emojis. No dashes as connectors.
            </p>
            <p className="font-mono text-sm text-[#C9A84C]">
              Geist Mono — NAICS 541511 · Score 94 · Contract #W52P1J-26-R-0001
            </p>
          </div>
        </section>

        {/* ── Section 8: Color system ── */}
        <section aria-label="Color tokens">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            08 — Color Tokens
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { bg: "#F7F5F0", label: "pub-bg",        text: "#1C1917" },
              { bg: "#FFFFFF", label: "pub-surface",   text: "#1C1917" },
              { bg: "#F0EDE7", label: "pub-surface-2", text: "#1C1917" },
              { bg: "#1C1917", label: "pub-text",      text: "#F7F5F0" },
              { bg: "#111110", label: "app-bg",        text: "#F5F3EE" },
              { bg: "#1A1917", label: "app-surface",   text: "#F5F3EE" },
              { bg: "#C9A84C", label: "accent",        text: "#111110" },
            ].map((t) => (
              <div key={t.label} className="rounded-lg overflow-hidden border border-[#E2DDD6]">
                <div
                  className="h-14"
                  style={{ backgroundColor: t.bg }}
                />
                <div className="p-2 bg-white">
                  <p className="font-mono text-[10px] text-[#6B6560] truncate">{t.label}</p>
                  <p className="font-mono text-[10px] text-[#A8A29E]">{t.bg}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 9: FadeIn left/right ── */}
        <section aria-label="Directional reveals">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[#C9A84C] mb-8">
            09 — Directional Reveals (scroll to trigger)
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeInLeft}
              className="bg-white border border-[#E2DDD6] rounded-[12px] p-6"
            >
              <p className="text-sm font-semibold text-[#1C1917] mb-1">fadeInLeft</p>
              <p className="text-sm text-[#6B6560]">Slides in from left. Used on alternating feature deep-dives.</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeInRight}
              className="bg-white border border-[#E2DDD6] rounded-[12px] p-6"
            >
              <p className="text-sm font-semibold text-[#1C1917] mb-1">fadeInRight</p>
              <p className="text-sm text-[#6B6560]">Slides in from right. Used on opposite alternating section.</p>
            </motion.div>
          </div>
        </section>

        {/* ── Pass / Fail summary ── */}
        <section className="bg-[#111110] rounded-2xl p-8">
          <h2 className="editorial text-3xl text-[#F5F3EE] mb-6">
            Quality Gate Checklist
          </h2>
          <ul className="space-y-3 text-sm">
            {[
              "Magnetic button spring effect active on primary buttons",
              "Card hover elevation lift smooth (spring physics)",
              "Match score badges correct color (green 70+, amber 40-69, red <40)",
              "Scroll reveals fire on viewport entry — not on load",
              "Counters count up from 0 on entry",
              "Accordion spring opens/closes with chevron rotation",
              "Typography: Instrument Serif editorial, Geist body, Geist Mono data",
              "Gold accent (#C9A84C) consistent across both surfaces",
              "No console errors",
              "Mobile: all sections correct at 390px viewport",
              "Keyboard navigation: Tab through all interactive elements",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[#8A8580]">
                <span className="text-[#C9A84C] flex-shrink-0 mt-0.5">
                  <CheckCircle size={14} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

      </main>
    </div>
  );
}
