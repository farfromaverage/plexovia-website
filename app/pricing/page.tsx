import type { Metadata } from "next";
import PricingSection from "@/components/home/pricing-section";
import ComparisonTable from "@/components/home/comparison-table";
import FAQSection from "@/components/home/faq-section";
import MissedOpportunityCalc from "@/components/home/missed-opportunity-calc";
import Footer from "@/components/home/footer";

export const metadata: Metadata = {
  title: "Pricing | Plexovia",
  description: "Simple, transparent pricing for government contractors. Compare plans and start your 7-day free trial today.",
  alternates: {
    canonical: "https://plexovia.com/pricing",
  },
  openGraph: {
    title: "Plexovia Pricing: Flat Monthly Rate",
    description: "Simple, transparent pricing for government contractors. Cancel anytime. Start your 7-day free trial today.",
    url: "https://plexovia.com/pricing",
    images: [{ url: "https://plexovia.com/og-pricing.jpg", width: 1200, height: 630 }],
  },
};

export default function PricingPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Plexovia Platform",
    "description": "Government contract matching and intelligence platform covering SAM.gov and state portals.",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": "299",
      "availability": "https://schema.org/InStock",
      "url": "https://plexovia.com/pricing"
    }
  };

  return (
    <div style={{ backgroundColor: "var(--pub-bg)", paddingTop: "4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PricingSection />
      <ComparisonTable />
      <MissedOpportunityCalc />
      <FAQSection />
      <Footer />
    </div>
  );
}
