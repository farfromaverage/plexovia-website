"use client";

/**
 * useContractStatus — FIX HISTORY:
 *
 * BUG 3 (localStorage reads wrong key on first render):
 *   The previous version used a module-level `let STORAGE_KEY` that was
 *   mutated by init(). Because useState(loadMap) runs synchronously on the
 *   FIRST render — before the async getSession() + init() call completes —
 *   the hook read from the default unscoped key "plexovia-contract-status"
 *   on every cold load. Bookmarks and dismissals appeared invisible until the
 *   next render cycle, causing:
 *     - "New" count badge to show already-viewed contracts as new
 *     - Dismissed contracts to reappear on first render, then vanish
 *     - Bookmark state to flash off then on
 *
 *   ROOT CAUSE: Async init() raced with synchronous useState initializer.
 *
 *   FIX: The module-level `let` is replaced with a React ref (`keyRef`) that
 *   lives inside the hook instance. `useState` is initialized with an empty
 *   map — no data is read until `init(userId)` is explicitly called. The
 *   contracts page sets `csReady = true` only after init() resolves, and
 *   renders skeletons until then. This removes the race entirely.
 *
 *   The cross-tab StorageEvent listener now uses keyRef so it always
 *   listens to the correct user-scoped key after init().
 */

import { useState, useCallback, useEffect, useRef } from "react";

/* ─── Types ──────────────────────────────────────────────────────────── */
export type ContractAction = "bookmarked" | "dismissed" | "viewed";

interface ContractStatusEntry {
  bookmarked?: boolean;
  dismissed?: boolean;
  viewed?: boolean;
  dismissedAt?: number;
}

interface ContractStatusMap {
  [contractId: string]: ContractStatusEntry;
}

interface VersionedMap {
  map: ContractStatusMap;
  version: number;
}

const UNDO_WINDOW_MS = 8000;
const MAX_ENTRIES = 500;
const DEFAULT_KEY = "plexovia-contract-status";

/* ─── Storage helpers ────────────────────────────────────────────────── */
function loadMap(key: string): ContractStatusMap {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const { _v, ...map } = parsed;
    return map as ContractStatusMap;
  } catch {
    return {};
  }
}

function loadVersioned(key: string): VersionedMap {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { map: {}, version: 0 };
    const parsed = JSON.parse(raw);
    const version = typeof parsed._v === "number" ? parsed._v : 0;
    const { _v, ...map } = parsed;
    return { map: map as ContractStatusMap, version };
  } catch {
    return { map: {}, version: 0 };
  }
}

function saveMap(key: string, map: ContractStatusMap): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(map));
    return true;
  } catch {
    console.warn("[useContractStatus] localStorage write failed (quota exceeded?)");
    return false;
  }
}

function evictOverflow(map: ContractStatusMap): ContractStatusMap {
  const entries = Object.entries(map);
  if (entries.length <= MAX_ENTRIES) return map;

  const excess = entries.length - MAX_ENTRIES;
  let removed = 0;
  const result: ContractStatusMap = {};

  for (const [id, data] of entries) {
    // Evict non-bookmarked entries first (oldest by insertion order)
    if (removed < excess && !data.bookmarked) {
      removed++;
      continue;
    }
    result[id] = data;
  }

  return result;
}

