import type { Metadata } from "next";
import DashboardNav from "./components/DashboardNav";
import "./dashboard.css";

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

      {/* Mobile: push content below fixed 52px header */}
      <style>{`
        @media (max-width: 768px) {
          .dash-hide-mobile  { display: none !important; }
          .dash-show-mobile  { display: flex !important; }
          .dash-content-wrapper { padding-top: 52px; }
        }
        @media (min-width: 769px) {
          .dash-show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
