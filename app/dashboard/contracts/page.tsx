"use client";

/**
 * Plexovia — /dashboard/contracts
 *
 * FIX HISTORY (root-cause analysis, not patchwork):
 *
 * BUG 2 (DOUBLE FETCH on every tab/page switch):
 *   The previous flow on tab click was:
 *     onClick → setStatusFilter + setPage(1) + updateUrl()
 *     → router.replace() → URL changes
 *     → useEffect([urlPage, urlFilter]) fires → setStatusFilter + setPage AGAIN
 *     → load() useCallback identity changes twice (statusFilter dep)
 *     → useEffect([page, load]) fires TWICE — two fetches race.
 *
 *   FIX: Remove the URL-sync useEffect entirely. State is the source of truth.
 *   The URL is updated on user action only (not read back into state). On hard
 *   navigation (back/forward), the Suspense wrapper remounts with correct URL
 *   params via the initial useState values — no sync loop needed.
 *
 * BUG 3 (useContractStatus reads wrong localStorage key on first render):
 *   The hook used a module-level `let STORAGE_KEY` mutated by init(). On mount,
 *   useState(loadMap) runs synchronously BEFORE the async getSession() completes
 *   and calls init(). This means the first render always reads the unscoped key
 *   ("plexovia-contract-status"), so bookmarks/dismissals appear reset until the
 *   next render cycle — causing flicker and incorrect "New" counts.
 *
 *   FIX: Moved useContractStatus.ts to accept userId directly. The hook defers
 *   its initial loadMap() until init() is called with a real userId. The page
 *   waits for the session before rendering filtered content. See the updated
 *   useContractStatus.ts for the hook-side fix.
 *
 * BUG 4 (stale-data banner fires false positives):
 *   The stale poll compared overview?period=90 (which filters by created_at >=
 *   90 days ago — a RECENT matches count) against the total from user-matches
 *   (which has no created_at filter — an ALL-TIME count). They measure different
 *   things. Any difference, even from a count mismatch between the two queries,
 *   triggered the banner.
 *
 *   FIX: The stale poll now compares user-matches total against itself. It stores
 *   the total from the last successful fetch and re-fetches page 1 head-only to
 *   compare. Both calls use the same endpoint with the same filters — apples to
 *   apples.
 *
 * BUG 5 (pagination wrong on filter tabs):
 *   totalPages = ceil(total / FILTER_BATCH). But `total` is the server-side count
 *   of ALL contracts (no bookmark/dismissed/new filter on the server). Client-side
 *   filtering then reduces the visible set. totalPages was computed against the
 *   wrong denominator, making the Next button always enabled when it should be
 *   disabled (or disabled when more pages exist).
 *
 *   FIX: For client-filtered tabs (bookmarked, dismissed, new), pagination is
 *   disabled entirely — the batch already fetched everything the server has, and
 *   client-side filtering is done in memory. Pagination only applies to the "all"
 *   tab where server-side pagination is meaningful.
 *
 * BUG 6 (retry stale closure):
 *   The retry captured the `load` function from its closure at the time the error
 *   occurred. If `load` was recreated (due to page/statusFilter changes) before
 *   the retry fired, the retry called the OLD load with stale deps.
 *
 *   FIX: The retry now uses a loadRef that always points to the current load
 *   function. The retry timer calls loadRef.current() — never a stale closure.
 */

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  Suspense,
  memo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  Shield,
  Star,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Calendar,
  X,
} from "lucide-react";
import MatchScoreBadge from "@/components/ui/match-score-badge";
import SkeletonRows from "../components/SkeletonRows";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { useContractStatus } from "@/hooks/useContractStatus";
import { supabase } from "@/lib/supabase";
import { engineFetch } from "@/lib/engine";

import SearchPanel, { type SearchFilters } from "./SearchPanel";

/* ─── Types ────────────────────────────────────────────────────────────── */
interface ContractRow {
  id: string;
  title: string;
  agency: string;
  naics: string;
  psc: string;
  fedOrg: string;
  state: string;
  posted: string;
  postedRaw: string | null;
  deadline: string;
  deadlineRaw: string | null;
  deadlineDays: number | null;
  score: number;
  setAside: string;
  matchedBy: "naics" | "keyword";
  matchLabel: string;
  url: string | null;
  valueMin: number | null;
  valueMax: number | null;
  matchedAt: string | null;
  saved: boolean;
}

