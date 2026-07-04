"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, ExternalLink, Plus, Shield, Clock, MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { engineFetch } from "@/lib/engine";
import {
  type PipelineItem,
  type UrgencyLevel,
  STAGE_ORDER,
  STAGE_LABELS,
  ACTIVE_STAGES,
  isTerminal,
  stageIndex,
  scoreLevel,
  fmtDeadline,
  fmtUpdated,
  fmtSetAside,
  fmtValueShort,
} from "./pipeline-helpers";

interface Props {
  item: PipelineItem | null;
  onClose: () => void;
  onStageChange: (matchId: string, newStage: string) => Promise<void>;
  onNotesUpdate: (matchId: string, notes: string) => void;
  onUrlAdd: (matchId: string, url: string) => void;
  onUrlRemove: (matchId: string, url: string) => void;
}

interface Incumbent {
  awardee_name: string;
  award_amount: number | null;
  award_date: string | null;
}

const urgencyLabel: Record<UrgencyLevel, string> = {
  safe: "on track",
  warning: "deadline approaching",
  danger: "deadline urgent",
  expired: "deadline expired",
  none: "no deadline",
};

export default function PipelineDrawer({
  item, onClose, onStageChange, onNotesUpdate, onUrlAdd, onUrlRemove,
}: Props) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [addingUrl, setAddingUrl] = useState(false);
  const [incumbent, setIncumbent] = useState<Incumbent | null | undefined>(undefined);
  const [incumbentError, setIncumbentError] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const prevMatchId = useRef<string | null>(null);

  /* ── Focus trap + scroll lock ── */
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!item) return;

    triggerRef.current = document.activeElement as HTMLElement;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", escapeHandler);
    document.addEventListener("keydown", handleTabKey);

    const timer = setTimeout(() => closeRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("keydown", escapeHandler);
      document.removeEventListener("keydown", handleTabKey);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      clearTimeout(timer);
      triggerRef.current?.focus();
    };
  }, [item, handleTabKey, onClose]);

  /* ── Reset state on item change ── */
  useEffect(() => {
    if (item && prevMatchId.current !== item.match_id) {
      prevMatchId.current = item.match_id;
      setNotes(item.pipeline_notes || "");
      setEditingNotes(false);
      setIncumbent(undefined);
      setIncumbentError(false);
      setUrlInput("");
      setUrlError(null);
    }
  }, [item]);

  /* ── Incumbent fetch with AbortController ── */
  useEffect(() => {
    if (!item || !item.naics_code) return;
    if (prevMatchId.current !== item.match_id) return;

    const controller = new AbortController();
    const agencyParam = item.agency ? `&agency=${encodeURIComponent(item.agency)}` : "";
    engineFetch(`/api/user/competitors/incumbent?naics_code=${item.naics_code}${agencyParam}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setIncumbent(data.incumbent ?? null);
        setIncumbentError(false);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setIncumbent(null);
        setIncumbentError(true);
      });

    return () => controller.abort();
  }, [item]);

  if (!item) return null;

  const deadline = fmtDeadline(item.deadline);
  const sl = scoreLevel(item.score);
  const sIdx = stageIndex(item.pipeline_stage);
  const terminal = isTerminal(item.pipeline_stage);

  const saveNotes = () => {
    setSavingNotes(true);
    onNotesUpdate(item.match_id, notes);
    setEditingNotes(false);
    setTimeout(() => setSavingNotes(false), 1500);
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError("Please enter a URL.");
      return;
    }
    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      setUrlError("Enter a valid URL starting with http:// or https://");
      return;
    }
    setUrlError(null);
    setAddingUrl(true);
    onUrlAdd(item.match_id, trimmed);
    setUrlInput("");
    setTimeout(() => setAddingUrl(false), 1500);
  };

  const matchReasons = (item.match_reasons || []).filter((r) => !r.startsWith("density:"));
  const valueStr = fmtValueShort(item);

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            className="pipe-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            ref={drawerRef}
            className="pipe-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${item.title} — ${item.agency}, ${urgencyLabel[deadline.urgency]}`}
          >
            {/* Header */}
            <div className="pipe-drawer-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                {item.solicitation_number && (
                  <p className="pipe-drawer-sub">{item.solicitation_number}</p>
                )}
                <h2 className="pipe-drawer-title">{item.title}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span className="pipe-card-score" data-level={sl}>
                    {item.score}
                  </span>
                  <span className="pipe-card-deadline" data-urgency={deadline.urgency}>
                    <Clock size={11} aria-hidden="true" />
                    {deadline.label}
                    {deadline.daysLeft !== null && deadline.daysLeft > 0 && ` (${deadline.daysLeft}d)`}
                  </span>
                  {item.density_label && (
                    <span className="dash-tag dash-tag-muted" style={{ fontSize: "0.625rem" }}>
                      {item.density_label}
                    </span>
                  )}
                </div>
              </div>
              <button
                ref={closeRef}
                className="pipe-drawer-close"
                onClick={onClose}
                aria-label="Close detail panel"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="pipe-drawer-body">
              {/* Stage selector with progress */}
              <div className="pipe-drawer-section">
                <label className="pipe-drawer-label" htmlFor="pipe-stage-select">Pipeline Stage</label>
                <div className="pipe-drawer-stage-row">
                  <select
                    id="pipe-stage-select"
                    className="pipe-drawer-stage-select"
                    value={item.pipeline_stage}
                    onChange={(e) => onStageChange(item.match_id, e.target.value)}
                  >
                    {STAGE_ORDER.map((s) => (
                      <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                {!terminal && (
                  <div
                    className="pipe-drawer-progress"
                    role="progressbar"
                    aria-valuenow={sIdx + 1}
                    aria-valuemin={1}
                    aria-valuemax={ACTIVE_STAGES.length}
                    aria-label={`Stage ${sIdx + 1} of ${ACTIVE_STAGES.length}: ${STAGE_LABELS[item.pipeline_stage]}`}
                  >
                    {ACTIVE_STAGES.map((s, i) => (
                      <div
                        key={s}
                        className="pipe-drawer-progress-step"
                        data-complete={i < sIdx}
                        data-active={i === sIdx}
                      />
                    ))}
                  </div>
                )}
                {item.pipeline_updated_at && (
                  <p style={{ fontSize: "0.6875rem", color: "var(--app-faint)", margin: "6px 0 0" }}>
                    Last updated {fmtUpdated(item.pipeline_updated_at)}
                  </p>
                )}
              </div>

              {/* Metadata grid */}
              <div className="pipe-drawer-section">
                <div className="pipe-drawer-label">Opportunity Details</div>
                <div className="pipe-drawer-meta-grid">
                  <div className="pipe-drawer-meta-item">
                    <span className="pipe-drawer-meta-label">Agency</span>
                    <span className="pipe-drawer-meta-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Shield size={11} aria-hidden="true" />
                      {item.agency}
                    </span>
                  </div>
                  <div className="pipe-drawer-meta-item">
                    <span className="pipe-drawer-meta-label">NAICS</span>
                    <span className="pipe-drawer-meta-value">
                      {item.naics_code}
                      {item.naics_title ? ` — ${item.naics_title}` : ""}
                    </span>
                  </div>
                  <div className="pipe-drawer-meta-item">
                    <span className="pipe-drawer-meta-label">PSC</span>
                    <span className="pipe-drawer-meta-value">
                      {item.psc_code || "N/A"}
                      {item.psc_title ? ` — ${item.psc_title}` : ""}
                    </span>
                  </div>
                  <div className="pipe-drawer-meta-item">
                    <span className="pipe-drawer-meta-label">Set-Aside</span>
                    <span className="pipe-drawer-meta-value">
                      {item.set_aside ? fmtSetAside(item.set_aside) : "None"}
                    </span>
                  </div>
                  <div className="pipe-drawer-meta-item">
                    <span className="pipe-drawer-meta-label">Value Range</span>
                    <span className="pipe-drawer-meta-value">{valueStr || "Not specified"}</span>
                  </div>
                  <div className="pipe-drawer-meta-item">
                    <span className="pipe-drawer-meta-label">State</span>
                    <span className="pipe-drawer-meta-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={11} aria-hidden="true" />
                      {item.state || "N/A"}
                    </span>
                  </div>
                  {item.posted_date && (
                    <div className="pipe-drawer-meta-item">
                      <span className="pipe-drawer-meta-label">Posted</span>
                      <span className="pipe-drawer-meta-value">
                        {new Date(item.posted_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {item.deadline && (
                    <div className="pipe-drawer-meta-item">
                      <span className="pipe-drawer-meta-label">Full Deadline</span>
                      <span className="pipe-drawer-meta-value">
                        {new Date(item.deadline).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Match reasons */}
              {matchReasons.length > 0 && (
                <div className="pipe-drawer-section">
                  <div className="pipe-drawer-label">Match Reasons</div>
                  <div className="pipe-drawer-reasons">
                    {matchReasons.map((reason, i) => (
                      <span key={i} className="pipe-drawer-reason">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Incumbent intelligence */}
              {incumbent !== undefined && (
                <div className="pipe-drawer-section">
                  <div className="pipe-drawer-label">Known Incumbent</div>
                  <div className="pipe-drawer-incumbent">
                    {incumbentError ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--app-faint)" }}>
                        Could not load incumbent data. Try again later.
                      </span>
                    ) : incumbent ? (
                      <>
                        <div className="pipe-drawer-incumbent-name">{incumbent.awardee_name}</div>
                        <div className="pipe-drawer-incumbent-meta">
                          {incumbent.award_amount && (
                            <span>${(incumbent.award_amount / 1000000).toFixed(1)}M</span>
                          )}
                          {incumbent.award_date && (
                            <span style={{ marginLeft: incumbent.award_amount ? 8 : 0 }}>
                              awarded {new Date(incumbent.award_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--app-faint)" }}>
                        {item.naics_code
                          ? "No known incumbent. This may be a new requirement."
                          : "Enter a NAICS code to look up incumbents."}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Research notes */}
              <div className="pipe-drawer-section">
                <label className="pipe-drawer-label" htmlFor="pipe-notes-input">
                  Research Notes
                  {item.pipeline_notes && ` (${item.pipeline_notes.length} chars)`}
                </label>
                {editingNotes ? (
                  <>
                    <textarea
                      id="pipe-notes-input"
                      className="pipe-drawer-notes-edit"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={10000}
                      rows={5}
                      placeholder="Incumbent analysis, teaming options, pricing notes..."
                      autoFocus
                    />
                    <div className="pipe-drawer-notes-actions">
                      <button
                        className="dash-btn dash-btn-primary"
                        onClick={saveNotes}
                        disabled={savingNotes}
                        style={{ fontSize: "0.75rem", padding: "4px 14px", minHeight: 28 }}
                      >
                        {savingNotes ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="dash-btn"
                        onClick={() => { setNotes(item.pipeline_notes || ""); setEditingNotes(false); }}
                        style={{ fontSize: "0.75rem", padding: "4px 14px", minHeight: 28 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    className={`pipe-drawer-notes-display${item.pipeline_notes ? "" : " placeholder"}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditingNotes(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setEditingNotes(true);
                      }
                    }}
                    aria-label={item.pipeline_notes ? "Edit research notes" : "Add research notes"}
                  >
                    {item.pipeline_notes || "Click to add research notes..."}
                  </div>
                )}
              </div>

              {/* Reference links */}
              <div className="pipe-drawer-section">
                <label className="pipe-drawer-label" htmlFor="pipe-url-input">Reference Links</label>
                {(item.reference_urls || []).map((u) => (
                  <div key={u} className="pipe-drawer-url-row">
                    <a href={u} target="_blank" rel="noopener noreferrer">{u}</a>
                    <button
                      className="pipe-drawer-url-remove"
                      onClick={() => onUrlRemove(item.match_id, u)}
                      aria-label={`Remove ${u}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="pipe-drawer-url-add">
                  <input
                    id="pipe-url-input"
                    type="url"
                    className="pipe-drawer-url-input"
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setUrlError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && addUrl()}
                    placeholder="Paste URL (SAM.gov, Google Drive...)"
                    aria-invalid={!!urlError}
                    aria-describedby={urlError ? "pipe-url-error" : undefined}
                  />
                  <button
                    className="dash-btn dash-btn-accent"
                    onClick={addUrl}
                    disabled={addingUrl || !urlInput.trim()}
                    style={{ fontSize: "0.75rem", padding: "4px 10px", minHeight: 28 }}
                  >
                    {addingUrl ? "..." : <Plus size={14} />}
                  </button>
                </div>
                {urlError && (
                  <p id="pipe-url-error" className="pipe-url-error" role="alert">{urlError}</p>
                )}
              </div>

              {/* SAM.gov link */}
              {item.url && (
                <div className="pipe-drawer-section">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dash-btn dash-btn-accent"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    View on SAM.gov <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
