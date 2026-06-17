"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { engineFetch } from "@/lib/engine";
import { supabase } from "@/lib/supabase";

interface SearchResult {
  id: string;
  title: string;
  agency: string;
  naics_code: string;
  state: string;
  posted_date: string | null;
  deadline: string | null;
  set_aside: string;
  url: string | null;
  description: string;
  value_min: number | null;
  value_max: number | null;
  psc_code: string;
}

interface Props {
  onSearchModeChange?: (active: boolean) => void;
}

export default function SearchPanel({ onSearchModeChange }: Props) {
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  useEffect(() => { onSearchModeChange?.(searchMode); }, [searchMode, onSearchModeChange]);

  const doSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() && !searchMode) return;
    setSearching(true);
    try {
      const params = new URLSearchParams();
      params.set("q", searchQuery.trim());
      const res = await engineFetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.results || []);
        setSearchMode(true);
      }
    } catch { /* silent */ }
    finally { setSearching(false); }
  };

  const clearSearch = () => {
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const trackSearchResult = async (contractId: string) => {
    setTrackingId(contractId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const insertRes = await supabase
        .from("matches")
        .insert({
          user_id: session.user.id,
          contract_id: contractId,
          score: 0,
          pipeline_stage: "qualifying",
          pipeline_updated_at: new Date().toISOString(),
          match_reasons: ["manual_search"],
        })
        .select("id")
        .single();
      if (insertRes.data) {
        setTimeout(() => setTrackingId(null), 2000);
      }
    } catch { /* silent */ }
  };

  return (
    <>
      {/* ── Search Bar + Mode Toggle ── */}
      <div style={{ marginBottom: "var(--space-4)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={clearSearch}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid var(--app-border)",
              background: !searchMode ? "var(--accent)" : "transparent",
              color: !searchMode ? "#fff" : "var(--app-text)",
              fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            My Matches
          </button>
          <button
            onClick={() => setSearchMode(true)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid var(--app-border)",
              background: searchMode ? "var(--accent)" : "transparent",
              color: searchMode ? "#fff" : "var(--app-text)",
              fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            Search All
          </button>
        </div>

        {searchMode && (
          <form onSubmit={doSearch} style={{ display: "flex", gap: 6, flex: 1, minWidth: 200 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, flex: 1,
              border: "1px solid var(--accent-border)", borderRadius: 8,
              padding: "0 10px", background: "var(--app-surface)",
            }}>
              <Search size={14} style={{ color: "var(--app-faint)" }} aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all contracts by title, NAICS, agency..."
                style={{
                  flex: 1, padding: "7px 0", border: "none", outline: "none",
                  fontSize: "0.85rem", color: "var(--app-text)",
                  background: "transparent", fontFamily: "inherit",
                }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              style={{
                padding: "7px 14px", borderRadius: 6, border: "none",
                background: "var(--accent)", color: "#fff", cursor: "pointer",
                fontWeight: 600, fontSize: "0.82rem",
                opacity: searching ? 0.6 : 1,
              }}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>
        )}
      </div>

      {/* ── Search Results ── */}
      {searchMode && !searching && (
        <div>
          {searchResults.length === 0 ? (
            <div style={{ padding: "2rem 0", textAlign: "center" }}>
              <p style={{ fontWeight: 600, color: "var(--app-text)", margin: "0 0 4px" }}>
                {searchQuery ? `No contracts matching "${searchQuery}"` : "Enter a search term to find contracts"}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--app-muted)", margin: 0 }}>
                Try searching by title keywords, NAICS codes, or agency names
              </p>
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "var(--space-3)", padding: "0 4px",
              }}>
                <span style={{ fontSize: "0.78rem", color: "var(--app-muted)" }}>
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                  {searchQuery ? ` for "${searchQuery}"` : ""} · last 90 days
                </span>
              </div>
              {searchResults.map((r) => (
                <div key={r.id} className="dash-contract-row" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      {r.naics_code && <span className="dash-match-tag" data-type="naics">NAICS {r.naics_code}</span>}
                      {r.set_aside && (
                        <span style={{ fontSize: "0.625rem", padding: "1px 6px", borderRadius: 999, background: "var(--app-surface)", color: "var(--app-muted)" }}>
                          {r.set_aside}
                        </span>
                      )}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.35 }}>
                      {r.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--app-muted)" }}>{r.agency || "Federal Agency"}</span>
                      {r.state && <span style={{ fontSize: "0.72rem", color: "var(--app-muted)" }}>{r.state}</span>}
                      <span style={{ fontSize: "0.72rem", color: "var(--app-muted)" }}>
                        Posted {r.posted_date ? new Date(r.posted_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                      </span>
                      {r.deadline && (
                        <span style={{ fontSize: "0.72rem", color: "var(--app-faint)" }}>
                          Deadline {new Date(r.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <p style={{ fontSize: "0.72rem", color: "var(--app-faint)", margin: "4px 0 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {r.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="dash-link-external">SAM.gov</a>}
                    <button
                      onClick={() => trackSearchResult(r.id)}
                      disabled={trackingId === r.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 10px", borderRadius: 6, border: "none",
                        background: trackingId === r.id ? "var(--success)" : "var(--accent)",
                        color: "#fff", cursor: "pointer",
                        fontWeight: 600, fontSize: "0.72rem",
                        opacity: trackingId && trackingId !== r.id ? 0.4 : 1,
                        transition: "background 0.15s, opacity 0.15s",
                      }}
                      title="Track this contract in your pipeline"
                    >
                      {trackingId === r.id ? "Tracked!" : "Track This"}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
}
