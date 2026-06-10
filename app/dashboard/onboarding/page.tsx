"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight, ArrowLeft, Check, X, Loader2,
  Search, Plus, Tag, MapPin, ShieldAlert, Zap
} from "lucide-react";
import fedOrgData from "@/public/data/federal-organizations.json";

/* ─── Shared data and logic ───────────────────────────────────────── */
const REGIONS: Record<string, string[]> = {
  "Northeast":     ["CT","MA","ME","NH","NJ","NY","PA","RI","VT"],
  "Mid-Atlantic":  ["DC","DE","MD","VA","WV"],
  "Southeast":     ["AL","AR","FL","GA","KY","LA","MS","NC","SC","TN"],
  "Midwest":       ["IA","IL","IN","KS","MI","MN","MO","ND","NE","OH","SD","WI"],
  "South Central": ["OK","TX","NM","AZ"],
  "Mountain":      ["CO","ID","MT","NV","UT","WY"],
  "Pacific":       ["AK","CA","HI","OR","WA"],
};

/* ─── Components ──────────────────────────────────────────────────── */

function StepBar({ current, total }: { current: number; total: number }) {
  const labels = ["Set-Asides", "Federal Organizations", "NAICS & PSC Codes", "Location & Keywords"];
  const estimatedMinutes = 4 - current; // decreasing as user progresses
  return (
    <div className="mb-7">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[var(--app-muted)]">Step {current} of {total}</span>
        <span className="text-[12px] text-[var(--app-faint)]">{estimatedMinutes > 0 ? `About ${estimatedMinutes} min left` : "Almost done!"}</span>
      </div>
      {/* Step indicator pills */}
      <div className="flex gap-2 mb-3">
        {labels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === current;
          const isDone = stepNum < current;
          return (
            <div key={label} className="flex-1 flex flex-col gap-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                isDone ? "bg-[var(--accent)]" :
                isActive ? "bg-[var(--accent)]" :
                "bg-[var(--app-border)]"
              }`} />
              <div className="flex items-center gap-1">
                {isDone && (
                  <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--accent)] shrink-0">
                    <circle cx="6" cy="6" r="6" fill="currentColor" opacity="0.15" />
                    <path d="M3.5 6L5.5 8L8.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
                <span className={`text-[11px] font-medium truncate ${
                  isActive ? "text-[var(--accent)]" :
                  isDone ? "text-[var(--app-muted)]" :
                  "text-[var(--app-faint)]"
                }`}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Step 1: Set-Asides
function Step1({
  selected, setSelected
}: {
  selected: string[]; setSelected: (v: string[]) => void;
}) {
  const options = [
    { code: "SB",       label: "Small Business" },
    { code: "8A",       label: "8(a)" },
    { code: "WOSB",     label: "Women-Owned (WOSB)" },
    { code: "SDVOSB",   label: "Service-Disabled Veteran-Owned" },
    { code: "HUBZONE",  label: "HUBZone" },
    { code: "IEE",      label: "Indian Economic Enterprise" },
    { code: "BICIV",    label: "Buy Indian Act" },
    { code: "VETERAN",  label: "Veteran-Owned" },
    { code: "LAS",      label: "Local Area Set-Aside" },
  ];

  function toggle(code: string) {
    setSelected(
      selected.includes(code) ? selected.filter(s => s !== code) : [...selected, code]
    );
  }

  return (
    <div className="flex flex-col h-full fade-in pr-2 overflow-y-auto custom-scroll -mr-2">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Set-Asides</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-6">
        Select the set-aside categories your business qualifies for. We&apos;ll prioritize contracts reserved for your designations.
      </p>

      <div className="mb-6">
        <label className="flex items-center justify-between text-sm font-medium text-[var(--app-muted)] mb-3 pl-0.5">
          <span className="flex items-center gap-1.5"><ShieldAlert size={14} /> Set-Asides</span>
        </label>
        <div className="flex flex-wrap gap-2.5">
          {options.map(({ code, label }) => {
            const active = selected.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggle(code)}
                className={`px-4 py-2.5 rounded-full border text-[14px] font-medium transition-all ${
                  active 
                    ? "bg-[var(--accent-bg-app)] border-[var(--accent)] text-[var(--accent)] shadow-sm" 
                    : "bg-[var(--app-surface-2)] border-[var(--app-border)] text-[var(--app-text)] hover:border-[var(--app-muted)]"
                }`}
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

// Step 2: Federal Organizations
function Step2FederalOrgs({
  fedOrgs, setFedOrgs, fedOrgList
}: {
  fedOrgs: string[]; setFedOrgs: React.Dispatch<React.SetStateAction<string[]>>;
  fedOrgList: {code: string; name: string}[];
}) {
  const [query, setQuery] = useState("");
  const LIMIT = 999;

  const trimmed = query.trim();
  const filtered = fedOrgList.filter(
    o => o.code.toLowerCase().startsWith(trimmed.toLowerCase()) || o.name.toLowerCase().includes(trimmed.toLowerCase())
  ).slice(0, 10);

  function toggleOrg(code: string) {
    if (fedOrgs.includes(code)) setFedOrgs(fedOrgs.filter(c => c !== code));
    else if (fedOrgs.length < LIMIT) setFedOrgs([...fedOrgs, code]);
  }

  return (
    <div className="flex flex-col h-full fade-in pr-2 overflow-y-auto custom-scroll -mr-2">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Federal Organizations</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-4">
        Select federal agencies you want to prioritize. Contracts from these agencies receive a match score boost.
      </p>

      {/* Selected Orgs */}
      {fedOrgs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {fedOrgs.map((code) => {
            const org = fedOrgList.find(o => o.code === code);
            return (
              <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-bg-app)] border border-[var(--accent)]/30 rounded-full text-[13px] text-[var(--accent)] font-mono">
                {code}
                {org && <span className="text-[11px] text-[var(--accent)]/70 font-sans tracking-tight">{org.name.substring(0, 20)}{org.name.length > 20 ? "…" : ""}</span>}
                <button type="button" onClick={() => toggleOrg(code)} className="text-[var(--accent)] hover:text-white transition-colors">
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3 flex-shrink-0">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-faint)]" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by code or name (e.g. DOD or defense)"
          aria-label="Search federal organizations"
          className="w-full max-w-[400px] pl-[38px] pr-4 py-2 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[14px] outline-none transition-colors focus:border-[var(--accent)]"
        />
      </div>

      {query && (
        <div className="flex-1 max-h-[200px] overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scroll mb-4">
          {filtered.map(o => {
            const isSelected = fedOrgs.includes(o.code);
            return (
              <button key={o.code} type="button" onClick={() => toggleOrg(o.code)} className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left gap-2 ${isSelected ? "bg-[var(--accent-bg-app)] border-[var(--accent)]/50" : "bg-[var(--app-surface-2)] border-[var(--app-border)]"}`}>
                <div className="flex-1 min-w-0 pr-2">
                  <span className={`font-mono text-[13px] mr-2 ${isSelected ? "text-[var(--accent)] font-semibold" : "text-[var(--app-text)]"}`}>{o.code}</span>
                  <span className={`text-[12px] truncate ${isSelected ? "text-[var(--accent)]/80" : "text-[var(--app-muted)]"}`}>{o.name}</span>
                </div>
                {isSelected && <Check size={14} className="text-[var(--accent)] shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-[12px] text-[var(--app-faint)]">
        {fedOrgs.length > 0
          ? `${fedOrgs.length} organization${fedOrgs.length === 1 ? "" : "s"} selected`
          : "Optional — leave empty to see all agencies equally"}
      </p>
    </div>
  );
}

// Step 3: NAICS & PSC
function Step2({ 
  naics, setNaics, pscCodes, setPscCodes, naicsList, pscList 
}: { 
  naics: string[]; setNaics: (v: string[]) => void; 
  pscCodes: string[]; setPscCodes: (v: string[]) => void;
  naicsList: {code: string; title: string}[] 
  pscList: {code: string; title: string}[] 
}) {
  const [query, setQuery] = useState("");
  const [pscInput, setPscInput] = useState("");
  const [pscQuery, setPscQuery] = useState("");
  const LIMIT = 999;

  const trimmed = query.trim();
  const isCustom6 = /^\d{6}$/.test(trimmed) && !naicsList.some(n => n.code === trimmed);
  const canAddCustom = isCustom6 && !naics.includes(trimmed) && naics.length < LIMIT;

  const filtered = naicsList.filter(
    (n) => n.code.startsWith(trimmed) || n.title.toLowerCase().includes(trimmed.toLowerCase())
  ).slice(0, 10);

  const pscFiltered = pscList.filter(
    (p) => p.code.toUpperCase().startsWith(pscQuery.toUpperCase()) || p.title.toUpperCase().includes(pscQuery.toUpperCase())
  ).slice(0, 8);

  function toggleNaics(code: string) {
    if (naics.includes(code)) setNaics(naics.filter((c) => c !== code));
    else if (naics.length < LIMIT) setNaics([...naics, code]);
  }

  function addPsc(code?: string) {
    const resolved = (code || pscInput.trim().toUpperCase());
    if (resolved && !pscCodes.includes(resolved) && pscCodes.length < LIMIT) {
      setPscCodes([...pscCodes, resolved]);
      setPscInput("");
      setPscQuery("");
    }
  }

  return (
    <div className="flex flex-col h-full fade-in pr-2 overflow-y-auto custom-scroll -mr-2">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">NAICS & PSC Codes</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-4">
        Add the NAICS codes that describe your business. We use these to find contracts you&apos;re qualified to win.
      </p>

      {/* Selected NAICS */}
      {naics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {naics.map((code) => {
            const desc = naicsList.find(n => n.code === code)?.title;
            return (
              <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-bg-app)] border border-[var(--accent)]/30 rounded-full text-[13px] text-[var(--accent)] font-mono">
                {code}
                {desc && <span className="text-[11px] text-[var(--accent)]/70 font-sans tracking-tight">{desc.substring(0, 20)}…</span>}
                <button type="button" onClick={() => toggleNaics(code)} className="text-[var(--accent)] hover:text-white transition-colors">
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* NAICS Search */}
      <div className="relative mb-3 flex-shrink-0">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-faint)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && canAddCustom) { toggleNaics(trimmed); setQuery(""); } }}
          placeholder="Search by code or keyword (e.g. 541511 or engineering)"
          aria-label="Search NAICS codes"
          className="w-full pl-[38px] pr-4 py-2 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[14px] outline-none transition-colors focus:border-[var(--accent)]"
        />
      </div>

      {query && (
        <div className="flex-1 max-h-[120px] overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scroll mb-4">
          {canAddCustom && (
            <button type="button" onClick={() => { toggleNaics(trimmed); setQuery(""); }} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-[var(--accent)]/50 text-left">
              <Plus size={14} className="text-[var(--accent)] shrink-0" />
              <span className="font-mono text-[13px] text-[var(--accent)] font-semibold">{trimmed} (Custom)</span>
            </button>
          )}
          {filtered.map((n) => {
            const isSelected = naics.includes(n.code);
            return (
              <button key={n.code} type="button" onClick={() => toggleNaics(n.code)} className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left gap-2 ${isSelected ? "bg-[var(--accent-bg-app)] border-[var(--accent)]/50" : "bg-[var(--app-surface-2)] border-[var(--app-border)]"}`}>
                <div className="flex-1 min-w-0 pr-2">
                  <span className={`font-mono text-[13px] mr-2 ${isSelected ? "text-[var(--accent)] font-semibold" : "text-[var(--app-text)]"}`}>{n.code}</span>
                  <span className={`text-[12px] truncate ${isSelected ? "text-[var(--accent)]/80" : "text-[var(--app-muted)]"}`}>{n.title}</span>
                </div>
                {isSelected && <Check size={14} className="text-[var(--accent)] shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}

      {/* PSC Codes */}
      <div className="mt-4 border-t border-[var(--app-border)] pt-4 flex-shrink-0">
        <label className="flex items-center justify-between text-sm font-medium text-[var(--app-muted)] mb-2 pl-0.5">
          <span className="flex items-center gap-1.5">Product & Service Codes (PSC)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {pscCodes.map((code) => (
            <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-md text-[13px] font-mono text-[var(--app-text)]">
              {code}
              <button type="button" onClick={() => setPscCodes(pscCodes.filter(c => c !== code))} className="text-[var(--app-muted)] hover:text-[var(--danger)]"><X size={12}/></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={pscInput}
            onChange={(e) => { setPscInput(e.target.value); setPscQuery(e.target.value); }}
            onKeyDown={(e) => { if (e.key === "Enter") addPsc(); }}
            placeholder="e.g. D302, R425"
            aria-label="Add PSC code"
            className="flex-1 px-3 py-2 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-lg text-[var(--app-text)] text-[13px] outline-none focus:border-[var(--accent)] uppercase"
            autoComplete="off"
          />
          <button type="button" onClick={() => addPsc()} className="px-4 py-2 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-lg text-[13px] font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">Add</button>
          {pscQuery.trim() && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl shadow-lg max-h-[200px] overflow-y-auto flex flex-col">
              {pscFiltered.map((p) => {
                const alreadyAdded = pscCodes.includes(p.code);
                return (
                  <button key={p.code} type="button" onClick={() => { if (!alreadyAdded) addPsc(p.code); }} className={`flex items-center gap-2 px-3 py-2 text-left border-b border-[var(--app-border)] last:border-b-0 transition-colors ${alreadyAdded ? "opacity-40 cursor-default" : "hover:bg-[var(--accent-bg-app)]"}`} disabled={alreadyAdded}>
                    <span className="font-mono text-[12px] font-semibold text-[var(--accent)] min-w-[40px] shrink-0">{p.code}</span>
                    <span className="text-[11px] text-[var(--app-muted)] truncate">{p.title}</span>
                    {alreadyAdded && <span className="text-[10px] text-[var(--app-faint)] shrink-0 ml-auto">Added</span>}
                  </button>
                );
              })}
              {pscFiltered.length === 0 && /^[A-Z0-9]{1,4}$/.test(pscQuery) && !pscCodes.includes(pscQuery) && (
                <button type="button" onClick={() => addPsc(pscQuery)} className="flex items-center gap-2 px-3 py-2 text-left border-b border-dashed border-[var(--app-border)] last:border-b-0 hover:bg-[var(--accent-bg-app)]">
                  <span className="font-mono text-[12px] font-semibold text-[var(--accent)] min-w-[40px] shrink-0">{pscQuery}</span>
                  <span className="text-[11px] text-[var(--app-muted)] italic">Custom code (not in standard list)</span>
                </button>
              )}
              {pscFiltered.length === 0 && !(/^[A-Z0-9]{1,4}$/.test(pscQuery)) && (
                <div className="px-3 py-2 text-[11px] text-[var(--app-faint)] text-center">No matching PSC codes found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 4: Location & Keywords
function Step3({
  states, setStates, keywords, setKeywords, excludeKeywords, setExcludeKeywords
}: {
  states: string[]; setStates: (v: string[]) => void;
  keywords: string[]; setKeywords: (v: string[]) => void;
  excludeKeywords: string[]; setExcludeKeywords: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [exInput, setExInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const exRef = useRef<HTMLInputElement>(null);
  const limit = 999;

  function toggleState(state: string) {
    if (states.includes(state)) setStates(states.filter((s) => s !== state));
    else if (states.length < 50) setStates([...states, state]);
  }

  function flush(type: 'pos' | 'neg') {
    const isPos = type === 'pos';
    const src = isPos ? input : exInput;
    const target = isPos ? keywords : excludeKeywords;
    const setter = isPos ? setKeywords : setExcludeKeywords;
    
    const parts = src.split(",").map(k => k.trim().replace(/^["'\s]+|["'.,;\s]+$/g, "").trim().toLowerCase()).filter(Boolean);
    const next = [...target];
    let changed = false;
    for (const val of parts) {
      if (val && !next.map(k => k.toLowerCase()).includes(val) && next.length < limit) {
        next.push(val);
        changed = true;
      }
    }
    if (changed) setter(next);
    if (isPos) setInput(""); else setExInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, type: 'pos' | 'neg') {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      flush(type);
    } else if (e.key === "Backspace") {
      if (type === 'pos' && !input && keywords.length > 0) setKeywords(keywords.slice(0, -1));
      if (type === 'neg' && !exInput && excludeKeywords.length > 0) setExcludeKeywords(excludeKeywords.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col h-full fade-in pr-2 overflow-y-auto custom-scroll -mr-2">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Location & Keywords</h2>
      
      {/* Target States */}
      <div className="mb-5 mt-2">
        <label className="flex items-center justify-between text-sm font-medium text-[var(--app-muted)] mb-2 pl-0.5">
          <span className="flex items-center gap-1.5"><MapPin size={14} /> States You Operate In</span>
        </label>
        <div className="p-3 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-xl max-h-[110px] overflow-y-auto custom-scroll">
          {Object.entries(REGIONS).map(([region, regionStates]) => (
            <div key={region} className="mb-2 last:mb-0 flex items-start gap-2">
              <p className="text-[10px] font-bold text-[var(--app-faint)] uppercase tracking-wider w-[80px] shrink-0 pt-1">{region}</p>
              <div className="flex flex-wrap gap-1">
                {regionStates.map((state) => {
                  const active = states.includes(state);
                  return (
                    <button
                      key={state}
                      type="button"
                      onClick={() => toggleState(state)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${active ? "bg-[var(--accent-bg-app)] border border-[var(--accent)] text-[var(--accent)]" : "bg-transparent border border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-muted)]"}`}
                    >
                      {state}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Positive Keywords */}
      <div className="mb-4">
        <label className="flex items-center justify-between text-sm font-medium text-[var(--app-muted)] mb-1 pl-0.5">
          <span className="flex items-center gap-1.5"><Tag size={14} /> Positive Keywords</span>
        </label>
        <p className="text-[12px] text-[var(--app-faint)] mb-2 pl-0.5">Be specific. Generic terms like &quot;services&quot; will match thousands of irrelevant contracts.</p>
        <div className="min-h-[60px] p-2 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl flex flex-wrap gap-2 items-start cursor-text transition-colors focus-within:border-[var(--accent)]" onClick={() => inputRef.current?.focus()}>
          {keywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent-bg-app)] border border-[var(--accent)]/30 rounded-full text-[12px] text-[var(--accent)]">
              {kw}
              <button type="button" onClick={() => setKeywords(keywords.filter((k) => k !== kw))} className="text-[var(--accent)] hover:text-white"><X size={12} strokeWidth={2.5} /></button>
            </span>
          ))}
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'pos')} onBlur={() => flush('pos')} placeholder={keywords.length === 0 ? "e.g. cybersecurity, network infrastructure" : ""} aria-label="Add positive keyword" className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[var(--app-text)] text-[13px] placeholder-[var(--app-faint)] mt-1 px-1" />
        </div>
      </div>

      {/* Negative Keywords */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-[var(--app-muted)] mb-1 pl-0.5">
          <span className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-[var(--danger)]/70" /> Negative Keywords</span>
        </label>
        <p className="text-[12px] text-[var(--app-faint)] mb-2 pl-0.5">Filter out contracts you&apos;d never bid on. Examples: hardware, janitorial, construction.</p>
        <div className="min-h-[60px] p-2 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl flex flex-wrap gap-2 items-start cursor-text transition-colors focus-within:border-[var(--danger)]/50" onClick={() => exRef.current?.focus()}>
          {excludeKeywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--danger)]/8 border border-[var(--danger)]/25 rounded-full text-[12px] text-[var(--danger)]">
              {kw}
              <button type="button" onClick={() => setExcludeKeywords(excludeKeywords.filter((k) => k !== kw))} className="text-[var(--danger)] hover:text-[var(--danger)]/70"><X size={12} strokeWidth={2.5} /></button>
            </span>
          ))}
          <input ref={exRef} type="text" value={exInput} onChange={(e) => setExInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'neg')} onBlur={() => flush('neg')} placeholder={excludeKeywords.length === 0 ? "e.g. janitorial, landscaping" : ""} aria-label="Add negative keyword" className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[var(--app-text)] text-[13px] placeholder-[var(--app-faint)] mt-1 px-1" />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [step,     setStep]     = useState(1);
  const [naicsList, setNaicsList] = useState<{code: string; title: string}[]>([]);
  const [pscList, setPscList] = useState<{code: string; title: string}[]>([]);
  
  const [naics,    setNaics]    = useState<string[]>([]);
  const [pscCodes, setPscCodes] = useState<string[]>([]);
  const [states,   setStates]   = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [setAsides, setSetAsides] = useState<string[]>(["SB"]);
  const [fedOrgs, setFedOrgs] = useState<string[]>([]);
  const [fedOrgList, setFedOrgList] = useState<{code: string; name: string}[]>([]);
  
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    fetch("/data/naics-2022.json").then(r => r.json()).then(setNaicsList).catch(() => {});

    fetch("/data/psc-codes.json").then(r => r.json()).then(setPscList).catch(() => {});

    setFedOrgList(fedOrgData);

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("naics_codes, states, keywords, set_aside_preferences, psc_codes, exclude_keywords, fed_org_prefs")
        .eq("id", user.id)
        .single();
      if (!data) return;
      if (data.naics_codes?.length)  setNaics(data.naics_codes);
      if (data.states?.length)       setStates(data.states);
      if (data.set_aside_preferences?.length) setSetAsides(data.set_aside_preferences);
      if (data.psc_codes?.length)    setPscCodes(data.psc_codes);
      if (data.fed_org_prefs?.length) setFedOrgs(data.fed_org_prefs);
      
      const parseList = (rawList: any) => {
        if (!rawList?.length) return [];
        const cleaned: string[] = [];
        for (const raw of rawList) {
          const parts = String(raw).split(",").map((p: string) => p.trim().replace(/^["'\s]+|["'.,;\s]+$/g, "").trim().toLowerCase()).filter(Boolean);
          for (const part of parts) {
            if (part && !cleaned.includes(part)) cleaned.push(part);
          }
        }
        return cleaned;
      };
      
      setKeywords(parseList(data.keywords));
      setExcludeKeywords(parseList(data.exclude_keywords));
    })();
  }, []);

  const [buildingDashboard, setBuildingDashboard] = useState(false);
  const [buildStatus, setBuildStatus] = useState("");

  async function handleFinish() {
    if (saving || buildingDashboard) return;
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    // Phase 1: Save profile
    setBuildStatus("Saving your preferences…");
    const { error: err } = await supabase.from("profiles").update({
      naics_codes:             naics,
      psc_codes:               pscCodes,
      states:                  states,
      keywords:                keywords,
      exclude_keywords:        excludeKeywords,
      set_aside_preferences:   setAsides,
      fed_org_prefs:           fedOrgs,
      onboarding_complete:     true,
    }).eq("id", user.id);

    if (err) {
      setSaving(false);
      setError("Something went wrong saving your profile. Please try again.");
      return;
    }

    // Phase 2: Trigger pipelines — show building state
    setBuildingDashboard(true);
    setSaving(false);
    setBuildStatus("Starting contract matching engine…");

    const matchResult = await fetch("/api/onboarding/first-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ naics_codes: naics, states: states })
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok, status: data.status };
    }).catch(() => ({ ok: false, status: "error" }));

    // Check if matching succeeded — this determines user's first impression
    const matchOk = matchResult.ok && matchResult.status !== 'failed';

    if (matchOk) {
      setBuildStatus("Contracts matched! Redirecting to your dashboard…");
    } else {
      // Engine was unavailable, but profile is saved. Pipeline runs at 11:00 + 18:00 UTC daily.
      setBuildStatus("Your dashboard is being prepared. Pipeline runs at 11:00 and 18:00 UTC daily. Redirecting…");
    }

    // Brief delay so user sees the final status message
    await new Promise(r => setTimeout(r, 1500));
    window.location.href = "/dashboard";
  }

  const canNext = step === 1 ? true : step === 2 ? true : step === 3 ? (naics.length > 0 || pscCodes.length > 0) : true;

  async function handleSkip() {
    if (saving || buildingDashboard) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }
    const { error } = await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
    if (error) { setError("Failed to skip. Please try again."); return; }
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)] relative"
      style={{ animationName: "onboard-fade-in", animationDuration: "400ms", animationTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)", animationFillMode: "both" }}
    >
      {/* Header: Wordmark + Skip */}
      <div className="absolute top-6 left-7 z-20">
        <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-[var(--accent)]">P</span><span className="text-[var(--app-text)]">lexovia</span>
        </Link>
      </div>
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-6 right-7 z-20 text-[13px] text-[var(--app-faint)] hover:text-[var(--app-muted)] transition-colors underline underline-offset-2 decoration-transparent hover:decoration-[var(--app-faint)]"
      >
        Skip for now
      </button>

      <div className="w-full max-w-[580px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-2xl min-h-[580px] flex flex-col">
        {buildingDashboard ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-12">
            <div className="relative" style={{ animationName: "onboard-spin-in", animationDuration: "600ms", animationTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)", animationFillMode: "both" }}>
              <div style={{ width: 56, height: 56, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
              <Zap size={22} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-[var(--app-text)] mb-2">Preparing Your Intelligence</h2>
              <p className="text-[var(--app-muted)] text-sm leading-relaxed max-w-[360px]">
                Matching federal contracts to your profile. This usually takes 10–30 seconds.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-full">
              <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
              <span className="text-sm text-[var(--app-muted)]">{buildStatus}</span>
            </div>
          </div>
        ) : (
        <>
        <StepBar current={step} total={4} />

        <div className="flex-1 mb-8 overflow-hidden h-[340px]">
          {step === 1 && <Step1 selected={setAsides} setSelected={setSetAsides} />}
          {step === 2 && <Step2FederalOrgs fedOrgs={fedOrgs} setFedOrgs={setFedOrgs} fedOrgList={fedOrgList} />}
          {step === 3 && <Step2 naics={naics} setNaics={setNaics} pscCodes={pscCodes} setPscCodes={setPscCodes} naicsList={naicsList} pscList={pscList} />}
          {step === 4 && <Step3 states={states} setStates={setStates} keywords={keywords} setKeywords={setKeywords} excludeKeywords={excludeKeywords} setExcludeKeywords={setExcludeKeywords} />}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-[var(--danger)]/8 border border-[var(--danger)]/20 rounded-lg text-[var(--danger)] text-sm mb-4">
            <p className="flex items-center gap-1.5"><X size={15}/> {error}</p>
          </div>
        )}

        <div className="flex gap-3 border-t border-[var(--app-border)] pt-6 mt-auto">
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="flex items-center justify-center gap-1.5 px-5 py-3.5 bg-[var(--app-surface-2)] border border-[var(--app-border)] text-[var(--app-muted)] font-medium text-[15px] rounded-xl transition-colors hover:text-[var(--app-text)] hover:border-[var(--app-muted)] outline-none active:scale-[0.98]">
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {step < 4 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className={`flex flex-1 items-center justify-center gap-1.5 px-5 py-3.5 font-bold text-white text-[15px] rounded-xl transition-all active:scale-[0.98] ${canNext ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)]/20" : "bg-[var(--accent)]/50 cursor-not-allowed"}`}>
              Next <ArrowRight size={17} strokeWidth={2.5}/>
            </button>
          ) : (
            <button type="button" onClick={handleFinish} disabled={saving || buildingDashboard || !canNext} className={`flex flex-1 items-center justify-center gap-1.5 px-5 py-3.5 font-bold text-white text-[15px] rounded-xl transition-all active:scale-[0.98] ${saving || buildingDashboard || !canNext ? "bg-[var(--accent)]/70 cursor-not-allowed" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)]/20"}`}>
              {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Check size={17} strokeWidth={2.5} /> Activate Monitoring</>}
            </button>
          )}
        </div>
        </>
        )}
      </div>

      <style>{`
        @keyframes onboard-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes onboard-spin-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
