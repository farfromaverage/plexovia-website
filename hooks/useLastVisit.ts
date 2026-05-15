"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "plexovia-last-visit";

/**
 * Tracks last visit timestamp and counts items newer than last visit.
 *
 * On mount: reads localStorage → compares against provided dates → returns count.
 * On unmount/blur: writes current timestamp to localStorage.
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const lastDate = stored ? new Date(stored) : null;
      setLastVisit(lastDate);

      if (!lastDate) {
        // First visit — all items are "new"
        setNewCount(dates.filter(Boolean).length);
      } else {
        const lastTs = lastDate.getTime();
        const count = dates.filter(d => {
          if (!d) return false;
          return new Date(d).getTime() > lastTs;
        }).length;
        setNewCount(count);
      }
    } catch {
      // localStorage unavailable — silent degrade
      setNewCount(0);
    }

    // Write current timestamp on unmount or page blur
    function saveTimestamp() {
      try {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      } catch {
        /* Storage full or unavailable */
      }
    }

    window.addEventListener("blur", saveTimestamp);

    return () => {
      saveTimestamp();
      window.removeEventListener("blur", saveTimestamp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // dates intentionally not in deps — we only compute on mount

  return { lastVisit, newCount };
}
