"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight, ArrowLeft, Check, X, Loader2,
  Search, Plus, Tag, MapPin, FileText,
} from "lucide-react";

/* ─── NAICS list (discovery / lookup only) ────────────────────────── */
const NAICS_LIST: { code: string; desc: string }[] = [
  { code: "541511", desc: "Custom Computer Programming Services" },
  { code: "541512", desc: "Computer Systems Design Services" },
  { code: "541513", desc: "Computer Facilities Management Services" },
  { code: "541519", desc: "Other Computer Related Services" },
  { code: "541330", desc: "Engineering Services" },
  { code: "541611", desc: "Administrative Management Consulting" },
  { code: "541614", desc: "Process‚ Physical Distribution & Logistics Consulting" },
  { code: "541620", desc: "Environmental Consulting Services" },
  { code: "541690", desc: "Other Scientific & Technical Consulting" },
  { code: "541715", desc: "R&D in Physical, Engineering & Life Sciences" },
  { code: "541720", desc: "R&D in Social Sciences & Humanities" },
  { code: "236220", desc: "Commercial & Institutional Building Construction" },
  { code: "237310", desc: "Highway, Street & Bridge Construction" },
  { code: "238210", desc: "Electrical Contractors" },
  { code: "238220", desc: "Plumbing, Heating & AC Contractors" },
  { code: "561110", desc: "Office Administrative Services" },
  { code: "561210", desc: "Facilities Support Services" },
  { code: "561320", desc: "Temporary Staffing Services" },
  { code: "561499", desc: "All Other Business Support Services" },
  { code: "561730", desc: "Landscaping Services" },
  { code: "561740", desc: "Carpet & Upholstery Cleaning" },
  { code: "561990", desc: "All Other Support Services" },
  { code: "336411", desc: "Aircraft Manufacturing" },
  { code: "336992", desc: "Military Armored Vehicle Manufacturing" },
  { code: "332710", desc: "Machine Shops" },
  { code: "333249", desc: "Other Industrial Machinery Manufacturing" },
  { code: "334111", desc: "Electronic Computer Manufacturing" },
  { code: "334511", desc: "Search & Navigation Equipment Manufacturing" },
  { code: "517110", desc: "Wired Telecommunications Carriers" },
  { code: "517311", desc: "Telephone Apparatus Manufacturing" },
  { code: "518210", desc: "Data Processing & Hosting Services" },
  { code: "519190", desc: "All Other Information Services" },
  { code: "522390", desc: "Other Activities Related to Credit Intermediation" },
  { code: "524114", desc: "Direct Health & Medical Insurance Carriers" },
  { code: "541214", desc: "Payroll Services" },
  { code: "541380", desc: "Testing Laboratories" },
  { code: "541490", desc: "Other Specialized Design Services" },
  { code: "541711", desc: "R&D in Biotechnology" },
  { code: "562910", desc: "Remediation Services" },
  { code: "611430", desc: "Professional & Management Development Training" },
  { code: "621111", desc: "Offices of Physicians" },
  { code: "622110", desc: "General Medical & Surgical Hospitals" },
  { code: "722310", desc: "Food Service Contractors" },
  { code: "811212", desc: "Computer & Office Machine Repair" },
  { code: "923120", desc: "Administration of Public Health Programs" },
  { code: "928110", desc: "National Security" },
  { code: "928120", desc: "International Affairs" },
  { code: "488190", desc: "Other Support Activities for Air Transportation" },
  { code: "493110", desc: "General Warehousing & Storage" },
];

const NAICS_MAP = new Map(NAICS_LIST.map((n) => [n.code, n.desc]));

const REGIONS: Record<string, string[]> = {
  "Northeast":     ["CT","MA","ME","NH","NJ","NY","PA","RI","VT"],
  "Mid-Atlantic":  ["DC","DE","MD","VA","WV"],
  "Southeast":     ["AL","AR","FL","GA","KY","LA","MS","NC","SC","TN"],
  "Midwest":       ["IA","IL","IN","KS","MI","MN","MO","ND","NE","OH","SD","WI"],
  "South Central": ["OK","TX","NM","AZ"],
  "Mountain":      ["CO","ID","MT","NV","UT","WY"],
  "Pacific":       ["AK","CA","HI","OR","WA"],
};

