"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, FileText, User, TrendingUp,
  Brain, Users, CreditCard, LogOut, Menu, X, ChevronRight
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",             label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/contracts",   label: "Contracts",    icon: FileText },
  { href: "/dashboard/profile",     label: "Profile",      icon: User },
  { href: "/dashboard/competitors", label: "Competitors",  icon: TrendingUp },
  { href: "/dashboard/forecasts",   label: "AI Forecasts", icon: Brain },
  { href: "/dashboard/team",        label: "Team",         icon: Users },
  { href: "/dashboard/billing",     label: "Billing",      icon: CreditCard },
] as const;

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserEmail(session.user.email ?? null);
      supabase
        .from("profiles")
        .select("trial_ends_at, plan")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.trial_ends_at && data.plan === "trial") {
            const days = Math.max(0, Math.ceil(
              (new Date(data.trial_ends_at).getTime() - Date.now()) / 86400000
            ));
            setTrialDaysLeft(days);
          }
        });
    });
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const navContent = (
    <>
      {/* Logo */}
      <div style={{
        padding: "1.25rem 1.25rem 1rem",
        borderBottom: "1px solid var(--app-border)",
        flexShrink: 0,
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.05em" }}>
            <span style={{ color: "var(--accent)" }}>P</span>
            <span style={{ color: "var(--app-text)" }}>lexovia</span>
          </span>
        </Link>
        {trialDaysLeft !== null && (
          <div style={{
            marginTop: "0.625rem",
            padding: "4px 10px",
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "6px",
            fontSize: "0.7rem",
            color: "var(--accent)",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}>
            Trial · {trialDaysLeft}d left ·{" "}
            <Link
              href="/dashboard/billing"
              style={{ color: "inherit", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "2px" }}
            >
              Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav aria-label="Dashboard navigation" style={{ padding: "0.625rem 0.625rem", flex: 1, overflowY: "auto" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    fontWeight: active ? 600 : 400,
                    textDecoration: "none",
                    marginBottom: "1px",
                    color: active ? "var(--accent)" : "var(--app-muted)",
                    background: active ? "rgba(201,168,76,0.08)" : "transparent",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = "var(--app-surface-2)";
                      el.style.color = "var(--app-text)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = "transparent";
                      el.style.color = "var(--app-muted)";
                    }
                  }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
                  {label}
                  {active && <ChevronRight size={11} style={{ marginLeft: "auto", opacity: 0.35 }} aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div style={{ padding: "0.625rem", borderTop: "1px solid var(--app-border)", flexShrink: 0 }}>
        {userEmail && (
          <div style={{
            padding: "7px 10px",
            borderRadius: "7px",
            marginBottom: "4px",
            background: "var(--app-surface-2)",
          }}>
            <p style={{
              fontSize: "0.72rem",
              color: "var(--app-muted)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {userEmail}
            </p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out of Plexovia"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 10px",
            borderRadius: "7px",
            border: "none",
            background: "none",
            color: "var(--app-muted)",
            fontSize: "0.875rem",
            cursor: signingOut ? "wait" : "pointer",
            fontFamily: "inherit",
            opacity: signingOut ? 0.6 : 1,
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={e => {
            if (!signingOut) {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = "#F87171";
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "none";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--app-muted)";
          }}
        >
          <LogOut size={13} aria-hidden="true" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className="dash-hide-mobile"
        style={{
          width: "216px",
          flexShrink: 0,
          height: "100dvh",
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--app-surface)",
          borderRight: "1px solid var(--app-border)",
          overflowY: "auto",
        }}
      >
        {navContent}
      </aside>

      {/* Mobile: fixed top bar */}
      <div
        className="dash-show-mobile"
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: "52px",
          background: "var(--app-surface)",
          borderBottom: "1px solid var(--app-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          zIndex: 100,
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.05em" }}>
            <span style={{ color: "var(--accent)" }}>P</span>
            <span style={{ color: "var(--app-text)" }}>lexovia</span>
          </span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(v => !v)}
          aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-nav-drawer"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--app-text)", padding: "8px", borderRadius: "6px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {isMobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        >
          <div
            id="mobile-nav-drawer"
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: "260px",
              height: "100dvh",
              background: "var(--app-surface)",
              borderRight: "1px solid var(--app-border)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile navigation"
            aria-modal="true"
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
