import type { Metadata } from "next";
import Hero from "@/components/home/hero";
import SocialProofBar from "@/components/home/social-proof-bar";
import StatsBar from "@/components/home/stats-bar";
import ProblemSection from "@/components/home/problem-section";
import HowItWorks from "@/components/home/how-it-works";
import PricingSection from "@/components/home/pricing-section";
import ComparisonTable from "@/components/home/comparison-table";
import FAQSection from "@/components/home/faq-section";
import FinalCTA from "@/components/home/final-cta";
import Footer from "@/components/home/footer";

/* ─────────────────────────────────────────────────────────
   Plexovia — Landing Page
   Phase 2C: Sections built section-by-section per plan.
   Current: Hero + StatsBar (verified working).
───────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Government Contract Alerts for All 50 States | Plexovia",
  description:
    "Stop manually checking SAM.gov. Plexovia monitors 50 state portals and SAM.gov daily — scored contract matches delivered to your inbox by 6 AM. 7-day free trial.",
  alternates: {
    canonical: "https://plexovia.com",
  },
  openGraph: {
    title: "Plexovia — Government Contract Alerts for All 50 States",
    description:
      "Stop manually checking SAM.gov. Get scored contract matches in your inbox by 6 AM. All 50 states. 7-day free trial.",
    url: "https://plexovia.com",
  },
};

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--pub-bg)" }}>
      {/* ── Section 1: Hero ── */}
      <Hero />

      {/* ── Section 2: Social Proof Bar (portal coverage marquee) ── */}
      <SocialProofBar />

      {/* ── Section 3: Live Stats Bar ── */}
      <StatsBar />

      {/* ── Section 4: Problem (PAS) ── */}
      <ProblemSection />

      {/* ── Section 5: How It Works ── */}
      <HowItWorks />

      {/* ── Section 6: Pricing (2 tiers + Enterprise) ── */}
      <PricingSection />

      {/* ── Section 6b: Comparison Table ── */}
      <ComparisonTable />

      {/* ── Section 7: FAQ ── */}
      <FAQSection />

      {/* ── Section 8: Final CTA (dark band) ── */}
      <FinalCTA />

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
