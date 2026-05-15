"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search, LayoutDashboard, FileText, User,
  Brain, CreditCard, HelpCircle, LogOut,
  Clock,
} from "lucide-react";

/* ─── Navigation Items ─────────────────────────────────────────── */
const PAGES = [
  { href: "/dashboard",           label: "Overview",     icon: LayoutDashboard, group: "Pages" },
  { href: "/dashboard/contracts", label: "Contracts",    icon: FileText,        group: "Pages" },
  { href: "/dashboard/forecasts", label: "AI Forecasts", icon: Brain,           group: "Pages" },
  { href: "/dashboard/profile",   label: "Profile",      icon: User,            group: "Pages" },
  { href: "/dashboard/billing",   label: "Billing",      icon: CreditCard,      group: "Pages" },
] as const;

const ACTIONS = [
  { id: "support", label: "Contact Support", icon: HelpCircle, group: "Actions" },
  { id: "signout", label: "Sign Out",        icon: LogOut,      group: "Actions" },
] as const;

/* ─── Recent Pages (localStorage) ──────────────────────────────── */
const RECENT_KEY = "plexovia-recent-pages";
const MAX_RECENT = 3;

function getRecentPages(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function recordPageVisit(href: string) {
  try {
    const recent = getRecentPages().filter(h => h !== href);
    recent.unshift(href);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    /* localStorage unavailable — silent degrade */
  }
}

/* ─── Component ────────────────────────────────────────────────── */
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (id: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onAction }: CommandPaletteProps) {
  const router    = useRouter();
  const pathname  = usePathname();
  const inputRef  = useRef<HTMLInputElement>(null);
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(0);

  /* Build filtered results */
  const recentHrefs = getRecentPages().filter(h => h !== pathname);
  const recentItems = recentHrefs
    .map(href => PAGES.find(p => p.href === href))
    .filter(Boolean) as typeof PAGES[number][];

  const q = query.toLowerCase().trim();
  const filteredPages   = q ? PAGES.filter(p => p.label.toLowerCase().includes(q)) : PAGES;
  const filteredActions = q ? ACTIONS.filter(a => a.label.toLowerCase().includes(q)) : ACTIONS;

  /* Build flat list for keyboard nav */
  type Item = { type: "page"; href: string; label: string; icon: typeof LayoutDashboard }
            | { type: "action"; id: string; label: string; icon: typeof HelpCircle };

  const items: Item[] = [];
  if (!q && recentItems.length > 0) {
    recentItems.forEach(p => items.push({ type: "page", href: p.href, label: p.label, icon: p.icon }));
  }
  filteredPages.forEach(p => items.push({ type: "page", href: p.href, label: p.label, icon: p.icon }));
  filteredActions.forEach(a => items.push({ type: "action", id: a.id, label: a.label, icon: a.icon }));

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* Clamp selection when results change */
  useEffect(() => {
    setSelected(s => Math.min(s, Math.max(0, items.length - 1)));
  }, [items.length]);

  /* Keyboard handler */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(s => (s + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(s => (s - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && items[selected]) {
      e.preventDefault();
      executeItem(items[selected]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [items, selected, onClose]);

  function executeItem(item: Item) {
    if (item.type === "page") {
      recordPageVisit(item.href);
      router.push(item.href);
    } else {
      onAction(item.id);
    }
    onClose();
  }

  if (!isOpen) return null;

  /* Track group boundaries for labels */
  let currentGroup = "";

  return (
    <div className="dash-cmd-overlay" onClick={onClose} role="dialog" aria-label="Command palette" aria-modal="true">
      <div className="dash-cmd-panel" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Search input */}
        <div className="dash-cmd-input-wrap">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            className="dash-cmd-input"
            placeholder="Search pages, actions..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            aria-label="Search commands"
            autoComplete="off"
          />
        </div>

        {/* Results */}
        <div className="dash-cmd-results" role="listbox">
          {items.length === 0 ? (
            <div className="dash-cmd-empty">No results for &ldquo;{query}&rdquo;</div>
          ) : (
            items.map((item, i) => {
              let groupLabel: string | null = null;

              if (!q && recentItems.length > 0 && i === 0) {
                groupLabel = "Recent";
                currentGroup = "Recent";
              } else if (!q && i === recentItems.length) {
                groupLabel = "Pages";
                currentGroup = "Pages";
              } else if (item.type === "action" && currentGroup !== "Actions") {
                groupLabel = "Actions";
                currentGroup = "Actions";
              } else if (q && item.type === "page" && currentGroup !== "Pages") {
                groupLabel = "Pages";
                currentGroup = "Pages";
              }

              const Icon = item.icon;
              return (
                <div key={`${item.type}-${item.type === "page" ? item.href : item.id}`}>
                  {groupLabel && <div className="dash-cmd-group-label">{groupLabel}</div>}
                  <button
                    className="dash-cmd-item"
                    data-selected={i === selected ? "true" : undefined}
                    onClick={() => executeItem(item)}
                    role="option"
                    aria-selected={i === selected}
                    onMouseEnter={() => setSelected(i)}
                  >
                    {groupLabel === "Recent" || (!q && i < recentItems.length) ? (
                      <Clock size={15} aria-hidden="true" />
                    ) : (
                      <Icon size={15} aria-hidden="true" />
                    )}
                    {item.label}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="dash-cmd-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
