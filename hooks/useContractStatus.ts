"use client";

import { useState, useCallback } from "react";

/* ─── Types ────────────────────────────────────────────────────────── */
export type ContractAction = "bookmarked" | "dismissed" | "viewed";

interface ContractStatusMap {
  [contractId: string]: {
    bookmarked?: boolean;
    dismissed?: boolean;
    viewed?: boolean;
    dismissedAt?: number; // unix ms for undo window
  };
}

const STORAGE_KEY = "plexovia-contract-status";
const UNDO_WINDOW_MS = 8000; // 8 second undo window

/* ─── Storage helpers ──────────────────────────────────────────────── */
function loadMap(): ContractStatusMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMap(map: ContractStatusMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* Storage full or unavailable — silent degrade */
  }
}

/* ─── Hook ─────────────────────────────────────────────────────────── */
export function useContractStatus() {
  const [statusMap, setStatusMap] = useState<ContractStatusMap>(loadMap);

  const persist = useCallback((next: ContractStatusMap) => {
    setStatusMap(next);
    saveMap(next);
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

  return {
    toggleBookmark,
    dismiss,
    undoDismiss,
    markViewed,
    isBookmarked,
    isDismissed,
    isViewed,
    bookmarkedCount,
    dismissedCount,
    UNDO_WINDOW_MS,
  };
}
