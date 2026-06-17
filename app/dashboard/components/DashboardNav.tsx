"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, FileText, User,
  CreditCard, LogOut, LayoutList,
  HelpCircle, ChevronRight, TrendingUp,
} from "lucide-react";
import { SupportModal } from "./SupportModal";

/* ─── Navigation Items ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { href: "/dashboard/pipeline",    label: "Pipeline",    icon: LayoutList },
  { href: "/dashboard",             label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/contracts",   label: "Contracts",             icon: FileText },
  { href: "/dashboard/competitors", label: "Market Intelligence",   icon: TrendingUp },
  { href: "/dashboard/profile",     label: "Profile",               icon: User },
  { href: "/dashboard/billing",     label: "Billing",      icon: CreditCard },
] as const;

/* Bottom tabs: 4 items max (impeccable cognitive-load ≤5 rule) */
const BOTTOM_TABS = [
  { href: "/dashboard/pipeline",    label: "Pipeline",    icon: LayoutList },
  { href: "/dashboard/contracts",   label: "Contracts",   icon: FileText },
  { href: "/dashboard/competitors", label: "Intel",       icon: TrendingUp },
  { href: "/dashboard/profile",     label: "Profile",     icon: User },
] as const;

/* ─── Component ────────────────────────────────────────────────── */
export default function DashboardNav() {
  const pathname = usePathname();
  const router   = useRouter();

  const [userEmail,      setUserEmail]      = useState<string | null>(null);
  const [userName,       _setUserName]      = useState<string>("");
  const [signingOut,     setSigningOut]     = useState(false);
  const [trialDaysLeft,  setTrialDaysLeft]  = useState<number | null>(null);
  const [showSupport,    setShowSupport]    = useState(false);
  const [newMatchCount,  setNewMatchCount]  = useState(0);

  /* ── Fetch user data ── */
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

  /* ── Freshness badge: count new matches since last visit ── */
  useEffect(() => {
    try {
      const lastVisit = localStorage.getItem("plexovia-last-visit");
      if (!lastVisit) return; // first visit — don't show badge

      // Fetch matches and count newer ones
      fetch("/api/user-matches?per_page=100")
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data?.matches) return;
          const lastDate = new Date(lastVisit).getTime();
          const newCount = data.matches.filter(
            (m: { matched_at: string }) => new Date(m.matched_at).getTime() > lastDate
          ).length;
          setNewMatchCount(newCount);
        })
        .catch(() => { /* network error — silent degrade */ });
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  /* ── Sign out ── */
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  /* ── Active state helper ── */
  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ──────────── Desktop Sidebar ──────────── */}
      <aside className="dash-sidebar dash-hide-mobile" aria-label="Sidebar navigation">
        {/* Header: Wordmark + Trial badge */}
        <div className="dash-sidebar-header">
          <Link href="/">
            <span className="dash-wordmark">
              <span style={{ color: "var(--accent)" }}>P</span>
              <span style={{ color: "var(--app-text)" }}>lexovia</span>
            </span>
          </Link>
          {trialDaysLeft !== null && (
            <div className="dash-trial-badge">
              Trial · {trialDaysLeft}d left ·{" "}
              <Link href="/dashboard/billing">Upgrade</Link>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav aria-label="Dashboard navigation">
          <ul className="dash-nav-list">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="dash-nav-link"
                    data-active={active ? "true" : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
                    {label}
                    {/* Freshness badge on Contracts + Pipeline */}
                    {(label === "Contracts" || label === "Pipeline") && newMatchCount > 0 && (
                      <span className="dash-nav-badge" aria-label={`${newMatchCount} new contracts`}>
                        {newMatchCount > 99 ? "99+" : newMatchCount}
                      </span>
                    )}
                    {active && <ChevronRight size={11} style={{ marginLeft: "auto", opacity: 0.35 }} aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: Actions + Sign out */}
        <div className="dash-nav-footer">
          {/* Support */}
          <button className="dash-nav-btn" onClick={() => setShowSupport(true)}>
            <HelpCircle size={14} aria-hidden="true" />
            Contact Support
          </button>

          {/* Sign out */}
          <button
            className="dash-signout"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out of Plexovia"
          >
            <LogOut size={13} aria-hidden="true" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* ──────────── Mobile Bottom Tab Bar ──────────── */}
      <nav className="dash-bottom-tabs dash-show-mobile" aria-label="Mobile navigation">
        {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="dash-bottom-tab"
              data-active={active ? "true" : undefined}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
              {/* Freshness badge on Contracts tab */}
              {(label === "Contracts" || label === "Pipeline") && newMatchCount > 0 && (
                <span className="dash-bottom-tab-badge" aria-label={`${newMatchCount} new`}>
                  {newMatchCount > 99 ? "99+" : newMatchCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ──────────── Support Modal ──────────── */}
      {userEmail && (
        <SupportModal
          isOpen={showSupport}
          onClose={() => setShowSupport(false)}
          userEmail={userEmail}
          userName={userName}
        />
      )}
    </>
  );
}
