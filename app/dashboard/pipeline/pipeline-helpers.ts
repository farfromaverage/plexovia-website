/* ─── Pipeline Types ─────────────────────────────────────────── */

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

export interface ScorecardData {
  total_tracked: number;
  active_pursuits: number;
  proposals_submitted: number;
  wins: number;
  not_awarded: number;
  no_bid: number;
  win_rate: number | null;
}

export interface PipelineStatus {
  has_bookmarks: boolean;
  bookmark_count: number;
  last_pipeline_completed_at: string | null;
}

/* ─── Stage Constants ────────────────────────────────────────── */

export const STAGE_ORDER = [
  "qualifying", "pursuing",
  "proposal_in_progress", "submitted",
  "awarded", "not_awarded", "no_bid",
] as const;

export const ACTIVE_STAGES = STAGE_ORDER.slice(0, 4);
export const TERMINAL_STAGES = STAGE_ORDER.slice(4);

export const STAGE_LABELS: Record<string, string> = {
  qualifying: "Qualifying",
  pursuing: "Pursuing",
  proposal_in_progress: "Proposal In Progress",
  submitted: "Submitted",
  awarded: "Awarded",
  not_awarded: "Not Awarded",
  no_bid: "No Bid",
};

/* ─── Utility Functions ──────────────────────────────────────── */

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

export type ScoreLevel = "high" | "mid" | "low";
export type UrgencyLevel = "safe" | "warning" | "danger" | "expired" | "none";

export function scoreLevel(s: number): ScoreLevel {
  if (s >= 70) return "high";
  if (s >= 40) return "mid";
  return "low";
}

export function fmtDeadline(d: string | null): {
  label: string;
  daysLeft: number | null;
  urgency: UrgencyLevel;
} {
  if (!d) return { label: "No deadline", daysLeft: null, urgency: "none" };
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / MS_PER_DAY);
  if (days < 0) return { label: "Expired", daysLeft: days, urgency: "expired" };
  if (days === 0) return { label: "Due today", daysLeft: 0, urgency: "danger" };
  if (days === 1) return { label: "Due tomorrow", daysLeft: 1, urgency: "danger" };
  if (days <= 3) return { label: `${days}d`, daysLeft: days, urgency: "danger" };
  if (days <= 7) return { label: `${days}d`, daysLeft: days, urgency: "warning" };
  if (days <= 14) return { label: `${days}d`, daysLeft: days, urgency: "warning" };
  return {
    label: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    daysLeft: days,
    urgency: "safe",
  };
}

export function fmtUpdated(ts: string | null): string {
  if (!ts) return "";
  const dt = new Date(ts);
  if (isNaN(dt.getTime())) return "";
  const diff = Date.now() - dt.getTime();
  const mins = Math.floor(diff / MS_PER_MINUTE);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtSetAside(raw: string): string {
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

export function isTerminal(stage: string): boolean {
  return TERMINAL_STAGES.includes(stage as typeof TERMINAL_STAGES[number]);
}

export function nextStage(stage: string): string | null {
  const idx = STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number]);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function stageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number]);
}

export function fmtValueShort(item: PipelineItem): string | null {
  if (item.value_range) return item.value_range;
  if (item.value_min && item.value_max) {
    if (item.value_min === item.value_max) return `$${(item.value_min / 1000).toFixed(0)}K`;
    return `$${(item.value_min / 1000).toFixed(0)}K\u2013$${(item.value_max / 1000).toFixed(0)}K`;
  }
  if (item.value_min) return `$${(item.value_min / 1000).toFixed(0)}K+`;
  if (item.value_max) return `Up to $${(item.value_max / 1000).toFixed(0)}K`;
  return null;
}
