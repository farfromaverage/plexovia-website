"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, Shield, DollarSign, Award,
  Search, RefreshCw,
} from "lucide-react";
import SkeletonRows from "../components/SkeletonRows";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

const NAICS_DESCRIPTIONS: Record<string, string> = {
  "541511": "Custom Computer Programming Services",
  "541512": "Computer Systems Design Services",
  "541513": "Computer Facilities Management Services",
  "541519": "Other Computer Related Services",
  "541330": "Engineering Services",
  "541430": "Graphic Design Services",
  "236220": "Commercial & Institutional Building Construction",
  "237310": "Highway, Street & Bridge Construction",
  "811212": "Computer & Office Machine Repair",
  "611420": "Computer Training",
  "561110": "Office Administrative Services",
  "488110": "Air Traffic Control",
  "336411": "Aircraft Manufacturing",
  "334511": "Search, Detection & Navigation Equipment",
  "541715": "Research & Development",
  "518210": "Data Processing & Hosting",
  "611710": "Educational Support Services",
  "922120": "Police Protection",
  "561210": "Facilities Support Services",
  "237110": "Water & Sewer Line Construction",
};

interface Competitor {
  company_name: string;
  total_awards: number;
  total_value: number;
  naics_codes: string[];
  latest_award: string | null;
  win_rate?: number;
  naics_overlap?: string[];
}

interface CompetitorResponse {
  competitors: Competitor[];
  total_competitors: number;
  data_through?: string;
}

