import type { Metadata } from "next";
import Hero from "@/components/home/hero";
import SocialProofBar from "@/components/home/social-proof-bar";
import StatsBar from "@/components/home/stats-bar";
import CoverageMap from "@/components/home/coverage-map";
import FAQSection from "@/components/home/faq-section";
import FinalCTA from "@/components/home/final-cta";
import Footer from "@/components/home/footer";

export const metadata: Metadata = {
  title: "Government Contract Intelligence System | Plexovia",
  description:
    "A system that helps you consistently find and win the right government contracts. Plexovia replaces manual searching with an automated intelligence system.",
  alternates: {
    canonical: "https://plexovia.com",
  },
  openGraph: {
    title: "Plexovia: Government Contract Intelligence System",
    description:
      "A system that helps you consistently find and win the right government contracts.",
    url: "https://plexovia.com",
  },
};

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--pub-bg)" }}>
      <Hero />
      <SocialProofBar />
      <StatsBar />
      <CoverageMap />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
