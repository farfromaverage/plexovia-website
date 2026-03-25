import type { Metadata } from "next";
import DevPageClient from "./client";

export const metadata: Metadata = {
  title: "Component Showcase | Plexovia Dev",
  description: "Internal design system QA page — not indexed.",
  robots: { index: false, follow: false },
};

export default function DevPage() {
  return <DevPageClient />;
}