/* ─── Shared styles ───────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh", background: "#1C1917",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative" as const, fontFamily: "var(--font-inter), sans-serif",
    padding: "5rem 1.25rem 2rem",
  } as React.CSSProperties,
  card: {
    width: "100%", maxWidth: "560px",
    background: "#252320", border: "1px solid #2D2A26",
    borderRadius: "18px", padding: "2.25rem",
  } as React.CSSProperties,
  h2: {
    fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.03em",
    color: "#F7F5F0", margin: "0 0 0.4rem",
  } as React.CSSProperties,
  sub: {
    fontSize: "0.875rem", color: "#6B6560",
    margin: "0 0 1.375rem", lineHeight: 1.55,
  } as React.CSSProperties,
  lbl: {
    display: "block", fontSize: "0.8125rem", fontWeight: 500,
    color: "#A8A29E", marginBottom: "5px",
  } as React.CSSProperties,
  inp: {
    width: "100%", padding: "10px 14px",
    background: "#2A2724", border: "1px solid #3D3830",
    borderRadius: "9px", color: "#F7F5F0",
    fontSize: "0.9rem", outline: "none",
    transition: "border-color 0.15s", boxSizing: "border-box" as const,
    fontFamily: "var(--font-inter), sans-serif",
  } as React.CSSProperties,
  next: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
    padding: "12px 20px", background: "#C9A84C", color: "#1C1917",
    border: "none", borderRadius: "10px",
    fontFamily: "var(--font-inter), sans-serif", fontWeight: 700,
    fontSize: "0.9375rem", letterSpacing: "-0.01em",
    cursor: "pointer", transition: "background 0.15s",
  } as React.CSSProperties,
  back: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    padding: "12px 16px", background: "#2A2724",
    border: "1px solid #3D3830", borderRadius: "10px",
    color: "#A8A29E", fontSize: "0.9rem",
    fontFamily: "var(--font-inter), sans-serif",
    cursor: "pointer", transition: "border-color 0.15s",
  } as React.CSSProperties,
};

/* ─── Progress bar ────────────────────────────────────────────────── */
function StepBar({ current, total }: { current: number; total: number }) {
  const labels = ["NAICS Codes", "States", "Keywords and set-asides"];
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "#6B6560" }}>Step {current} of {total}</span>
        <span style={{ fontSize: "0.8125rem", color: "#C9A84C", fontWeight: 600 }}>{labels[current - 1]}</span>
      </div>
      <div style={{ height: "4px", background: "#2D2A26", borderRadius: "9999px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(current / total) * 100}%`, background: "#C9A84C", borderRadius: "9999px", transition: "width 0.35s ease" }} />
      </div>
    </div>
  );
}

