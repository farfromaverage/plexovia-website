"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export interface SearchFilters {
  search: string;
}

interface Props {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
}

const DEBOUNCE_MS = 300;

export default function SearchPanel({ onSearch, onClear }: Props) {
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      onClear();
      return;
    }

    timerRef.current = setTimeout(() => {
      onSearch({ search: query.trim() });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, onSearch, onClear]);

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "1px solid var(--app-border)",
          borderRadius: 8,
          padding: "0 10px",
          background: "var(--app-surface)",
          maxWidth: 480,
        }}
      >
        <Search size={14} style={{ color: "var(--app-faint)", flexShrink: 0 }} aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, description, NAICS, PSC, agency, agency code, state, or set-aside..."
          aria-label="Search contracts"
          style={{
            flex: 1,
            padding: "8px 0",
            border: "none",
            outline: "none",
            fontSize: "0.85rem",
            color: "var(--app-text)",
            background: "transparent",
            fontFamily: "inherit",
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            style={{
              padding: 2,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--app-faint)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
