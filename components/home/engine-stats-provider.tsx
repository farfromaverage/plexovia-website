"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface EngineStats {
  totalContracts: number;
  federalSources: number;
  contractsByState: Record<string, number>;
  lastRunAt: string | null;
  loading: boolean;
  error: string | null;
}

const EngineStatsContext = createContext<EngineStats | null>(null);

const FALLBACK: EngineStats = {
  totalContracts: 15847,
  federalSources: 3,
  contractsByState: {},
  lastRunAt: null,
  loading: true,
  error: null,
};

export function EngineStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<EngineStats>(FALLBACK);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/engine-stats?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();

      setStats({
        totalContracts: data.total_contracts > 0 ? data.total_contracts : 15847,
        federalSources: data.federal_sources > 0 ? data.federal_sources : 3,
        contractsByState: data.contracts_by_state || {},
        lastRunAt: data.last_run_at || null,
        loading: false,
        error: null,
      });
    } catch {
      setStats((prev) => ({ ...prev, loading: false, error: 'Failed to load stats' }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <EngineStatsContext.Provider value={stats}>
      {children}
    </EngineStatsContext.Provider>
  );
}

export function useEngineStats() {
  const ctx = useContext(EngineStatsContext);
  if (!ctx) throw new Error("useEngineStats must be used within EngineStatsProvider");
  return ctx;
}