/* ─── Step 1: NAICS picker with custom-code support ──────────────── */
function Step1({ selected, setSelected, naicsLimit }: { selected: string[]; setSelected: (v: string[]) => void; naicsLimit: number }) {
  const [query, setQuery] = useState("");
  const LIMIT = naicsLimit;

  const trimmed = query.trim();
  const isCustom6 = /^\d{6}$/.test(trimmed) && !NAICS_MAP.has(trimmed);
  const canAddCustom = isCustom6 && !selected.includes(trimmed) && selected.length < LIMIT;

  const filtered = NAICS_LIST.filter(
    (n) => n.code.startsWith(trimmed) || n.desc.toLowerCase().includes(trimmed.toLowerCase())
  ).slice(0, 10);

  function toggle(code: string) {
    if (selected.includes(code)) {
      setSelected(selected.filter((c) => c !== code));
    } else if (selected.length < LIMIT) {
      setSelected([...selected, code]);
    }
  }

  function addCustom() {
    if (canAddCustom) {
      setSelected([...selected, trimmed]);
      setQuery("");
    }
  }

  return (
    <div>
      <h2 style={S.h2}>Which NAICS codes does your firm hold?</h2>
      <p style={S.sub}>
        Select from the list or type any 6-digit NAICS code directly.
        You can add up to {LIMIT === 999 ? "unlimited" : LIMIT} codes.
        These are the codes your company is registered under at SAM.gov.
      </p>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "0.875rem" }}>
          {selected.map((code) => (
            <span key={code} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "#C9A84C18", border: "1px solid #C9A84C50", borderRadius: "9999px", fontSize: "0.78125rem", color: "#C9A84C", fontFamily: "var(--font-geist-mono, monospace)" }}>
              {code}
              {NAICS_MAP.get(code) && (
                <span style={{ fontSize: "0.7rem", color: "#A8865A", fontFamily: "var(--font-inter), sans-serif" }}>
                  {NAICS_MAP.get(code)!.substring(0, 22)}{NAICS_MAP.get(code)!.length > 22 ? "…" : ""}
                </span>
              )}
              <button type="button" onClick={() => toggle(code)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C9A84C", padding: 0, lineHeight: 1, display: "flex" }} aria-label={`Remove ${code}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6B6560" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
            placeholder="Search by code or description, or type any 6-digit code…"
            style={{ ...S.inp, paddingLeft: "36px" }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.target.style.borderColor = "#3D3830")}
            autoComplete="off"
          />
        </div>
        <span style={{ fontSize: "0.78125rem", color: selected.length >= LIMIT ? "#D97706" : "#6B6560", whiteSpace: "nowrap", fontFamily: "var(--font-geist-mono, monospace)", minWidth: "36px", textAlign: "right" }}>
          {selected.length}/{LIMIT}
        </span>
      </div>

      {/* Results */}
      <div style={{ maxHeight: "264px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px", paddingRight: "2px" }}>
        {/* Custom code add row */}
        {canAddCustom && (
          <button
            type="button"
            onClick={addCustom}
            style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 12px", borderRadius: "9px", border: "1px dashed #C9A84C70", background: "#C9A84C0A", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, background 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#C9A84C18"; e.currentTarget.style.borderColor = "#C9A84C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#C9A84C0A"; e.currentTarget.style.borderColor = "#C9A84C70"; }}
          >
            <Plus size={14} color="#C9A84C" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "0.875rem", color: "#C9A84C", marginRight: "8px" }}>{trimmed}</span>
              <span style={{ fontSize: "0.8125rem", color: "#A8A29E" }}>Add this NAICS code directly</span>
            </div>
          </button>
        )}

        {/* List matches */}
        {filtered.map((n) => {
          const isSelected = selected.includes(n.code);
          const isDisabled = !isSelected && selected.length >= LIMIT;
          return (
            <button
              key={n.code}
              type="button"
              onClick={() => toggle(n.code)}
              disabled={isDisabled}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: "9px", border: "1px solid", background: isSelected ? "#C9A84C10" : "#2A2724", borderColor: isSelected ? "#C9A84C50" : "#3D3830", cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.4 : 1, textAlign: "left", gap: "8px", transition: "border-color 0.15s, background 0.15s" }}
            >
              <div>
                <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontSize: "0.8125rem", color: "#C9A84C", marginRight: "8px" }}>{n.code}</span>
                <span style={{ fontSize: "0.8125rem", color: "#A8A29E", fontFamily: "var(--font-inter), sans-serif" }}>{n.desc}</span>
              </div>
              {isSelected && <Check size={14} color="#C9A84C" style={{ flexShrink: 0 }} />}
            </button>
          );
        })}

        {/* Empty: not a 6-digit code and no results */}
        {filtered.length === 0 && !canAddCustom && trimmed.length > 0 && (
          <div style={{ padding: "1rem 0.75rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "#6B6560", margin: 0 }}>
              No codes match your search.
            </p>
            {/^\d+$/.test(trimmed) && trimmed.length < 6 && (
              <p style={{ fontSize: "0.8rem", color: "#6B6560", margin: "0.375rem 0 0" }}>
                NAICS codes are 6 digits — keep typing ({6 - trimmed.length} more)
              </p>
            )}
          </div>
        )}
      </div>

      {selected.length >= LIMIT && (
        <p style={{ fontSize: "0.78125rem", color: "#D97706", marginTop: "0.5rem" }}>
          Limit reached ({selected.length}/{naicsLimit === 999 ? "∞" : naicsLimit}). Remove a code to add another.
        </p>
      )}
    </div>
  );
}

