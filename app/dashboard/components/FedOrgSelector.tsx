"use client";

import { useState } from "react";
import { Search, CheckCircle } from "lucide-react";

export interface FedOrg {
  code: string;
  name: string;
  cgac?: string;
  aliases?: string[];
  parent?: string;
  type?: string;
}

interface Props {
  selected: string[];
  onToggle: (code: string) => void;
  orgList: FedOrg[];
}

export default function FedOrgSelector({ selected, onToggle, orgList }: Props) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const filtered = trimmed
    ? orgList
        .filter((o) => {
          const q = trimmed.toLowerCase();
          if (o.code.toLowerCase().includes(q)) return true;
          if (o.name.toLowerCase().includes(q)) return true;
          if (o.cgac && o.cgac.toLowerCase().includes(q)) return true;
          if (o.parent && o.parent.toLowerCase().includes(q)) return true;
          if (o.aliases?.some((a) => a.toLowerCase() === q)) return true;
          return false;
        })
        .slice(0, 12)
    : [];

  return (
    <div>
      <div style={{ position: "relative", marginBottom: "var(--space-3)", maxWidth: 480 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--app-faint)", pointerEvents: "none" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code, name, or acronym (e.g. DOD, GSA, defense)"
          className="dash-input-lg"
          style={{ paddingLeft: 34 }}
          aria-label="Search federal organizations"
        />
      </div>
      {trimmed && filtered.length === 0 && (
        <p style={{ fontSize: "0.8125rem", color: "var(--app-faint)", marginBottom: "var(--space-3)" }}>No matching agencies found.</p>
      )}
      {filtered.length > 0 && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          {filtered.map((o) => {
            const isSelected = selected.includes(o.code);
            return (
              <button
                key={o.code}
                type="button"
                onClick={() => onToggle(o.code)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", maxWidth: 480, padding: "10px var(--space-4)",
                  borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "left",
                  marginBottom: 2, gap: "var(--space-2)",
                  borderBottom: isSelected ? "none" : "1px solid var(--app-border)",
                  background: isSelected ? "var(--accent-subtle)" : "transparent",
                  border: "none",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "0.8125rem", fontWeight: isSelected ? 600 : 400, color: isSelected ? "var(--accent)" : "var(--app-text)" }}>{o.code}</span>
                  <span style={{ fontSize: "0.75rem", color: isSelected ? "var(--accent)" : "var(--app-muted)", marginLeft: 8 }}>{o.name}</span>
                  {o.parent && o.type !== "Department/Ind-agency" && (
                    <span style={{ fontSize: "0.68rem", color: "var(--app-faint)", marginLeft: 6 }}>
                      ({o.parent})
                    </span>
                  )}
                </div>
                {isSelected && <CheckCircle size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
