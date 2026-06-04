"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "plexovia-last-visit";

function computeNewCount(dates: (string | null)[], lastVisit: Date | null): number {
  if (!lastVisit) return dates.filter(Boolean).length;
  const lastTs = lastVisit.getTime();
  return dates.filter(d => {
    if (!d) return false;
    return new Date(d).getTime() > lastTs;
  }).length;
}

/**
 * Tracks last visit timestamp and counts items newer than last visit.
 *
 * On mount: reads localStorage → compares against provided dates → returns count.
 * When dates change (e.g. matches load asynchronously): recomputes count without
 * re-saving the timestamp.
 * On pagehide (navigation/tab-close): writes current timestamp to localStorage.
 * Uses visibilitychange + pagehide instead of blur to avoid accidental timestamp
 * resets from alt-tabbing or clicking outside the window.
 *
 * Edge cases:
 * - First visit ever: lastVisit = null, newCount = total (all are "new")
 * - localStorage cleared: same as first visit
 * - No dates provided: newCount = 0 regardless
 * - localStorage unavailable (private browsing): graceful silent degrade
 */
export function useLastVisit(dates: (string | null)[]): {
  lastVisit: Date | null;
  newCount: number;
} {
  const [lastVisit, setLastVisit] = useState<Date | null>(null);
  const [newCount, setNewCount]   = useState(0);

  // Read lastVisit from localStorage on mount, recompute newCount when dates change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const lastDate = stored ? new Date(stored) : null;
      setLastVisit(lastDate);
      setNewCount(computeNewCount(dates, lastDate));
    } catch {
      setNewCount(0);
    }
  }, [dates]);

  // Save timestamp on pagehide (navigation away) — not on blur (alt-tab etc.)
  useEffect(() => {
    function saveTimestamp() {
      try {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      } catch {
        /* Storage full or unavailable */
      }
    }

    // pagehide fires on tab close / navigation away across all browsers
    window.addEventListener("pagehide", saveTimestamp);

    return () => {
      window.removeEventListener("pagehide", saveTimestamp);
    };
  }, []);

  return { lastVisit, newCount };
}