/* ─── Step 2: State picker ────────────────────────────────────────── */
function Step2({ selected, setSelected, stateLimit }: { selected: string[]; setSelected: (v: string[]) => void; stateLimit: number }) {
  const LIMIT = stateLimit;

  function toggleState(state: string) {
    if (selected.includes(state)) {
      setSelected(selected.filter((s) => s !== state));
    } else if (selected.length < LIMIT) {
      setSelected([...selected, state]);
    }
  }

  return (
    <div>
      <h2 style={S.h2}>Which states do you want to monitor?</h2>
      <p style={S.sub}>
      Select up to {LIMIT === 50 ? "all 50" : LIMIT} states on this plan.
        {LIMIT < 50 && " Pro unlocks all 50 states."}
        We monitor each state&rsquo;s procurement portal nightly.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.78125rem", color: selected.length >= LIMIT ? "#D97706" : "#6B6560", fontFamily: "var(--font-geist-mono, monospace)" }}>
          {selected.length}/{LIMIT} selected
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "290px", overflowY: "auto", paddingRight: "4px" }}>
        {Object.entries(REGIONS).map(([region, states]) => (
          <div key={region}>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6B6560", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "5px" }}>
              <MapPin size={10} /> {region}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {states.map((state) => {
                const isSelected = selected.includes(state);
                const isDisabled = !isSelected && selected.length >= LIMIT;
                return (
                  <button
                    key={state}
                    type="button"
                    onClick={() => toggleState(state)}
                    disabled={isDisabled}
                    style={{ padding: "5px 12px", borderRadius: "9999px", border: "1px solid", background: isSelected ? "#C9A84C18" : "#2A2724", borderColor: isSelected ? "#C9A84C" : "#3D3830", color: isSelected ? "#C9A84C" : "#A8A29E", fontSize: "0.8125rem", fontWeight: isSelected ? 600 : 400, cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.38 : 1, transition: "all 0.15s", fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    {state}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected.length >= LIMIT && LIMIT < 50 && (
        <p style={{ fontSize: "0.78125rem", color: "#D97706", marginTop: "0.5rem" }}>
          Limit reached ({LIMIT}/{LIMIT}). Upgrade to Pro for all 50 states.
        </p>
      )}
    </div>
  );
}

/* ─── Step 3: Keywords + Company ──────────────────────────────────── */
function Step3({
  keywords, setKeywords, company, setCompany, keywordLimit, setAsides, setSetAsides,
}: {
  keywords: string[]; setKeywords: (v: string[]) => void;
  company: string; setCompany: (v: string) => void;
  keywordLimit: number;
  setAsides: string[]; setSetAsides: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /** Strip surrounding quotes, whitespace, and trailing punctuation */
  function clean(raw: string): string {
    return raw.trim().replace(/^["'\s]+|["'.,;\s]+$/g, "").trim().toLowerCase();
  }

  /** Add one or more comma-separated keywords from the current input */
  function flush(source?: string) {
    const src = (source ?? input).trim();
    if (!src) return;
    const parts = src.split(",").map(clean).filter(Boolean);
    const next = [...keywords];
    let changed = false;
    for (const val of parts) {
      // Case-insensitive deduplication
      if (val && !next.map((k) => k.toLowerCase()).includes(val) && next.length < keywordLimit) {
        next.push(val);
        changed = true;
      }
    }
    if (changed) setKeywords(next);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      flush();
    } else if (e.key === ",") {
      e.preventDefault();
      flush();
    } else if (e.key === "Backspace" && !input && keywords.length > 0) {
      setKeywords(keywords.slice(0, -1));
    }
  }

  return (
    <div>
      <h2 style={S.h2}>Refine your matches (optional)</h2>
      <p style={S.sub}>
        Keywords let the engine catch contracts beyond your NAICS codes.
        Press <strong style={{ color: "#C9A84C", fontWeight: 600 }}>Enter</strong> or{" "}
        <strong style={{ color: "#C9A84C", fontWeight: 600 }}>comma</strong> to add each keyword.
        You can also paste a comma-separated list.
      </p>

      {/* Company name */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={S.lbl}>Company name</label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Your registered business name"
          style={S.inp}
          onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
          onBlur={(e) => (e.target.style.borderColor = "#3D3830")}
        />
      </div>

      {/* Keywords input */}
      <label style={S.lbl}>
        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Tag size={13} /> Keywords
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: keywordLimit < 999 && keywords.length >= keywordLimit ? "#D97706" : "#6B6560", fontFamily: "var(--font-geist-mono, monospace)" }}>
            {keywords.length}/{keywordLimit === 999 ? "∞" : keywordLimit}
          </span>
        </span>
      </label>

      <div
        style={{ minHeight: "88px", padding: "10px 12px", background: "#2A2724", border: "1px solid #3D3830", borderRadius: "9px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "flex-start", cursor: "text", transition: "border-color 0.15s" }}
        onClick={() => inputRef.current?.focus()}
        onFocus={() => { const el = document.querySelector<HTMLDivElement>('[data-kw-box]'); if (el) el.style.borderColor = "#C9A84C"; }}
        data-kw-box
      >
        {keywords.map((kw) => (
          <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", background: "#C9A84C18", border: "1px solid #C9A84C40", borderRadius: "9999px", fontSize: "0.8125rem", color: "#C9A84C", whiteSpace: "nowrap" }}>
            {kw}
            <button
              type="button"
              onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#C9A84C", padding: 0, lineHeight: 1, display: "flex" }}
              aria-label={`Remove ${kw}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => flush()}
          placeholder={keywords.length === 0 ? "e.g. cybersecurity, cloud, janitorial…" : ""}
          style={{ background: "none", border: "none", outline: "none", color: "#F7F5F0", fontSize: "0.875rem", flex: 1, minWidth: "160px", fontFamily: "var(--font-inter), sans-serif", padding: "2px 0" }}
        />
      </div>

      <p style={{ fontSize: "0.78125rem", color: "#6B6560", marginTop: "0.375rem", lineHeight: 1.5 }}>
        Each word or phrase counts as one keyword. Quotes and commas are stripped automatically.
        Example: type <code style={{ color: "#A8A29E", background: "#2A2724", padding: "1px 5px", borderRadius: "4px" }}>cybersecurity, cloud</code> then press Enter to add both at once.
      </p>

      {keywordLimit < 999 && keywords.length >= keywordLimit && (
        <p style={{ fontSize: "0.78125rem", color: "#D97706", marginTop: "0.25rem" }}>Keyword limit reached ({keywordLimit}/{keywordLimit}).</p>
      )}

      {/* Set-aside preferences */}
      <div style={{ marginTop: "1.25rem" }}>
        <label style={S.lbl}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <FileText size={13} /> Set-Aside Preferences
            <span style={{ fontSize: "0.72rem", color: "#6B6560", marginLeft: "2px" }}>(optional)</span>
          </span>
        </label>
        <p style={{ fontSize: "0.78125rem", color: "#6B6560", margin: "0 0 0.625rem", lineHeight: 1.45 }}>
          Only show contracts with these set-aside designations. Leave all unselected to see all contracts.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
          {([
            { code: "8a",     label: "8(a)" },
            { code: "wosb",   label: "WOSB" },
            { code: "sdvosb", label: "SDVOSB" },
            { code: "hubzone",label: "HUBZone" },
            { code: "vosb",   label: "VOSB" },
            { code: "sba",    label: "Small Business" },
          ] as const).map(({ code, label }) => {
            const active = setAsides.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => setSetAsides(active ? setAsides.filter(s => s !== code) : [...setAsides, code])}
                style={{ padding: "5px 13px", borderRadius: "9999px", border: "1px solid", background: active ? "#C9A84C18" : "#2A2724", borderColor: active ? "#C9A84C" : "#3D3830", color: active ? "#C9A84C" : "#A8A29E", fontSize: "0.8125rem", fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-inter), sans-serif" }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const [step,     setStep]     = useState(1);
  const [naics,    setNaics]    = useState<string[]>([]);
  const [states,   setStates]   = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [setAsides, setSetAsides] = useState<string[]>([]);
  const [company,  setCompany]  = useState("");
  const [plan,     setPlan]     = useState<string>("trial");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  // Plan-based limits
  const isPro         = plan === "pro";
  const naicsLimit    = isPro ? 999 : 10;
  const stateLimit    = isPro ? 50  : 7;
  const keywordLimit  = isPro ? 999 : 10;  // pricing_plan.md: Essential = 10 keywords

  /* Pre-load existing profile so returning users see their data */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("naics_codes, states, keywords, company_name, plan, set_aside_preferences")
        .eq("id", user.id)
        .single();
      if (!data) return;
      if (data.naics_codes?.length)  setNaics(data.naics_codes);
      if (data.states?.length)       setStates(data.states);
      if (data.company_name)         setCompany(data.company_name);
      if (data.plan)                 setPlan(data.plan);
      if (data.set_aside_preferences?.length) setSetAsides(data.set_aside_preferences);
      // Clean any corrupted keyword data (e.g. one string with quotes/commas)
      if (data.keywords?.length) {
        const cleaned: string[] = [];
        for (const raw of data.keywords) {
          const parts = String(raw).split(",").map((p: string) => p.trim().replace(/^["'\s]+|["'.,;\s]+$/g, "").trim().toLowerCase()).filter(Boolean);
          for (const part of parts) {
            if (part && !cleaned.includes(part)) cleaned.push(part);
          }
        }
        setKeywords(cleaned);
      }
    })();
  }, []);

  async function handleFinish() {
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { error: err } = await supabase.from("profiles").update({
      naics_codes:             naics,
      states:                  states,
      keywords:                keywords,
      set_aside_preferences:   setAsides,
      company_name:            company.trim() || null,
      onboarding_complete:     true,
    }).eq("id", user.id);

    setSaving(false);
    if (err) { setError("Could not save your preferences. Please try again."); return; }
    router.push("/dashboard");
  }

  const canNext = step === 1 ? naics.length > 0 : step === 2 ? states.length > 0 : true;

  return (
    <div style={S.page}>
      {/* Wordmark */}
      <div style={{ position: "absolute", top: "1.25rem", left: "1.75rem" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.05em" }}>
            <span style={{ color: "#C9A84C" }}>P</span><span style={{ color: "#F7F5F0" }}>lexovia</span>
          </span>
        </Link>
      </div>

      <div style={S.card}>
        <StepBar current={step} total={3} />

        {step === 1 && <Step1 selected={naics}    setSelected={setNaics}   naicsLimit={naicsLimit} />}
        {step === 2 && <Step2 selected={states}   setSelected={setStates}  stateLimit={stateLimit} />}
        {step === 3 && <Step3 keywords={keywords} setKeywords={setKeywords} company={company} setCompany={setCompany} keywordLimit={keywordLimit} setAsides={setAsides} setSetAsides={setSetAsides} />}

        {error && (
          <p style={{ fontSize: "0.8rem", color: "#F87171", marginTop: "1rem", padding: "8px 12px", background: "#2A1818", borderRadius: "8px", border: "1px solid #6B2A2A" }}>
            {error}
          </p>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} style={S.back}>
              <ArrowLeft size={15} /> Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              style={{ ...S.next, opacity: canNext ? 1 : 0.45, cursor: canNext ? "pointer" : "not-allowed" }}
              onMouseEnter={(e) => { if (canNext) e.currentTarget.style.background = "#D4B05A"; }}
              onMouseLeave={(e) => { if (canNext) e.currentTarget.style.background = "#C9A84C"; }}
            >
              Next <ArrowRight size={15} />
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "0.5rem" }}>
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                style={{ ...S.next, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#D4B05A"; }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#C9A84C"; }}
              >
                {saving
                  ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Saving...</>
                  : <><Check size={15} /> Go to Dashboard</>
                }
              </button>
              <button type="button" onClick={handleFinish} disabled={saving} style={{ background: "none", border: "none", color: "#6B6560", fontSize: "0.8125rem", cursor: "pointer", fontFamily: "var(--font-inter), sans-serif", padding: "4px" }}>
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
