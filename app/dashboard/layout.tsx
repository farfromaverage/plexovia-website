import type { Metadata } from "next";
import DashboardNav from "./components/DashboardNav";
import "./dashboard.css";

import PaymentFailedBanner from "./components/PaymentFailedBanner";

export const metadata: Metadata = {
  title: {
    template: "%s | Plexovia Dashboard",
    default: "Dashboard | Plexovia",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        background: "var(--app-bg)",
        color: "var(--app-text)",
        fontFamily: "var(--font-inter), sans-serif",
      }}
    >
      {/* Skip to main content — accessibility */}
      <a
        href="#dashboard-main"
        className="dash-skip-link"
      >
        Skip to main content
      </a>

      <DashboardNav />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowX: "hidden",
        }}
        className="dash-content-wrapper"
      >
        <PaymentFailedBanner />
        <main
          id="dashboard-main"
          tabIndex={-1}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            outline: "none",
          }}
        >
          {children}
        </main>
      </div>

      {/*
       * Mobile responsive utilities are now in dashboard.css:
       * .dash-hide-mobile, .dash-show-mobile, .dash-content-wrapper padding
       * No inline <style> blocks needed.
       */}
    </div>
  );
}