function fmt$(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtDate(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PERIOD_OPTIONS = [
  { value: 30,  label: "Last 30 days" },
  { value: 90,  label: "Last 90 days" },
  { value: 180, label: "Last 180 days" },
  { value: 365, label: "Last year" },
];

export default function CompetitorsPage() {
  const [data,         setData]     = useState<CompetitorResponse | null>(null);
  const [loading,      setLoading]  = useState(true);
  const [error,        setError]    = useState(false);
  const [naicsCodes,   setNaics]    = useState<string[]>([]);
  const [days,         setDays]     = useState(90);
  const [search,       setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/user-competitors?days=${days}&limit=25`);
      if (res.status === 400) {
        // No NAICS codes configured — treat as empty, not error
        setData({ competitors: [], total_competitors: 0 });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    // Load user's NAICS codes for context
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return;
        supabase.from("profiles")
          .select("naics_codes")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => { if (data?.naics_codes) setNaics(data.naics_codes); });
      });
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const competitors = data?.competitors ?? [];
  const total = data?.total_competitors ?? 0;
  const dataThrough = data?.data_through;

  const filtered = search.trim()
    ? competitors.filter(c => c.company_name.toLowerCase().includes(search.toLowerCase()))
    : competitors;

  const topCompetitor = filtered[0];
  const totalContractsWon = filtered.reduce((s, c) => s + c.total_awards, 0);
  const totalValueAwarded = filtered.reduce((s, c) => s + c.total_value, 0);

  const currentPeriodLabel = PERIOD_OPTIONS.find(o => o.value === days)?.label ?? "Last 90 days";

  return (
    <div className="dash-main">

      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Competitor Tracking</h1>
          <p className="dash-page-sub">
            Companies winning contracts in your NAICS codes · {currentPeriodLabel}
            {naicsCodes.length > 0 && (
              <span style={{ color: "var(--app-faint)" }}> ({naicsCodes.slice(0, 4).join(", ")}{naicsCodes.length > 4 ? ` +${naicsCodes.length - 4}` : ""})</span>
            )}
          </p>
          {dataThrough && (
            <p style={{ fontSize: "0.75rem", color: "var(--app-faint)", marginTop: 2 }}>
              Data through {new Date(dataThrough).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {PERIOD_OPTIONS.map(o => (
            <button
              key={o.value}
              className={`dash-pill${days === o.value ? " active" : ""}`}
              aria-pressed={days === o.value}
              onClick={() => setDays(o.value)}
            >
              {o.label}
            </button>
          ))}
          <button
            className="dash-btn"
            onClick={load}
            aria-label="Refresh competitor data"
            disabled={loading}
          >
            <RefreshCw size={12} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Insight banner */}
      {!loading && !error && topCompetitor && (
        <div className="dash-alert-warning" style={{ marginBottom: "1.5rem" }}>
          <TrendingUp size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>{topCompetitor.company_name}</strong> is the most active competitor:
            {" "}{topCompetitor.total_awards} contracts worth {fmt$(topCompetitor.total_value)} in {currentPeriodLabel.toLowerCase()}.
          </span>
        </div>
      )}

      {/* Summary stats */}
      {!loading && !error && filtered.length > 0 && (
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}
          aria-label="Competitor statistics"
        >
          {[
            { icon: <Award size={14} aria-hidden="true" />,       label: "Companies tracked",    value: String(total) },
            { icon: <TrendingUp size={14} aria-hidden="true" />,  label: "Total contracts won",  value: String(totalContractsWon.toLocaleString()) },
            { icon: <DollarSign size={14} aria-hidden="true" />,  label: "Total value awarded",  value: fmt$(totalValueAwarded) },
            { icon: <Shield size={14} aria-hidden="true" />,      label: "NAICS codes tracked",  value: String(naicsCodes.length) },
          ].map(({ icon, label, value }) => (
            <div key={label} className="dash-stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className="dash-label" style={{ marginBottom: 0 }}>{label}</span>
                <span style={{ color: "var(--app-faint)" }}>{icon}</span>
              </div>
              <p className="dash-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--app-text)", margin: 0, letterSpacing: "-0.03em" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {competitors.length > 0 && (
        <div style={{ position: "relative", marginBottom: "1rem", maxWidth: 380 }}>
          <label htmlFor="competitor-search" className="sr-only">Search competitors</label>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--app-muted)", pointerEvents: "none" }} aria-hidden="true" />
          <input
            id="competitor-search"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company name…"
            className="dash-input"
            style={{ paddingLeft: 30 }}
          />
        </div>
      )}

      {/* Table */}
      <div className="dash-card">
        {/* Table head */}
        <div
          className="dash-table-head dash-hide-mobile"
          style={{ display: "grid", gridTemplateColumns: "40px 1fr 110px 130px 140px" }}
        >
          <span className="dash-th">#</span>
          <span className="dash-th">Company</span>
          <span className="dash-th">Contracts</span>
          <span className="dash-th">Total Value</span>
          <span className="dash-th">Latest Win</span>
        </div>

        {loading ? (
          <SkeletonRows rows={6} columns={5} columnWidths="40px 1fr 110px 130px 140px" />
        ) : error ? (
          <ErrorState
            message="Could not load competitor data. Please try again."
            onRetry={load}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={28} />}
            title={competitors.length === 0 && naicsCodes.length === 0 ? "Add NAICS codes first" : "No data yet"}
            message={
              naicsCodes.length === 0
                ? "Add NAICS codes to your profile so we can track who's winning contracts in your space."
                : search
                  ? "No competitors match your search."
                  : `Competitor data populates as the engine tracks award history in your NAICS codes. Check back in a few days.`
            }
            action={
              naicsCodes.length === 0 ? (
                <Link
                  href="/dashboard/profile"
                  className="dash-btn dash-btn-accent"
                  style={{ textDecoration: "none", padding: "8px 16px" }}
                >
                  Set up NAICS codes →
                </Link>
              ) : undefined
            }
          />
        ) : (
          filtered.map((c, i) => (
            <CompetitorRow key={c.company_name} c={c} rank={i + 1} />
          ))
        )}
      </div>

      {/* NAICS legend */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: "10px" }}>
          <p className="dash-label" style={{ marginBottom: "0.5rem" }}>Your tracked NAICS codes</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {naicsCodes.map(code => (
              <span
                key={code}
                className="dash-tag dash-tag-muted dash-mono"
                title={NAICS_DESCRIPTIONS[code] ?? code}
                style={{ cursor: "help", fontSize: "0.75rem", padding: "3px 8px" }}
              >
                {code}
                {NAICS_DESCRIPTIONS[code] &&
                  <span style={{ fontFamily: "inherit", marginLeft: 4, opacity: 0.7 }}>
                    · {NAICS_DESCRIPTIONS[code].split(" ").slice(0, 3).join(" ")}…
                  </span>
                }
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitorRow({ c, rank }: { c: Competitor; rank: number }) {
  return (
    <div
      className="dash-table-row"
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 110px 130px 140px",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1rem 1.5rem",
      }}
    >
      {/* Rank */}
      <span
        className="dash-mono"
        style={{ fontSize: "0.85rem", fontWeight: 700, color: rank <= 3 ? "var(--accent)" : "var(--app-faint)", textAlign: "center" }}
        aria-label={`Rank ${rank}`}
      >
        #{rank}
      </span>

      {/* Company + NAICS */}
      <div>
        <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--app-text)", margin: "0 0 4px" }}>
          {c.company_name}
        </p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {c.naics_codes.slice(0, 3).map(n => {
            const desc = NAICS_DESCRIPTIONS[n];
            return (
              <span
                key={n}
                className="dash-tag dash-tag-green dash-mono"
                title={desc ?? n}
                style={{ cursor: desc ? "help" : "default", fontSize: "0.65rem", padding: "1px 6px" }}
              >
                {n}
              </span>
            );
          })}
          {c.naics_codes.length > 3 && (
            <span style={{ fontSize: "0.68rem", color: "var(--app-faint)" }}>+{c.naics_codes.length - 3}</span>
          )}
        </div>
      </div>

      {/* Awards */}
      <div style={{ textAlign: "right" }}>
        <p className="dash-mono" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--app-text)", margin: 0 }}>
          {c.total_awards.toLocaleString()}
        </p>
        <p style={{ fontSize: "0.7rem", color: "var(--app-muted)", margin: "2px 0 0" }}>contracts won</p>

        {/* Win rate mini bar */}
        {c.win_rate !== undefined && (
          <div style={{ marginTop: "4px" }}>
            <div className="dash-progress-track" style={{ height: "4px" }}>
              <div className="dash-progress-fill" style={{ width: `${Math.min(100, c.win_rate)}%` }} />
            </div>
            <p style={{ fontSize: "0.65rem", color: "var(--app-faint)", margin: "2px 0 0" }}>
              {c.win_rate.toFixed(0)}% win rate
            </p>
          </div>
        )}
      </div>

      {/* Total value */}
      <div style={{ textAlign: "right" }}>
        <p className="dash-mono" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--accent)", margin: 0 }}>
          {fmt$(c.total_value)}
        </p>
        <p style={{ fontSize: "0.7rem", color: "var(--app-muted)", margin: "2px 0 0" }}>total awarded</p>
      </div>

      {/* Latest award */}
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: "0.78rem", color: "var(--app-muted)", margin: 0 }}>
          {fmtDate(c.latest_award)}
        </p>
        <p style={{ fontSize: "0.7rem", color: "var(--app-faint)", margin: "2px 0 0" }}>latest win</p>
      </div>
    </div>
  );
}