/* ─── Hook ───────────────────────────────────────────────────────────── */
export function useContractStatus() {
  // FIX: Start with an empty map. Data is loaded only after init() provides
  // a userId, eliminating the race between useState initializer and async
  // getSession(). The keyRef is scoped per hook instance (no module-level mut).
  const [statusMap, setStatusMap] = useState<ContractStatusMap>({});
  const keyRef = useRef<string>(DEFAULT_KEY);
  const versionRef = useRef(0);

  // Cross-tab sync: re-read when another tab writes to the same key
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === keyRef.current) {
        setStatusMap(loadMap(keyRef.current));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /**
   * Call once with the authenticated user's ID before any read/write.
   * Safe to call multiple times with the same userId (idempotent).
   */
  const init = useCallback((userId: string) => {
    const key = `plexovia-contract-status-${userId}`;
    if (keyRef.current === key) return; // already initialized for this user
    keyRef.current = key;
    const { map, version } = loadVersioned(key);
    setStatusMap(map);
    versionRef.current = version;
  }, []);

  const persist = useCallback((next: ContractStatusMap): boolean => {
    const trimmed = evictOverflow(next);
    const { map: stored, version: storedVersion } = loadVersioned(keyRef.current);

    let finalMap: ContractStatusMap;
    if (storedVersion !== versionRef.current && storedVersion > 0) {
      finalMap = { ...stored };
      for (const [id, entry] of Object.entries(trimmed)) {
        const s = stored[id];
        if (!s) { finalMap[id] = entry; continue; }
        if (entry.bookmarked) { finalMap[id] = { ...s, ...entry, bookmarked: true }; continue; }
        if (s.bookmarked) { continue; }
        if (entry.dismissed && s.dismissed) {
          if ((entry.dismissedAt ?? 0) > (s.dismissedAt ?? 0)) { finalMap[id] = entry; }
          continue;
        }
        finalMap[id] = entry;
      }
    } else {
      finalMap = trimmed;
    }

    const newVersion = storedVersion + 1;
    versionRef.current = newVersion;

    try {
      localStorage.setItem(keyRef.current, JSON.stringify({ ...finalMap, _v: newVersion }));
      setStatusMap(finalMap);
      return true;
    } catch {
      console.warn("[useContractStatus] localStorage write failed (quota exceeded?)");
      return false;
    }
  }, []);

  /** Toggle bookmark on a contract */
  const toggleBookmark = useCallback(
    (id: string) => {
      const map = loadMap(keyRef.current);
      const entry = map[id] || {};
      entry.bookmarked = !entry.bookmarked;
      if (entry.bookmarked) {
        entry.dismissed = false;
        delete entry.dismissedAt;
      }
      map[id] = entry;
      persist(map);
    },
    [persist]
  );

  /** Dismiss a contract (returns the id for undo toast) */
  const dismiss = useCallback(
    (id: string): string => {
      const map = loadMap(keyRef.current);
      const entry = map[id] || {};
      entry.dismissed = true;
      entry.dismissedAt = Date.now();
      entry.bookmarked = false;
      map[id] = entry;
      persist(map);
      return id;
    },
    [persist]
  );

  /** Undo dismiss (within undo window) */
  const undoDismiss = useCallback(
    (id: string) => {
      const map = loadMap(keyRef.current);
      const entry = map[id];
      if (!entry) return;
      entry.dismissed = false;
      delete entry.dismissedAt;
      map[id] = entry;
      persist(map);
    },
    [persist]
  );

  /** Mark a contract as viewed */
  const markViewed = useCallback(
    (id: string) => {
      const map = loadMap(keyRef.current);
      const entry = map[id] || {};
      if (entry.viewed) return;
      entry.viewed = true;
      map[id] = entry;
      persist(map);
    },
    [persist]
  );

  const isBookmarked = useCallback(
    (id: string): boolean => statusMap[id]?.bookmarked === true,
    [statusMap]
  );

  const isDismissed = useCallback(
    (id: string): boolean => statusMap[id]?.dismissed === true,
    [statusMap]
  );

  const isViewed = useCallback(
    (id: string): boolean => statusMap[id]?.viewed === true,
    [statusMap]
  );

  const bookmarkedCount = useCallback(
    (ids: string[]): number =>
      ids.filter((id) => statusMap[id]?.bookmarked).length,
    [statusMap]
  );

  const dismissedCount = useCallback(
    (ids: string[]): number =>
      ids.filter((id) => statusMap[id]?.dismissed).length,
    [statusMap]
  );

  const totalBookmarkedCount = useCallback(
    (): number => Object.values(statusMap).filter((e) => e?.bookmarked).length,
    [statusMap]
  );

  const totalDismissedCount = useCallback(
    (): number => Object.values(statusMap).filter((e) => e?.dismissed).length,
    [statusMap]
  );

  return {
    init,
    toggleBookmark,
    dismiss,
    undoDismiss,
    markViewed,
    isBookmarked,
    isDismissed,
    isViewed,
    bookmarkedCount,
    dismissedCount,
    totalBookmarkedCount,
    totalDismissedCount,
    UNDO_WINDOW_MS,
  };
}
