"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { engineFetch } from "@/lib/engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, X, ExternalLink, Users,
  Calendar, Trash2, BarChart3,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface TrackedVendor {
  id: string;
  vendor_name: string;
  vendor_name_normalized: string;
  naics_filter: string[];
  created_at: string;
}

interface Award {
  id: string;
  awardee_name: string;
  award_amount: number | null;
  award_date: string | null;
  agency: string | null;
  contract_title: string | null;
  naics_code: string | null;
  sam_url: string | null;
}

interface LandscapeItem {
  naics_code: string;
  total_awards: number;
  top_awardees: { awardee_name: string; award_count: number }[];
  average_award: number;
}

/* ─── Formatters ─────────────────────────────────────────────── */
function fmtAmount(n: number | null): string {
  if (!n) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "Unknown";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ─── Award Card ─────────────────────────────────────────────── */
function AwardCard({ award }: { award: Award }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "10px 12px", marginBottom: 6,
        background: "var(--app-surface-raised)",
        border: "1px solid var(--app-border)", borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--app-text)", margin: "0 0 4px" }}>
            {award.contract_title || "Untitled Award"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: "0.7rem", color: "var(--app-muted)" }}>
            {award.agency && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Building2 size={10} aria-hidden="true" /> {award.agency}
              </span>
            )}
            {award.naics_code && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <BarChart3 size={10} aria-hidden="true" /> {award.naics_code}
              </span>
            )}
            {award.award_date && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Calendar size={10} aria-hidden="true" /> {fmtDate(award.award_date)}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--app-text)" }}>
            {fmtAmount(award.award_amount)}
          </span>
          {award.sam_url && (
            <a
              href={award.sam_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.65rem", color: "var(--accent)", marginTop: 2, textDecoration: "none" }}
            >
              USASpending <ExternalLink size={9} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function CompetitorsPage() {
  const router = useRouter();
  const [tracked, setTracked] = useState<TrackedVendor[]>([]);
  const [feeds, setFeeds] = useState<Record<string, Award[]>>({});
  const [landscape, setLandscape] = useState<LandscapeItem[]>([]);
  const [newVendor, setNewVendor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [trackedRes, landscapeRes] = await Promise.all([
        engineFetch("/api/user/competitors/tracked"),
        (async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return null;
          const { data: profile } = await supabase.from("profiles").select("naics_codes").eq("id", session.user.id).single();
          if (!profile?.naics_codes?.length) return null;
          const params = new URLSearchParams();
          profile.naics_codes.forEach((n: string) => params.append("naics_codes", n));
          return engineFetch(`/api/user/competitors/landscape?${params.toString()}`);
        })(),
      ]);

      if (trackedRes.ok) {
        const json = await trackedRes.json();
        setTracked(json.competitors || []);
      }
      if (landscapeRes?.ok) {
        const json = await landscapeRes.json();
        setLandscape(json.landscape || []);
      }
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth/login"); return; }
      fetchAll();
    });
  }, [router, fetchAll]);

  const addVendor = async () => {
    if (!newVendor.trim()) return;
    try {
      const res = await engineFetch("/api/user/competitors/tracked", {
        method: "POST",
        body: JSON.stringify({ vendor_name: newVendor.trim(), naics_filter: [] }),
      });
      if (res.ok) {
        setNewVendor("");
        fetchAll();
      }
    } catch { /* silent */ }
  };

  const removeVendor = async (id: string) => {
    try {
      await engineFetch(`/api/user/competitors/tracked/${id}`, { method: "DELETE" });
      setTracked((prev) => prev.filter((v) => v.id !== id));
      setFeeds((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch { /* silent */ }
  };

  const loadFeed = async (vendorName: string) => {
    if (feeds[vendorName]) return;
    try {
      const res = await engineFetch(`/api/user/competitors/feed/${encodeURIComponent(vendorName)}`);
      if (res.ok) {
        const json = await res.json();
        setFeeds((prev) => ({ ...prev, [vendorName]: json.awards || [] }));
      }
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="dash-spin" style={{ width: 32, height: 32 }} aria-label="Loading…" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "var(--space-4)" }}>
        <X size={28} style={{ color: "var(--danger)" }} aria-hidden="true" />
        <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--app-text)" }}>Could not load competitive intelligence</p>
        <button onClick={fetchAll} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--app-border)", background: "var(--app-surface)", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", color: "var(--app-text)", fontFamily: "inherit" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="dash-main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        style={{ marginBottom: "var(--space-5)" }}
      >
        <h1 style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--app-text)", margin: 0, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={22} color="var(--accent)" aria-hidden="true" />
          Competitive Intelligence
        </h1>
        <p style={{ color: "var(--app-muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
          Track vendors and monitor awards in your NAICS codes
        </p>
      </motion.div>

      {/* Tracked Vendors Section */}
      <div className="dash-card" style={{ padding: "var(--space-5)", marginBottom: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)", gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--app-text)", margin: 0 }}>Tracked Vendors</h2>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={newVendor}
              onChange={(e) => setNewVendor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addVendor()}
              placeholder="Add vendor by name (e.g. Leidos)"
              style={{
                width: 220, padding: "5px 10px", borderRadius: 6,
                border: "1px solid var(--app-border)", fontSize: "0.78rem",
                color: "var(--app-text)", background: "var(--app-surface)",
              }}
            />
            <button
              onClick={addVendor}
              style={{
                padding: "5px 12px", borderRadius: 6, border: "none",
                background: "var(--accent)", color: "#fff", cursor: "pointer",
                fontWeight: 600, fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </div>

        {tracked.length === 0 ? (
          <p style={{ fontSize: "0.8rem", color: "var(--app-faint)", padding: "1rem 0", textAlign: "center" }}>
            No vendors tracked yet. Add competitors to monitor their recent awards.
          </p>
        ) : (
          tracked.map((v) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="button"
              tabIndex={0}
              style={{
                marginBottom: 8, padding: "10px 12px",
                background: "var(--app-surface-raised)", border: "1px solid var(--app-border)",
                borderRadius: 8, cursor: "pointer",
              }}
              onClick={() => loadFeed(v.vendor_name)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadFeed(v.vendor_name); } }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Building2 size={14} style={{ color: "var(--accent)" }} aria-hidden="true" />
                  <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--app-text)" }}>
                    {v.vendor_name}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "var(--app-faint)" }}>
                    added {fmtDate(v.created_at)}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeVendor(v.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--app-faint)" }}
                  aria-label={`Remove ${v.vendor_name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <AnimatePresence>
                {feeds[v.vendor_name] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ marginTop: 10, borderTop: "1px solid var(--app-border)", paddingTop: 10 }}>
                      {feeds[v.vendor_name].length === 0 ? (
                        <p style={{ fontSize: "0.75rem", color: "var(--app-faint)" }}>No recent awards found.</p>
                      ) : (
                        feeds[v.vendor_name].slice(0, 10).map((award) => (
                          <AwardCard key={award.id} award={award} />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Competitive Landscape */}
      {landscape.length > 0 && (
        <div className="dash-card" style={{ padding: "var(--space-5)", marginBottom: "var(--space-5)" }}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--app-text)", margin: 0 }}>
              Competitive Landscape — Your NAICS Codes
            </h2>
            <p style={{ color: "var(--app-muted)", fontSize: "0.75rem", margin: "3px 0 0" }}>
              Based on USASpending.gov award data from the last 24 months
            </p>
          </div>

          {landscape.map((item) => (
            <div key={item.naics_code} style={{
              marginBottom: 12, padding: "12px 14px",
              border: "1px solid var(--app-border)", borderRadius: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--app-text)" }}>
                  NAICS {item.naics_code}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--app-muted)" }}>
                  {item.total_awards} awards · avg {fmtAmount(item.average_award)}
                </span>
              </div>
              {item.top_awardees.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {item.top_awardees.map((a) => (
                    <span key={a.awardee_name} style={{
                      fontSize: "0.72rem", padding: "2px 8px", borderRadius: 999,
                      background: "var(--app-surface)", border: "1px solid var(--app-border)",
                      color: "var(--app-text)", fontWeight: 500,
                    }}>
                      {a.awardee_name} ({a.award_count})
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.75rem", color: "var(--app-faint)", margin: 0 }}>Insufficient award data for this NAICS.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
