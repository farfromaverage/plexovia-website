import type { Metadata } from "next";
import PricingSection from "@/components/home/pricing-section";
import ComparisonTable from "@/components/home/comparison-table";
import FAQSection from "@/components/home/faq-section";
import FinalCTA from "@/components/home/final-cta";
import Footer from "@/components/home/footer";

export const metadata: Metadata = {
  title: "Pricing | Plexovia",
  description: "Simple, transparent pricing for government contractors. Compare plans and start your 7-day free trial today.",
};

export default function PricingPage() {
  return (
    <div style={{ backgroundColor: "var(--pub-bg)", paddingTop: "4rem" }}>
      <PricingSection />
      <ComparisonTable />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