type StatusFilter = "all" | "new" | "bookmarked" | "dismissed";

interface SearchResult {
  id: string;
  title: string;
  agency: string;
  naics_code: string;
  psc_code: string;
  fed_org_code: string;
  state: string;
  posted_date: string | null;
  deadline: string | null;
  set_aside: string;
  url: string | null;
  description: string;
  value_min: number | null;
  value_max: number | null;
  match_score: number | null;
  match_reasons: string[] | null;
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function fmtDate(d: string | null): string {
  if (!d) return "N/A";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtDeadline(d: string | null): { label: string; days: number | null } {
  if (!d) return { label: "Not Listed", days: null };
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", days };
  if (days === 0) return { label: "Due today", days: 0 };
  if (days === 1) return { label: "Due tomorrow", days: 1 };
  return { label: `${days} days left`, days };
}

function fmtValue(min: number | null | undefined, max: number | null | undefined): string | null {
  if (min == null && max == null) return null;
  const lo = min ?? max ?? 0;
  const hi = max ?? min ?? 0;
  if (lo === 0 && hi === 0) return null;
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toLocaleString()}`;
  if (lo === hi) return fmt(lo);
  return `${fmt(lo)} – ${fmt(hi)}`;
}

interface ContractPayload {
  title?: string;
  agency?: string;
  naics_code?: string;
  psc_code?: string;
  fed_org_code?: string;
  state?: string;
  posted_date?: string;
  deadline?: string;
  set_aside?: string;
  url?: string;
  value_min?: number | null;
  value_max?: number | null;
}

interface MatchRow {
  match_id: string;
  contract: ContractPayload | null;
  reasons: string[];
  score: number;
  saved: boolean;
  matched_at: string | null;
}

function mapRow(m: MatchRow): ContractRow {
  const c = m.contract ?? {};
  const reasons = m.reasons ?? [];
  const naicsR = reasons.find((r) => r.startsWith("naics:"));
  const kwR = reasons.find((r: string) => r.startsWith("keyword:"));
  const matchedBy = naicsR ? "naics" : "keyword";
  const matchLabel = naicsR
    ? `NAICS ${naicsR.replace("naics:", "")}`
    : kwR
    ? `Keyword: ${kwR.replace("keyword:", "")}`
    : "Keyword match";
  const dl = fmtDeadline(c.deadline ?? null);
  return {
    id: m.match_id,
    title: c.title || "Untitled",
    agency: c.agency || "Federal Agency",
    naics: c.naics_code || "",
    psc: c.psc_code || "",
    fedOrg: c.fed_org_code || "",
    state: c.state || "",
    posted: fmtDate(c.posted_date ?? null),
    postedRaw: c.posted_date || null,
    deadline: dl.label,
    deadlineRaw: c.deadline || null,
    deadlineDays: dl.days,
    score: m.score,
    setAside: c.set_aside || "",
    matchedBy,
    matchLabel,
    url: c.url || null,
    valueMin: c.value_min ?? null,
    valueMax: c.value_max ?? null,
    matchedAt: m.matched_at || null,
    saved: m.saved ?? false,
  };
}

const PER_PAGE = 15;
const EXPORT_DAY_OPTIONS = [7, 14, 30, 60, 90];

/* ─── Wrapper (Suspense boundary for useSearchParams) ─────────────────── */
export default function ContractsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div
          className="dash-main"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
          }}
        >
          <div
            className="dash-spin"
            style={{
              width: 28,
              height: 28,
              border: "2px solid var(--accent)",
              borderTopColor: "transparent",
              borderRadius: "50%",
            }}
          />
        </div>
      }
    >
      <ContractsPage />
    </Suspense>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
function ContractsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // FIX (BUG 2): Read initial values from URL on mount only. State is the
  // source of truth. The URL is updated by user actions, not read back into
  // state in a reactive loop. This removes the double-fetch on tab switch.
  const [page, setPage] = useState(() =>
    Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    () => (searchParams.get("filter") as StatusFilter) || "all"
  );

  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [naicsCodes, setNaicsCodes] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [total, setTotal] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [undoId, setUndoId] = useState<string | null>(null);
  const [undoTitle, setUndoTitle] = useState("");
  const [staleData, setStaleData] = useState(false);
  const [bookmarkUpdating, setBookmarkUpdating] = useState<Set<string>>(new Set());
  const bookmarkAbortRef = useRef<AbortController | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchQueryRef = useRef("");

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const staleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // FIX (BUG 6): loadRef always points to the current load function.
  // Retry timers call loadRef.current() instead of a captured stale closure.
  const loadRef = useRef<() => void>(() => {});
  const retryCountRef = useRef(0);
  const profileLoading = useRef(true);

  // FIX (BUG 3): Track whether the session/userId is known before rendering
  // filtered content. cs.init() is async — we must not filter against the
  // wrong (unscoped) localStorage key on the first render.
  const [csReady, setCsReady] = useState(false);
  const cs = useContractStatus();

  // Init localStorage scope from session, then mark ready
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) cs.init(session.user.id);
      setCsReady(true);
    })();
    // cs is stable (hook instance never changes) — omit from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch profile NAICS codes for empty-state messaging
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("naics_codes")
        .single();
      if (data?.naics_codes) setNaicsCodes(data.naics_codes);
      profileLoading.current = false;
    })();
  }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        exportRef.current &&
        !exportRef.current.contains(e.target as Node)
      ) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // ── Transient error classifier ───────────────────────────────────────────
  const isTransient = (err: unknown): boolean => {
    if (err instanceof DOMException && err.name === "AbortError") return false;
    if (err instanceof TypeError) return true; // network failure
    if (err instanceof Error) {
      return /^HTTP (500|502|503|504)$/.test(err.message);
    }
    return false;
  };

  // ── Core fetch ───────────────────────────────────────────────────────────
  const fetchMatches = async (
    p: number,
    pp: number,
    signal: AbortSignal,
    filter: StatusFilter,
  ): Promise<{ matches: MatchRow[]; pagination: { total: number }; last_pipeline_completed_at?: string | null }> => {
    const params = new URLSearchParams({
      page: String(p),
      per_page: String(pp),
      min_score: "0",
      sort: "recency",
    });
    if (filter === "bookmarked") {
      params.set("saved", "true");
    }
    const timeoutSignal = AbortSignal.timeout(15000);
    const combined = AbortSignal.any([signal, timeoutSignal]);
    const res = await fetch(`/api/user-matches?${params.toString()}`, {
      signal: combined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  // ── Search all contracts via Supabase SSR directly ──────────────────────
  const fetchSearch = useCallback(async (query: string) => {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchLoading(true);
    setSearchError(false);
    setSearchResults([]);
    searchQueryRef.current = query;
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffISO = cutoff.toISOString().split("T")[0];
      const escaped = query.replace(/\*/g, "\\*").replace(/_/g, "\\_");

      const { data, error } = await supabase
        .from("contracts")
        .select("id, title, agency, naics_code, psc_code, fed_org_code, state, posted_date, deadline, set_aside, url, description, value_min, value_max")
        .or(
          `title.ilike.*${escaped}*,description.ilike.*${escaped}*,naics_code.ilike.${escaped}*,psc_code.ilike.${escaped}*,agency.ilike.*${escaped}*,fed_org_code.ilike.*${escaped}*,state.ilike.*${escaped}*,set_aside.ilike.*${escaped}*`,
        )
        .gte("posted_date", cutoffISO)
        .order("posted_date", { ascending: false })
        .limit(200)
        .abortSignal(controller.signal);

      if (controller.signal.aborted) return;
      if (error) throw new Error(error.message);

      const rows = data || [];

      // Enrich with match scores: query matches for contracts the user is matched to
      const matchMap: Record<string, { score: number | null; reasons: string[] | null }> = {};
      if (rows.length > 0) {
        const contractIds = rows.map((r) => r.id).filter(Boolean);
        if (contractIds.length > 0) {
          try {
            const { data: matchRows } = await supabase
              .from("matches")
              .select("contract_id, score, match_reasons")
              .in("contract_id", contractIds)
              .abortSignal(controller.signal);

            if (!controller.signal.aborted && matchRows) {
              for (const m of matchRows) {
                const cid = m.contract_id as string;
                if (cid) {
                  matchMap[cid] = { score: m.score as number | null, reasons: m.match_reasons as string[] | null };
                }
              }
            }
          } catch {
            // Match enrichment is best-effort — search results still valid without scores
          }
        }
      }

      if (controller.signal.aborted) return;
      const enriched = rows.map((r) => ({
        ...r,
        match_score: matchMap[r.id as string]?.score ?? null,
        match_reasons: matchMap[r.id as string]?.reasons ?? null,
      })) as unknown as SearchResult[];
      setSearchResults(enriched);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setSearchError(true);
    } finally {
      if (!controller.signal.aborted) setSearchLoading(false);
    }
  }, []);

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);

    try {
      // "bookmarked" is now server-side via saved=true. Only "dismissed" and "new" need client-side.
      const isClientFilterTab =
        statusFilter === "dismissed" ||
        statusFilter === "new";
      if (isClientFilterTab) {
        const firstPage = await fetchMatches(1, 100, controller.signal, statusFilter);
        if (controller.signal.aborted) return;
        const allRows = [...(firstPage.matches || [])];
        const totalAvail = firstPage.pagination?.total || 0;
        const maxPages = Math.min(5, Math.ceil(totalAvail / 100));
        for (let p = 2; p <= maxPages; p++) {
          const nextPage = await fetchMatches(p, 100, controller.signal, statusFilter);
          if (controller.signal.aborted) return;
          allRows.push(...(nextPage.matches || []));
        }
        setContracts(allRows.map(mapRow));
        setTotal(allRows.length);
        if (firstPage.last_pipeline_completed_at) {
          lastPipelineAtRef.current = firstPage.last_pipeline_completed_at;
        }
      } else {
        const json = await fetchMatches(page, PER_PAGE, controller.signal, statusFilter);
        if (controller.signal.aborted) return;
        const actualTotal = json.pagination?.total || 0;
        if ((json.matches || []).length === 0 && actualTotal > 0 && page > 1) {
          setPage(1);
          updateUrl(1, statusFilter);
          return;
        }
        setContracts((json.matches || []).map(mapRow));
        setTotal(actualTotal);
        if (json.last_pipeline_completed_at) {
          lastPipelineAtRef.current = json.last_pipeline_completed_at;
        }
      }
      retryCountRef.current = 0;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (isTransient(err) && retryCountRef.current < 3) {
        const delays = [3000, 6000, 12000];
        const delay = delays[retryCountRef.current];
        retryCountRef.current++;
        setTimeout(() => {
          if (abortRef.current === controller) loadRef.current();
        }, delay);
        return;
      }
      setError(true);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep loadRef current
  useEffect(() => {
    loadRef.current = load;
  });

  // Trigger load when page or statusFilter changes
  useEffect(() => {
    load();
  }, [page, load]);

  // ── Stale-data poll ───────────────────────────────────────────────────────
  // Uses last_pipeline_completed_at from the API (deterministic) instead of
  // count comparison which can drift due to pagination or timezone boundaries.
  const lastPipelineAtRef = useRef<string | null>(null);
  useEffect(() => {
    staleIntervalRef.current = setInterval(async () => {
      try {
        const signal = AbortSignal.timeout(10000);
        const res = await fetch("/api/user-matches?page=1&per_page=1&min_score=0", {
          signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        const pipelineAt: string | null = json.last_pipeline_completed_at ?? null;
        if (!pipelineAt) return;
        if (lastPipelineAtRef.current === null) {
          lastPipelineAtRef.current = pipelineAt;
        } else if (pipelineAt !== lastPipelineAtRef.current) {
          setStaleData(true);
        }
      } catch (err) {
        console.error("[stale-poll] fetch failed:", err);
      }
    }, 60_000);
    return () => {
      if (staleIntervalRef.current) clearInterval(staleIntervalRef.current);
    };
  }, []);

  // ── Filtered view ─────────────────────────────────────────────────────────
  // "bookmarked" is server-side (saved=true). "dismissed" / "new" are client-side (localStorage).
  const filteredContracts = csReady
    ? contracts.filter((c) => {
        if (statusFilter === "dismissed") return cs.isDismissed(c.id);
        if (statusFilter === "new")
          return !cs.isViewed(c.id) && !cs.isDismissed(c.id);
        return !cs.isDismissed(c.id);
      })
    : [];

  const isFilterTab =
    statusFilter === "dismissed" ||
    statusFilter === "new";
  const totalPages = isFilterTab ? 1 : Math.max(1, Math.ceil(total / PER_PAGE));

  // ── URL update (one direction only — state → URL, never URL → state) ────
  const updateUrl = useCallback((p: number, f: StatusFilter) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (f !== "all") params.set("filter", f);
    const qs = params.toString();
    router.replace(`/dashboard/contracts${qs ? "?" + qs : ""}`, {
      scroll: false,
    });
  }, [router]);

  function handlePageChange(np: number) {
    const clamped = Math.max(1, Math.min(totalPages, np));
    setPage(clamped);
    updateUrl(clamped, statusFilter);
  }

  function handleTabChange(tab: StatusFilter) {
    setStatusFilter(tab);
    setPage(1);
    updateUrl(1, tab);
  }

  // ── Search handlers ──────────────────────────────────────────────────────
  const handleSearch = useCallback((filters: SearchFilters) => {
    fetchSearch(filters.search);
    setPage(1);
    updateUrl(1, statusFilter);
  }, [statusFilter, updateUrl, fetchSearch]);

  const handleClearSearch = useCallback(() => {
    searchAbortRef.current?.abort();
    setSearchResults(null);
    setPage(1);
    updateUrl(1, statusFilter);
  }, [statusFilter, updateUrl]);

  // ── DB-backed bookmark toggle ────────────────────────────────────────────
  const handleToggleBookmark = useCallback(async (matchId: string, currentlySaved: boolean) => {
    bookmarkAbortRef.current?.abort();
    const controller = new AbortController();
    bookmarkAbortRef.current = controller;

    setBookmarkUpdating((prev) => new Set(prev).add(matchId));
    try {
      const res = await engineFetch(`/api/user/matches/${matchId}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: !currentlySaved }),
        signal: controller.signal,
      });
      if (res.ok) {
        setContracts((prev) =>
          prev.map((c) => (c.id === matchId ? { ...c, saved: !currentlySaved } : c))
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      setBookmarkUpdating((prev) => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  }, []);

  // ── Dismiss with undo ────────────────────────────────────────────────────
  function handleDismiss(c: ContractRow) {
    cs.dismiss(c.id);
    setUndoTitle(c.title);
    setUndoId(c.id);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(
      () => setUndoId(null),
      cs.UNDO_WINDOW_MS
    );
  }

  function handleUndo() {
    if (undoId) {
      cs.undoDismiss(undoId);
      setUndoId(null);
    }
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }

  // ── Export CSV ──────────────────────────────────────────────────────────
  async function handleExportCSV(days: number) {
    setExporting(true);
    setExportOpen(false);
    try {
      const res = await fetch(`/api/export/csv?days=${days}`);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plexovia-matches-${days}d-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
      setTimeout(() => setExportError(false), 5000);
    } finally {
      setExporting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="dash-main dash-fade-in">
      {/* Page header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Contract Matches</h1>
          <p className="dash-page-sub">
            {total > 0
              ? statusFilter !== "all"
                ? `${filteredContracts.length} of ${total.toLocaleString()} contracts`
                : `${total.toLocaleString()} contracts matched your profile`
              : "Contracts are matched twice daily — set up your profile to start"}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {contracts.length > 0 && (
            <div ref={exportRef} style={{ position: "relative" }}>
              <button
                className="dash-btn"
                onClick={() => setExportOpen((v) => !v)}
                disabled={exporting}
                aria-haspopup="listbox"
                aria-expanded={exportOpen}
                aria-label="Export contracts as CSV"
              >
                {exporting ? (
                  <RefreshCw size={13} className="dash-spin" aria-hidden="true" />
                ) : (
                  <Download size={13} aria-hidden="true" />
                )}
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
              {exportError && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--danger)",
                    marginLeft: "var(--space-2)",
                  }}
                >
                  Export failed
                </span>
              )}
              {exportOpen && (
                <div
                  className="dash-dropdown-menu"
                  role="listbox"
                  aria-label="Export date range"
                >
                  {EXPORT_DAY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      className="dash-dropdown-item"
                      role="option"
                      aria-selected={false}
                      onClick={() => handleExportCSV(d)}
                    >
                      <Calendar size={12} aria-hidden="true" /> Last {d} days
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            className="dash-btn"
            onClick={load}
            aria-label="Refresh contract matches"
            disabled={loading}
          >
            <RefreshCw
              size={13}
              aria-hidden="true"
              className={loading ? "dash-spin" : ""}
            />{" "}
            Refresh
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <SearchPanel onSearch={handleSearch} onClear={handleClearSearch} />

      {/* Status filter tabs — only relevant for matched feed */}
      {searchResults === null && (
      <div style={{ marginBottom: "var(--space-5)" }}>
        <div
          className="dash-status-tabs"
          role="tablist"
          aria-label="Contract status filter"
        >
          {(
            [
              { key: "all", label: "All" },
              { key: "new", label: "New" },
              { key: "bookmarked", label: "Saved" },
              { key: "dismissed", label: "Dismissed" },
            ] as { key: StatusFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              className="dash-status-tab"
              data-active={statusFilter === tab.key ? "true" : undefined}
              role="tab"
              aria-selected={statusFilter === tab.key}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
              {tab.key === "dismissed" && cs.totalDismissedCount() > 0 && (
                <span className="dash-tab-count">
                  {cs.totalDismissedCount()}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Stale data banner */}
      {staleData && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            marginBottom: "var(--space-3)",
            background: "var(--warning-subtle)",
            border: "1px solid var(--accent-border)",
            borderRadius: 10,
            fontSize: "0.8125rem",
            color: "var(--app-text)",
          }}
          role="alert"
        >
          <span style={{ flex: 1 }}>New contract matches are available.</span>
          <button
            onClick={() => {
              setStaleData(false);
              lastPipelineAtRef.current = null;
              load();
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.78rem",
            }}
          >
            Refresh
          </button>
        </div>
      )}

      {/* Contract list */}
      <div
        style={{
          background: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          marginBottom: "var(--space-5)",
        }}
      >
        {searchResults !== null ? (
          searchLoading ? (
            <SkeletonRows rows={6} />
          ) : searchError ? (
            <ErrorState
              message="Search failed. Please try again."
              onRetry={() => handleSearch({ search: searchQueryRef.current })}
            />
          ) : searchResults.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} />}
              title="No contracts found"
              message={`No contracts matching "${searchQueryRef.current}". Try different search terms.`}
            />
          ) : (
            <>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "var(--space-3) var(--space-6)", borderBottom: "1px solid var(--app-border)",
              }}>
                <span style={{ fontSize: "0.78rem", color: "var(--app-muted)" }}>
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} · last 90 days
                </span>
              </div>
              {searchResults.map((r, i) => (
                <SearchResultRow key={r.id} r={r} index={i} />
              ))}
            </>
          )
        ) : loading || !csReady ? (
          <SkeletonRows rows={6} />
        ) : error ? (
          <ErrorState
            message="Could not load your contract matches. The engine may be starting up."
            onRetry={load}
          />
        ) : filteredContracts.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={
              total === 0 && naicsCodes.length > 0
                ? "No active matches found"
                : statusFilter === "new" && contracts.length > 0
                ? "No new contracts"
                : statusFilter !== "all"
                ? `No ${statusFilter} contracts`
                : contracts.length === 0 && total > 0
                ? "No contracts to display"
                : "No matches yet"
            }
            message={
              total === 0 && naicsCodes.length > 0
                ? "Contracts are fetched from SAM.gov twice daily at 11:00 and 18:00 UTC. Check back after the next pipeline run."
                : statusFilter === "new" && contracts.length > 0
                ? "You've seen all new contracts. Check back after the next pipeline run (11:00 / 18:00 UTC)."
                : statusFilter === "all" && contracts.length > 0 && total > 0
                ? "All contracts on this page have been dismissed. Try other pages or the Dismissed tab."
                : statusFilter !== "all" && contracts.length > 0
                ? `No ${statusFilter} contracts. Try the All tab.`
                : statusFilter !== "all"
                ? "Try switching to the 'All' tab."
                : total === 0 && profileLoading.current
                ? "Loading your profile..."
                : total === 0
                ? "Add your NAICS codes and keywords in your Profile. Contracts are matched twice daily."
                : contracts.length === 0 && total > 0 && statusFilter === "all"
                ? "No contracts to display. Try refreshing or checking other tabs."
                : "Try adjusting your filters."
            }
          />
        ) : (
          <AnimatePresence initial={false}>
            {filteredContracts.map((c, i) => (
              <ContractRowUI
                key={c.id}
                c={c}
                index={i}
                isViewed={cs.isViewed(c.id)}
                bookmarkPending={bookmarkUpdating.has(c.id)}
                onToggleBookmark={() => handleToggleBookmark(c.id, c.saved)}
                onDismiss={() => handleDismiss(c)}
                onView={() => cs.markViewed(c.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination — only for the "all" tab (server-paginated) */}
      {!loading && !isFilterTab && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-3)",
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--app-muted)" }}>
            Page {page} of {totalPages} · {total.toLocaleString()} total matches
            {cs.totalDismissedCount() > 0 && (
              <>
                {" "}
                ·{" "}
                <span style={{ color: "var(--app-faint)" }}>
                  {cs.totalDismissedCount()} dismissed
                </span>
              </>
            )}
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button
              className="dash-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} aria-hidden="true" /> Prev
            </button>
            <button
              className="dash-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              Next <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Undo toast */}
      <AnimatePresence>
        {undoId && (
          <motion.div
            className="dash-undo-toast"
            role="alert"
            initial={{ opacity: 0, y: 12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 12, x: "-50%" }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          >
            <span>
              {undoTitle
                ? `"${undoTitle.slice(0, 40)}${undoTitle.length > 40 ? "…" : ""}" dismissed`
                : "Contract dismissed"}
            </span>
            <button onClick={handleUndo}>Undo</button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

/* ─── Search Result Row ────────────────────────────────────────────────── */
const SearchResultRow = memo(function SearchResultRow({
  r, index,
}: {
  r: SearchResult;
  index: number;
}) {
  const dl = fmtDeadline(r.deadline ?? null);
  return (
    <motion.div
      className="dash-contract-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.6) }}
    >
      {/* Score column — show if match_score is available */}
      <div className="dash-contract-card-left">
        {r.match_score != null ? (
          <MatchScoreBadge score={r.match_score} />
        ) : (
          <div style={{ width: 42 }} />
        )}
      </div>

      {/* Content */}
      <div className="dash-contract-card-center">
        <p className="dash-contract-card-title">{r.title}</p>
        <div className="dash-contract-card-tags">
          {r.naics_code && (
            <span className="dash-tag dash-tag-green">NAICS {r.naics_code}</span>
          )}
          {r.psc_code && (
            <span className="dash-tag dash-tag-blue">PSC {r.psc_code}</span>
          )}
          {r.fed_org_code && (
            <span
              className="dash-tag dash-tag-muted"
              title={`Federal Org: ${r.fed_org_code}`}
            >
              {r.fed_org_code}
            </span>
          )}
          {r.set_aside && r.set_aside !== "Full & Open" && (
            <span className="dash-tag dash-tag-amber">{r.set_aside}</span>
          )}
        </div>
        {r.value_min != null || r.value_max != null ? (
          <div style={{ fontSize: "0.7rem", color: "var(--app-muted)", marginTop: 4 }}>
            {fmtValue(r.value_min, r.value_max)}
          </div>
        ) : null}
      </div>

      {/* Desktop metadata */}
      <div className="dash-hide-mobile dash-contract-card-right">
        <div className="dash-contract-card-meta-item">{r.state || "Nationwide"}</div>
        <DeadlineBadge label={dl.label} urgency={dl.label === "Expired" ? "expired" : "normal"} />
        <div className="dash-contract-card-meta-faint">
          Posted {r.posted_date ? new Date(r.posted_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
        </div>
        {r.url && /^https?:\/\//i.test(r.url) && (
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="dash-contract-card-sam-link">
            View on SAM.gov <ExternalLink size={10} />
          </a>
        )}
      </div>
    </motion.div>
  );
});

/* ─── Row Component ─────────────────────────────────────────────────────── */
const ContractRowUI = memo(function ContractRowUI({
  c,
  isViewed,
  onToggleBookmark,
  onDismiss,
  onView,
  index,
  bookmarkPending,
}: {
  c: ContractRow;
  isViewed: boolean;
  onToggleBookmark: () => void;
  onDismiss: () => void;
  onView: () => void;
  index: number;
  bookmarkPending: boolean;
}) {
  const deadlineUrgency =
    c.deadlineDays === null
      ? "none"
      : c.deadlineDays <= 0
      ? "expired"
      : c.deadlineDays <= 3
      ? "critical"
      : c.deadlineDays <= 7
      ? "warning"
      : "normal";

  return (
    <motion.div
      className="dash-contract-card"
      onMouseEnter={onView}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: 50,
        transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] },
      }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.04, 0.6),
        ease: [0.25, 1, 0.5, 1],
      }}
    >
      {/* Score column */}
      <div className="dash-contract-card-left">
        {!isViewed && <span className="dash-viewed-dot" title="New" />}
        <MatchScoreBadge score={c.score} />
      </div>

      {/* Content column */}
      <div className="dash-contract-card-center">
        <p className="dash-contract-card-title">{c.title}</p>

        <div className="dash-contract-card-tags">
          {c.naics && (
            <span
              className="dash-tag dash-tag-green"
              title={`NAICS: ${c.naics}`}
            >
              NAICS {c.naics}
            </span>
          )}
          {c.psc && (
            <span className="dash-tag dash-tag-blue" title={`PSC: ${c.psc}`}>
              PSC {c.psc}
            </span>
          )}
          {c.fedOrg && (
            <span
              className="dash-tag dash-tag-muted"
              title={`Federal Org: ${c.fedOrg}`}
            >
              {c.fedOrg}
            </span>
          )}
          {c.setAside && c.setAside !== "Full & Open" && (
            <span
              className="dash-tag dash-tag-amber"
              title={`Set-Aside: ${c.setAside}`}
            >
              <Shield
                size={9}
                aria-hidden="true"
                style={{ marginRight: "var(--space-1)" }}
              />{" "}
              {c.setAside}
            </span>
          )}
        </div>
        {c.valueMin != null || c.valueMax != null ? (
          <div style={{ fontSize: "0.7rem", color: "var(--app-muted)", marginTop: 4 }}>
            {fmtValue(c.valueMin, c.valueMax)}
          </div>
        ) : null}

        <div className="dash-show-mobile dash-contract-card-mobile-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <MapPin size={11} />
            {c.state || "Nationwide"}
          </span>
          <span>Posted {c.posted}</span>
          <DeadlineBadge label={c.deadline} urgency={deadlineUrgency} />
        </div>
      </div>

      {/* Desktop metadata column */}
      <div className="dash-hide-mobile dash-contract-card-right">
        <div className="dash-contract-card-meta-item">
          <MapPin size={11} />
          {c.state || "Nationwide"}
        </div>
        <DeadlineBadge label={c.deadline} urgency={deadlineUrgency} />
        <div className="dash-contract-card-meta-faint">Posted {c.posted}</div>
        {c.url && /^https?:\/\//i.test(c.url) && (
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="dash-contract-card-sam-link"
          >
            View on SAM.gov <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Actions column */}
      <div className="dash-contract-card-actions">
        <motion.button
          className="dash-action-bookmark"
          data-active={c.saved ? "true" : undefined}
          onClick={onToggleBookmark}
          disabled={bookmarkPending}
          whileTap={{ scale: 0.85 }}
          aria-label={c.saved ? "Remove bookmark" : "Bookmark contract"}
          title={c.saved ? "Saved" : "Save"}
        >
          <Star size={16} fill={c.saved ? "currentColor" : "none"} />
        </motion.button>
        <button
          className="dash-action-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss contract"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
});

/* ─── Deadline Badge ────────────────────────────────────────────────────── */
function DeadlineBadge({ label, urgency }: { label: string; urgency: string }) {
  const bg =
    urgency === "expired"
      ? "var(--danger-subtle)"
      : urgency === "critical"
      ? "rgba(194,59,59,0.12)"
      : urgency === "warning"
      ? "var(--warning-subtle)"
      : "var(--app-surface-2)";
  const fg =
    urgency === "expired"
      ? "var(--danger)"
      : urgency === "critical"
      ? "var(--danger)"
      : urgency === "warning"
      ? "var(--warning)"
      : "var(--app-muted)";

  return (
    <span
      className="dash-deadline-badge"
      style={{ background: bg, color: fg }}
    >
      <Clock size={11} />
      {label}
    </span>
  );
}
