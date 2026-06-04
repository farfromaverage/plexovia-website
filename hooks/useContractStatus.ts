"use client";

import { useState, useCallback, useEffect, useRef } from "react";

/* ─── Types ────────────────────────────────────────────────────────── */
export type ContractAction = "bookmarked" | "dismissed" | "viewed";

interface ContractStatusMap {
  [contractId: string]: {
    bookmarked?: boolean;
    dismissed?: boolean;
    viewed?: boolean;
    dismissedAt?: number;
  };
}

const UNDO_WINDOW_MS = 8000;
const MAX_ENTRIES = 500;

let STORAGE_KEY = "plexovia-contract-status";

/* ─── Storage helpers ──────────────────────────────────────────────── */
function loadMap(): ContractStatusMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMap(map: ContractStatusMap): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return true;
  } catch {
    console.warn("useContractStatus: localStorage write failed (quota exceeded?)");
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
    if (removed < excess && !data.bookmarked) {
      removed++;
      continue;
    }
    result[id] = data;
  }

  return result;
}

/* ─── Hook ─────────────────────────────────────────────────────────── */
export function useContractStatus() {
  const [statusMap, setStatusMap] = useState<ContractStatusMap>(loadMap);
  const keyRef = useRef(STORAGE_KEY);

  /* Cross-tab sync: re-read when another tab writes */
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === keyRef.current) {
        setStatusMap(loadMap());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /** Switch to a user-scoped storage key (call before other operations) */
  const init = useCallback((userId: string) => {
    STORAGE_KEY = `plexovia-contract-status-${userId}`;
    keyRef.current = STORAGE_KEY;
    setStatusMap(loadMap());
  }, []);

  const persist = useCallback((next: ContractStatusMap): boolean => {
    const trimmed = evictOverflow(next);
    setStatusMap(trimmed);
    return saveMap(trimmed);
  }, []);

  /** Toggle bookmark on a contract */
  const toggleBookmark = useCallback((id: string) => {
    const map = loadMap();
    const entry = map[id] || {};
    entry.bookmarked = !entry.bookmarked;
    // Un-dismiss if bookmarking
    if (entry.bookmarked) {
      entry.dismissed = false;
      delete entry.dismissedAt;
    }
    map[id] = entry;
    persist(map);
  }, [persist]);

  /** Dismiss a contract (returns the id for undo toast) */
  const dismiss = useCallback((id: string): string => {
    const map = loadMap();
    const entry = map[id] || {};
    entry.dismissed = true;
    entry.dismissedAt = Date.now();
    entry.bookmarked = false; // can't be both
    map[id] = entry;
    persist(map);
    return id;
  }, [persist]);

  /** Undo dismiss (within undo window) */
  const undoDismiss = useCallback((id: string) => {
    const map = loadMap();
    const entry = map[id];
    if (!entry) return;
    entry.dismissed = false;
    delete entry.dismissedAt;
    map[id] = entry;
    persist(map);
  }, [persist]);

  /** Mark a contract as viewed */
  const markViewed = useCallback((id: string) => {
    const map = loadMap();
    const entry = map[id] || {};
    if (entry.viewed) return; // already viewed
    entry.viewed = true;
    map[id] = entry;
    persist(map);
  }, [persist]);

  /** Check if contract is bookmarked */
  const isBookmarked = useCallback((id: string): boolean => {
    return statusMap[id]?.bookmarked === true;
  }, [statusMap]);

  /** Check if contract is dismissed */
  const isDismissed = useCallback((id: string): boolean => {
    return statusMap[id]?.dismissed === true;
  }, [statusMap]);

  /** Check if contract has been viewed */
  const isViewed = useCallback((id: string): boolean => {
    return statusMap[id]?.viewed === true;
  }, [statusMap]);

  /** Get count of bookmarked contracts from a list of IDs */
  const bookmarkedCount = useCallback((ids: string[]): number => {
    return ids.filter(id => statusMap[id]?.bookmarked).length;
  }, [statusMap]);

  /** Get count of dismissed contracts from a list of IDs */
  const dismissedCount = useCallback((ids: string[]): number => {
    return ids.filter(id => statusMap[id]?.dismissed).length;
  }, [statusMap]);

  /** Get total bookmarked count across ALL contracts in localStorage */
  const totalBookmarkedCount = useCallback((): number => {
    return Object.values(statusMap).filter(e => e?.bookmarked).length;
  }, [statusMap]);

  /** Get total dismissed count across ALL contracts in localStorage */
  const totalDismissedCount = useCallback((): number => {
    return Object.values(statusMap).filter(e => e?.dismissed).length;
  }, [statusMap]);

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
