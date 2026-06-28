"use client";

import {
  Shield, ChevronRight, Plus, X, ExternalLink, Clock, Users, BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { engineFetch } from "@/lib/engine";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─────────────────────────────────────────────────── */
export interface PipelineItem {
  match_id: string;
  pipeline_stage: string;
  pipeline_notes: string;
  reference_urls: string[];
  pipeline_updated_at: string | null;
  score: number;
  match_reasons: string[];
  density_label: string;
  naics_title: string;
  psc_title: string;
  solicitation_number: string;
  award_count: number;
  title: string;
  agency: string;
  naics_code: string;
  psc_code: string;
  fed_org_code: string;
  state: string;
  deadline: string | null;
  set_aside: string;
  url: string | null;
  posted_date: string | null;
  value_min: number | null;
  value_max: number | null;
  value_range: string;
}

export interface StageColumn {
  stage: string;
  label: string;
  count: number;
  items: PipelineItem[];
}

interface Props {
  column: StageColumn;
  onStageChange: (matchId: string, newStage: string) => Promise<void>;
  onNotesUpdate: (matchId: string, notes: string) => void;
  onUrlAdd: (matchId: string, url: string) => void;
  onUrlRemove: (matchId: string, url: string) => void;
}

function scoreColor(s: number): string {
  if (s >= 70) return "var(--success)";
  if (s >= 40) return "var(--warning)";
  return "var(--danger)";
}

const STAGE_ORDER = [
  "qualifying", "pursuing",
  "proposal_in_progress", "submitted", "awarded",
  "not_awarded", "no_bid",
];

const STAGE_LABEL: Record<string, string> = {
  qualifying: "Qualifying",
  pursuing: "Pursuing",
  proposal_in_progress: "Proposal In Progress",
  submitted: "Submitted",
  awarded: "Awarded",
  not_awarded: "Not Awarded",
  no_bid: "No Bid",
};

const TERMINAL_STAGES = ["awarded", "not_awarded", "no_bid"];

function fmtDeadline(d: string | null): {
  label: string; daysLeft: number | null; urgent: boolean; expired: boolean;
} {
  if (!d) return { label: "No deadline", daysLeft: null, urgent: false, expired: false };
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", daysLeft: days, urgent: true, expired: true };
  if (days === 0) return { label: "Due today", daysLeft: 0, urgent: true, expired: false };
  if (days === 1) return { label: "Due tomorrow", daysLeft: 1, urgent: true, expired: false };
  if (days <= 7) return { label: `${days}d`, daysLeft: days, urgent: true, expired: false };
  if (days <= 14) return { label: `${days}d`, daysLeft: days, urgent: false, expired: false };
  return {
    label: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    daysLeft: days, urgent: false, expired: false,
  };
}

const expandVariants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" },
  expanded:  { height: "auto", opacity: 1, overflow: "visible" },
};

