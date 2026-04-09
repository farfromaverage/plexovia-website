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
      "price": "249",
      "availability": "https://schema.org/InStock",
      "url": "https://plexovia.com/pricing"
    }
  };

  const pricingFaqs = [
    {
      id: "pfaq-0",
      q: "What happens when my trial ends?",
      a: "You receive a reminder email on Day 6. On Day 8, your card is charged for your first billing cycle. If you cancel before Day 8, you pay nothing. After that, cancellation takes under 60 seconds from your billing page. No phone call, no support ticket.",
    },
    {
      id: "pfaq-1",
      q: "Can I switch between monthly and yearly billing?",
      a: "Yes. You can switch from monthly to yearly (or back) at any time from your billing settings. If you switch from monthly to yearly mid-cycle, we will prorate the remaining balance of your current month and apply it as a credit to your annual subscription.",
    },
    {
      id: "pfaq-2",
      q: "What if I need to add team members?",
      a: "Each seat is $249 per month (or $1,999/year). You can add or remove seats at any time from your account settings. For teams of 10 or more, contact us for volume pricing at enterprise@plexovia.com.",
    },
    {
      id: "pfaq-3",
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and ACH bank transfers for annual plans. All payments are processed through Stripe. We can also accommodate purchase orders for enterprise accounts.",
    },
    {
      id: "pfaq-4",
      q: "Is there a refund policy?",
      a: "If you are not satisfied within your first 30 days as a paying customer, email support@plexovia.com and we will issue a full refund. No questions asked. After 30 days, cancellation stops future charges but does not refund the current cycle.",
    },
    {
      id: "pfaq-5",
      q: "How does the set-aside precision filter work?",
      a: "When you set up your profile, you specify your certifications (8(a), WOSB, SDVOSB, HUBZone, etc.). The engine applies strict prefiltering so your digest only includes contracts where your set-aside eligibility gives you a legal priority. Contracts that do not match your certifications are excluded before scoring.",
    },
  ];

  return (
    <div style={{ backgroundColor: "var(--pub-bg)", paddingTop: "4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <PricingSection />
      <ComparisonTable />
      <MissedOpportunityCalc />
      <FAQSection
        items={pricingFaqs}
        title="Pricing & billing questions"
      />
      <Footer />
    </div>
  );
}

