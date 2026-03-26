import type { Metadata } from "next";
import Hero from "@/components/home/hero";
import SocialProofBar from "@/components/home/social-proof-bar";
import StatsBar from "@/components/home/stats-bar";
import ProblemSection from "@/components/home/problem-section";
import FAQSection from "@/components/home/faq-section";
import FinalCTA from "@/components/home/final-cta";
import Footer from "@/components/home/footer";

export const metadata: Metadata = {
  title: "Government Contract Alerts for All 50 States | Plexovia",
  description:
    "Stop manually checking SAM.gov. Plexovia monitors 50 state portals and SAM.gov daily. Scored contract matches delivered to your inbox by 6 AM. 7-day free trial.",
  alternates: {
    canonical: "https://plexovia.com",
  },
  openGraph: {
    title: "Plexovia: Government Contract Alerts for All 50 States",
    description:
      "Stop manually checking SAM.gov. Get scored contract matches in your inbox by 6 AM. All 50 states. 7-day free trial.",
    url: "https://plexovia.com",
  },
};

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "var(--pub-bg)" }}>
      <Hero />
      <SocialProofBar />
      <StatsBar />
      <ProblemSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