function fmtUpdated(ts: string | null): string {
  if (!ts) return "";
  const dt = new Date(ts);
  if (isNaN(dt.getTime())) return "";
  const diff = Date.now() - dt.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtSetAside(raw: string): string {
  const map: Record<string, string> = {
    SB: "Small Business",
    "8A": "8(a)",
    WOSB: "WOSB",
    EDWOSB: "EDWOSB",
    SDVOSB: "SDVOSB",
    HUBZONE: "HUBZone",
    VETERAN: "Veteran",
    UNRESTRICTED: "Full & Open",
  };
  const upper = (raw || "").toUpperCase();
  return map[upper] || raw || "";
}

function PipelineCard({
  item, onStageChange, onNotesUpdate, onUrlAdd, onUrlRemove,
}: {
  item: PipelineItem;
  onStageChange: (matchId: string, newStage: string) => Promise<void>;
  onNotesUpdate: (matchId: string, notes: string) => void;
  onUrlAdd: (matchId: string, url: string) => void;
  onUrlRemove: (matchId: string, url: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(item.pipeline_notes || "");
  const [urlInput, setUrlInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [incumbent, setIncumbent] = useState<{
    awardee_name: string;
    award_amount: number | null;
    award_date: string | null;
  } | null | undefined>(undefined);
  const currentIdx = STAGE_ORDER.indexOf(item.pipeline_stage);

  useEffect(() => { setNotes(item.pipeline_notes || ""); }, [item.pipeline_notes]);

  useEffect(() => {
    if (expanded && incumbent === undefined && item.naics_code) {
      const agencyParam = item.agency ? `&agency=${encodeURIComponent(item.agency)}` : "";
      engineFetch(`/api/user/competitors/incumbent?naics_code=${item.naics_code}${agencyParam}`)
        .then((r) => r.json())
        .then((data) => setIncumbent(data.incumbent))
        .catch(() => setIncumbent(null));
    }
  }, [expanded, incumbent, item.naics_code, item.agency]);
  const deadline = fmtDeadline(item.deadline);

  const advance = async () => {
    if (currentIdx < STAGE_ORDER.length - 1 && !advancing) {
      setAdvancing(true);
      try {
        await onStageChange(item.match_id, STAGE_ORDER[currentIdx + 1]);
      } finally {
        setAdvancing(false);
      }
    }
  };

  const saveNotes = () => {
    setSavingNotes(true);
    onNotesUpdate(item.match_id, notes);
    setEditing(false);
    setTimeout(() => setSavingNotes(false), 2000);
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && /^https?:\/\/\S+$/.test(trimmed)) {
      setAddingUrl(true);
      onUrlAdd(item.match_id, trimmed);
      setUrlInput("");
      setTimeout(() => setAddingUrl(false), 2000);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      style={{
        background: "var(--app-surface-raised)",
        border: deadline.expired ? "1px solid var(--danger-border)" : "1px solid var(--app-border)",
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        cursor: "pointer",
        opacity: deadline.expired ? 0.65 : 1,
      }}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: Solicitation + Score + Density */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            {item.solicitation_number && (
              <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--app-muted)", letterSpacing: "0.02em" }}>
                {item.solicitation_number}
              </span>
            )}
            <span style={{
              fontSize: "0.625rem", fontWeight: 700, padding: "1px 6px",
              borderRadius: 999, background: scoreColor(item.score) + "1a",
              color: scoreColor(item.score),
            }}>
              {item.score}%
            </span>
            {item.density_label && (
              <span style={{
                fontSize: "0.625rem", fontWeight: 600, padding: "1px 6px",
                borderRadius: 999,
                background: item.density_label === "Low Competition"
                  ? "var(--success-subtle)"
                  : item.density_label === "High Competition"
                  ? "var(--danger-subtle)"
                  : "var(--warning-subtle)",
                color: item.density_label === "Low Competition"
                  ? "var(--success)"
                  : item.density_label === "High Competition"
                  ? "var(--danger)"
                  : "var(--warning)",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <Users size={9} aria-hidden="true" /> {item.density_label}
              </span>
            )}
            {deadline.expired && (
              <span style={{
                fontSize: "0.625rem", fontWeight: 600, padding: "1px 6px",
                borderRadius: 999, background: "var(--danger-subtle)",
                color: "var(--danger)", display: "flex", alignItems: "center", gap: 3,
              }}>
                <Clock size={9} aria-hidden="true" /> Expired
              </span>
            )}
          </div>
          {/* Row 2: Title */}
          <p style={{
            fontWeight: 600, fontSize: "0.8rem", color: "var(--app-text)",
            margin: "0 0 3px", lineHeight: 1.3, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.title}
          </p>
          {/* Row 3: Agency + NAICS + PSC */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ fontSize: "0.65rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 2 }}>
              <Shield size={9} aria-hidden="true" /> {item.agency}
            </span>
            {item.naics_code && (
              <span style={{ fontSize: "0.6rem", color: "var(--app-faint)" }} title={item.naics_title}>
                {item.naics_code}{item.naics_title ? ` \u2014 ${item.naics_title}` : ""}
              </span>
            )}
            {item.psc_code && (
              <span style={{ fontSize: "0.6rem", color: "var(--app-faint)" }} title={item.psc_title}>
                PSC {item.psc_code}{item.psc_title ? ` \u2014 ${item.psc_title}` : ""}
              </span>
            )}
          </div>
          {/* Row 4: Deadline + Value + Set Aside + Last Updated */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {item.deadline && (
              <span style={{
                fontSize: "0.65rem", fontWeight: deadline.urgent ? 600 : 400,
                color: deadline.expired ? "var(--app-faint)" :
                       deadline.urgent ? "var(--danger)" : "var(--app-muted)",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <Clock size={10} aria-hidden="true" />
                {deadline.label}{deadline.daysLeft !== null && deadline.daysLeft > 0 ? ` (${deadline.daysLeft}d)` : ""}
              </span>
            )}
            {item.value_range && (
              <span style={{ fontSize: "0.65rem", color: "var(--app-muted)", fontWeight: 500 }}>
                {item.value_range}
              </span>
            )}
            {item.set_aside && (
              <span style={{
                fontSize: "0.6rem", padding: "0px 5px", borderRadius: 4,
                background: "var(--app-border)", color: "var(--app-muted)",
              }}>
                {fmtSetAside(item.set_aside)}
              </span>
            )}
            {item.pipeline_updated_at && (
              <span style={{ fontSize: "0.58rem", color: "var(--app-faint)" }}>
                {fmtUpdated(item.pipeline_updated_at)}
              </span>
            )}
            {!TERMINAL_STAGES.includes(item.pipeline_stage) && item.award_count > 0 && (
              <span style={{
                fontSize: "0.625rem", fontWeight: 600, padding: "1px 6px",
                borderRadius: 999,
                background: "var(--accent-subtle)",
                color: "var(--accent)",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <BarChart3 size={9} aria-hidden="true" /> {item.award_count} awards
              </span>
            )}
          </div>
        </div>
        {/* Advance button + Notes indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          {!TERMINAL_STAGES.includes(item.pipeline_stage) && (
            <button
              onClick={(e) => { e.stopPropagation(); advance(); }}
              disabled={advancing}
              title="Advance to next stage"
              style={{
                background: "none", border: "none", cursor: advancing ? "wait" : "pointer",
                padding: 2, color: advancing ? "var(--app-faint)" : "var(--accent)",
                opacity: advancing ? 0.5 : 1,
              }}
              aria-label="Advance stage"
            >
              {advancing ? (
                <span style={{ fontSize: "0.6rem", fontStyle: "italic" }}>...</span>
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}
          {!expanded && item.pipeline_notes && (
            <span style={{ fontSize: "0.6rem", color: "var(--app-faint)", fontWeight: 500 }}>
              Noted
            </span>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={expandVariants}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div style={{ marginTop: 10, borderTop: "1px solid var(--app-border)", paddingTop: 10 }}>
              {/* Solicitation + Stage selector */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {item.solicitation_number && (
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <label style={{ fontSize: "0.7rem", color: "var(--app-muted)", display: "block", marginBottom: 4 }}>
                        Solicitation
                      </label>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--app-text)", letterSpacing: "0.02em" }}>
                        {item.solicitation_number}
                      </span>
                    </div>
                  )}
                  <div style={{ minWidth: 140 }}>
                    <label style={{ fontSize: "0.7rem", color: "var(--app-muted)", display: "block", marginBottom: 4 }}>
                      Stage
                    </label>
                    <select
                      value={item.pipeline_stage}
                      onChange={(e) => onStageChange(item.match_id, e.target.value)}
                      style={{
                        width: "100%", padding: "6px 8px", borderRadius: 6,
                        border: "1px solid var(--app-border)", fontSize: "0.8rem",
                        color: "var(--app-text)", background: "var(--app-surface)",
                      }}
                    >
                      {STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {item.pipeline_updated_at && (
                  <span style={{ fontSize: "0.6rem", color: "var(--app-faint)", display: "block", marginTop: 4 }}>
                    Last updated {fmtUpdated(item.pipeline_updated_at)} &middot; {new Date(item.pipeline_updated_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
              </div>

              {/* Incumbent Intelligence */}
              {incumbent !== undefined && (
                <div style={{
                  marginBottom: 10, padding: "8px 10px",
                  background: "var(--accent-subtle)", borderRadius: 6,
                  border: "1px solid var(--accent-border)",
                }}>
                  <label style={{ fontSize: "0.65rem", color: "var(--app-muted)", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Known Incumbent
                  </label>
                  {incumbent ? (
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--app-text)" }}>
                        {incumbent.awardee_name}
                      </span>
                      {incumbent.award_amount && (
                        <span style={{ marginLeft: 8, fontSize: "0.72rem", color: "var(--app-muted)" }}>
                          ${(incumbent.award_amount / 1000000).toFixed(1)}M
                        </span>
                      )}
                      {incumbent.award_date && (
                        <span style={{ marginLeft: 6, fontSize: "0.68rem", color: "var(--app-faint)" }}>
                          awarded {new Date(incumbent.award_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--app-faint)" }}>
                      {item.naics_code ? "No known incumbent. This may be a new requirement." : "Enter a NAICS code to look up incumbents."}
                    </span>
                  )}
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: "0.7rem", color: "var(--app-muted)", display: "block", marginBottom: 4 }}>
                  Research Notes {item.pipeline_notes ? `(${item.pipeline_notes.length} chars)` : ""}
                </label>
                {editing ? (
                  <div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={10000}
                      rows={4}
                      style={{
                        width: "100%", padding: "8px", borderRadius: 6,
                        border: "1px solid var(--accent-border)", fontSize: "0.8rem",
                        fontFamily: "inherit", color: "var(--app-text)",
                        background: "var(--app-surface)", resize: "vertical",
                      }}
                      placeholder="Incumbent analysis, teaming options, pricing notes..."
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button
                        onClick={saveNotes}
                        disabled={savingNotes}
                        style={{
                          padding: "4px 12px", borderRadius: 6, border: "none",
                          background: savingNotes ? "var(--app-muted)" : "var(--accent)",
                          color: "#fff",
                          fontWeight: 600, fontSize: "0.75rem", cursor: savingNotes ? "wait" : "pointer",
                        }}
                      >
                        {savingNotes ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setNotes(item.pipeline_notes || ""); setEditing(false); }}
                        style={{
                          padding: "4px 12px", borderRadius: 6,
                          border: "1px solid var(--app-border)", background: "transparent",
                          fontWeight: 600, fontSize: "0.75rem", cursor: "pointer",
                          color: "var(--app-muted)",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditing(true)}
                    style={{
                      padding: "8px 10px", borderRadius: 6, minHeight: 36,
                      border: "1px solid var(--app-border)",
                      fontSize: "0.8rem", color: item.pipeline_notes ? "var(--app-text)" : "var(--app-faint)",
                      cursor: "pointer", whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}
                  >
                    {item.pipeline_notes || "Click to add research notes..."}
                  </div>
                )}
              </div>

              {/* Reference URLs */}
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: "0.7rem", color: "var(--app-muted)", display: "block", marginBottom: 4 }}>
                  Reference Links
                </label>
                {(item.reference_urls || []).map((u) => (
                  <div key={u} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <a
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.7rem", color: "var(--accent)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {u}
                    </a>
                    <button
                      onClick={() => onUrlRemove(item.match_id, u)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--app-faint)" }}
                      aria-label="Remove link"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUrl()}
                    placeholder="Paste URL (SAM.gov, Google Drive...)"
                    style={{
                      flex: 1, padding: "4px 8px", borderRadius: 6,
                      border: "1px solid var(--app-border)", fontSize: "0.7rem",
                      color: "var(--app-text)", background: "var(--app-surface)",
                    }}
                  />
                  <button
                    onClick={addUrl}
                    disabled={addingUrl || !urlInput.trim()}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "none",
                      background: addingUrl ? "var(--app-muted)" : "var(--app-surface)",
                      color: addingUrl ? "var(--app-faint)" : "var(--accent)",
                      fontWeight: 600, fontSize: "0.7rem", cursor: addingUrl ? "wait" : "pointer",
                      opacity: addingUrl ? 0.5 : 1,
                    }}
                  >
                    {addingUrl ? "..." : <Plus size={14} />}
                  </button>
                </div>
              </div>

              {/* External SAM.gov link */}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: "0.7rem", color: "var(--accent)", textDecoration: "none",
                    marginTop: 4, fontWeight: 600,
                  }}
                >
                  View on SAM.gov <ExternalLink size={10} aria-hidden="true" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PipelineColumn({
  column, onStageChange, onNotesUpdate, onUrlAdd, onUrlRemove,
}: Props) {
  return (
    <div style={{
      flex: "1 1 260px", minWidth: 240, maxWidth: 340,
      background: "var(--app-surface)",
      border: "1px solid var(--app-border)",
      borderRadius: 10, padding: "12px 10px",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12, paddingBottom: 8,
        borderBottom: "2px solid var(--accent-border)",
      }}>
        <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--app-text)" }}>
          {column.label}
        </span>
        <span style={{
          fontSize: "0.7rem", fontWeight: 700,
          color: "var(--app-muted)", background: "var(--app-border)",
          borderRadius: 999, padding: "1px 8px",
        }}>
          {column.count}
        </span>
      </div>

      {column.items.length === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center", color: "var(--app-faint)", fontSize: "0.75rem" }}>
          No opportunities
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {column.items.map((item) => (
            <PipelineCard
              key={item.match_id}
              item={item}
              onStageChange={onStageChange}
              onNotesUpdate={onNotesUpdate}
              onUrlAdd={onUrlAdd}
              onUrlRemove={onUrlRemove}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
