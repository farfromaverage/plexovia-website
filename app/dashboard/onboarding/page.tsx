"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight, ArrowLeft, Check, X, Loader2,
  Search, Plus, Tag, MapPin, DollarSign, ShieldAlert
} from "lucide-react";

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
  const labels = ["Basics", "NAICS & PSC Codes", "Location & Keywords"];
  return (
    <div className="mb-7">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[var(--app-muted)]">Step {current} of {total}</span>
        <span className="text-sm text-[var(--accent)] font-semibold">{labels[current - 1]}</span>
      </div>
      <div className="h-1 bg-[var(--app-border)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--accent)] rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${(current / total) * 100}%` }} 
        />
      </div>
    </div>
  );
}

// Step 1: Set-Asides & Value
function Step1({
  selected, setSelected, minValue, setMinValue, maxValue, setMaxValue
}: {
  selected: string[]; setSelected: (v: string[]) => void;
  minValue: string; setMinValue: (v: string) => void;
  maxValue: string; setMaxValue: (v: string) => void;
}) {
  const options = [
    { code: "sba",    label: "Small Business" },
    { code: "8a",     label: "8(a)" },
    { code: "wosb",   label: "WOSB" },
    { code: "sdvosb", label: "SDVOSB" },
    { code: "hubzone",label: "HUBZone" },
    { code: "vosb",   label: "VOSB" },
    { code: "none",   label: "Unrestricted" },
  ];

  function toggle(code: string) {
    if (code === "none") {
      setSelected(["none"]);
      return;
    }
    
    let next = selected.includes(code) ? selected.filter(s => s !== code) : [...selected, code];
    next = next.filter(s => s !== "none");
    setSelected(next);
  }

  return (
    <div className="flex flex-col h-full fade-in pr-2 overflow-y-auto custom-scroll -mr-2">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Set-Asides & Value</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-6">
        Select your eligible socio-economic certifications and target contract value.
      </p>

      <div className="mb-6">
        <label className="flex items-center justify-between text-sm font-medium text-[var(--app-muted)] mb-3 pl-0.5">
          <span className="flex items-center gap-1.5"><ShieldAlert size={14} /> Certifications</span>
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

      <div>
        <label className="flex items-center justify-between text-sm font-medium text-[var(--app-muted)] mb-3 pl-0.5">
          <span className="flex items-center gap-1.5"><DollarSign size={14} /> Target Contract Value (Optional)</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-faint)]">$</span>
            <input
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              placeholder="Min value (e.g. 50000)"
              className="w-full pl-7 pr-4 py-2.5 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[14px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
            />
          </div>
          <span className="text-[var(--app-muted)] font-medium">to</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-faint)]">$</span>
            <input
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              placeholder="Max value (e.g. 1000000)"
              className="w-full pl-7 pr-4 py-2.5 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[14px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: NAICS & PSC
function Step2({ 
  naics, setNaics, pscCodes, setPscCodes, naicsList 
}: { 
  naics: string[]; setNaics: (v: string[]) => void; 
  pscCodes: string[]; setPscCodes: (v: string[]) => void;
  naicsList: {code: string; title: string}[] 
}) {
  const [query, setQuery] = useState("");
  const [pscInput, setPscInput] = useState("");
  const LIMIT = 999;

  const trimmed = query.trim();
  const isCustom6 = /^\d{6}$/.test(trimmed) && !naicsList.some(n => n.code === trimmed);
  const canAddCustom = isCustom6 && !naics.includes(trimmed) && naics.length < LIMIT;

  const filtered = naicsList.filter(
    (n) => n.code.startsWith(trimmed) || n.title.toLowerCase().includes(trimmed.toLowerCase())
  ).slice(0, 10);

  function toggleNaics(code: string) {
    if (naics.includes(code)) setNaics(naics.filter((c) => c !== code));
    else if (naics.length < LIMIT) setNaics([...naics, code]);
  }

  function addPsc() {
    const code = pscInput.trim().toUpperCase();
    if (code && !pscCodes.includes(code) && pscCodes.length < LIMIT) {
      setPscCodes([...pscCodes, code]);
      setPscInput("");
    }
  }

  return (
    <div className="flex flex-col h-full fade-in pr-2 overflow-y-auto custom-scroll -mr-2">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Industry Codes</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-4">
        Define your NAICS codes and Federal Supply/PSC Codes.
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
          placeholder="Search NAICS codes..."
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
          <span className="flex items-center gap-1.5">PSC / FSC Codes</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {pscCodes.map((code) => (
            <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-md text-[13px] font-mono text-[var(--app-text)]">
              {code}
              <button type="button" onClick={() => setPscCodes(pscCodes.filter(c => c !== code))} className="text-[var(--app-muted)] hover:text-red-400"><X size={12}/></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={pscInput}
            onChange={(e) => setPscInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addPsc(); }}
            placeholder="e.g. D302, 1005"
            className="flex-1 px-3 py-2 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-lg text-[var(--app-text)] text-[13px] outline-none focus:border-[var(--accent)] uppercase"
          />
          <button type="button" onClick={addPsc} className="px-4 py-2 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-lg text-[13px] font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">Add</button>
        </div>
      </div>
    </div>
  );
}

// Step 3: Location & Keywords
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
          <span className="flex items-center gap-1.5"><MapPin size={14} /> State Monitoring</span>
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
        <p className="text-[12px] text-[var(--app-faint)] mb-2 pl-0.5">Do NOT use generic words like "services" or "management". Be highly specific.</p>
        <div className="min-h-[60px] p-2 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl flex flex-wrap gap-2 items-start cursor-text transition-colors focus-within:border-[var(--accent)]" onClick={() => inputRef.current?.focus()}>
          {keywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent-bg-app)] border border-[var(--accent)]/30 rounded-full text-[12px] text-[var(--accent)]">
              {kw}
              <button type="button" onClick={() => setKeywords(keywords.filter((k) => k !== kw))} className="text-[var(--accent)] hover:text-white"><X size={12} strokeWidth={2.5} /></button>
            </span>
          ))}
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'pos')} onBlur={() => flush('pos')} placeholder={keywords.length === 0 ? "e.g. cybersecurity, hvac..." : ""} className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[var(--app-text)] text-[13px] placeholder-[var(--app-faint)] mt-1 px-1" />
        </div>
      </div>

      {/* Negative Keywords */}
      <div>
        <label className="flex items-center justify-between text-sm font-medium text-[var(--app-muted)] mb-1 pl-0.5">
          <span className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-red-400/70" /> Negative Keywords</span>
        </label>
        <p className="text-[12px] text-[var(--app-faint)] mb-2 pl-0.5">Exclude contracts containing these words (e.g. hardware, cleaning).</p>
        <div className="min-h-[60px] p-2 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl flex flex-wrap gap-2 items-start cursor-text transition-colors focus-within:border-red-500/50" onClick={() => exRef.current?.focus()}>
          {excludeKeywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-[12px] text-red-400">
              {kw}
              <button type="button" onClick={() => setExcludeKeywords(excludeKeywords.filter((k) => k !== kw))} className="text-red-400 hover:text-red-300"><X size={12} strokeWidth={2.5} /></button>
            </span>
          ))}
          <input ref={exRef} type="text" value={exInput} onChange={(e) => setExInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'neg')} onBlur={() => flush('neg')} placeholder={excludeKeywords.length === 0 ? "Exclude words..." : ""} className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[var(--app-text)] text-[13px] placeholder-[var(--app-faint)] mt-1 px-1" />
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const [step,     setStep]     = useState(1);
  const [naicsList, setNaicsList] = useState<{code: string; title: string}[]>([]);
  
  const [naics,    setNaics]    = useState<string[]>([]);
  const [pscCodes, setPscCodes] = useState<string[]>([]);
  const [states,   setStates]   = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [setAsides, setSetAsides] = useState<string[]>(["sba"]);
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    fetch("/data/naics-2022.json").then(r => r.json()).then(setNaicsList).catch(() => {});

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("naics_codes, states, keywords, set_aside_preferences, psc_codes, exclude_keywords, min_value, max_value")
        .eq("id", user.id)
        .single();
      if (!data) return;
      if (data.naics_codes?.length)  setNaics(data.naics_codes);
      if (data.states?.length)       setStates(data.states);
      if (data.set_aside_preferences?.length) setSetAsides(data.set_aside_preferences);
      if (data.psc_codes?.length)    setPscCodes(data.psc_codes);
      if (data.min_value !== null)   setMinValue(String(data.min_value));
      if (data.max_value !== null)   setMaxValue(String(data.max_value));
      
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
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const finalSetAsides = setAsides.includes("none") ? [] : setAsides;

    // Phase 1: Save profile
    setBuildStatus("Saving your preferences…");
    const { error: err } = await supabase.from("profiles").update({
      naics_codes:             naics,
      psc_codes:               pscCodes,
      states:                  states,
      keywords:                keywords,
      exclude_keywords:        excludeKeywords,
      set_aside_preferences:   finalSetAsides,
      min_value:               minValue ? parseInt(minValue, 10) : null,
      max_value:               maxValue ? parseInt(maxValue, 10) : null,
      onboarding_complete:     true,
    }).eq("id", user.id);

    if (err) {
      setSaving(false);
      setError("Could not save your preferences. Please try again.");
      return;
    }

    // Phase 2: Trigger pipelines — show building state
    setSaving(false);
    setBuildingDashboard(true);
    setBuildStatus("Starting contract matching engine…");

    // Fire both triggers in parallel
    await Promise.allSettled([
      fetch("/api/onboarding/first-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naics_codes: naics, states: states })
      }),
      fetch("/api/forecasts/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naics_codes: naics })
      })
    ]);

    setBuildStatus("Redirecting to your dashboard…");

    // Small delay so user sees the status, then hard redirect
    // Hard redirect (window.location) avoids Next.js router cache issues
    // and ensures middleware re-evaluates onboarding_complete = true
    await new Promise(r => setTimeout(r, 1200));
    window.location.href = "/dashboard";
  }

  const canNext = step === 1 ? true : step === 2 ? (naics.length > 0 || pscCodes.length > 0) : true;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)] relative">
      <div className="absolute top-6 left-7 z-20">
        <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-[var(--accent)]">P</span><span className="text-[var(--app-text)]">lexovia</span>
        </Link>
      </div>

      <div className="w-full max-w-[580px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-2xl min-h-[580px] flex flex-col">
        {buildingDashboard ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-12">
            <div className="relative">
              <div style={{ width: 56, height: 56, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
              <Zap size={22} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-[var(--app-text)] mb-2">Building Your Dashboard</h2>
              <p className="text-[var(--app-muted)] text-sm leading-relaxed max-w-[360px]">
                We&apos;re matching contracts to your profile and generating AI forecasts. This takes a few seconds.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-full">
              <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
              <span className="text-sm text-[var(--app-muted)]">{buildStatus}</span>
            </div>
          </div>
        ) : (
        <>
        <StepBar current={step} total={3} />

        <div className="flex-1 mb-8 overflow-hidden h-[340px]">
          {step === 1 && <Step1 selected={setAsides} setSelected={setSetAsides} minValue={minValue} setMinValue={setMinValue} maxValue={maxValue} setMaxValue={setMaxValue} />}
          {step === 2 && <Step2 naics={naics} setNaics={setNaics} pscCodes={pscCodes} setPscCodes={setPscCodes} naicsList={naicsList} />}
          {step === 3 && <Step3 states={states} setStates={setStates} keywords={keywords} setKeywords={setKeywords} excludeKeywords={excludeKeywords} setExcludeKeywords={setExcludeKeywords} />}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mb-4">
            <p className="flex items-center gap-1.5"><X size={15}/> {error}</p>
          </div>
        )}

        <div className="flex gap-3 border-t border-[var(--app-border)] pt-6 mt-auto">
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="flex items-center justify-center gap-1.5 px-5 py-3.5 bg-[var(--app-surface-2)] border border-[var(--app-border)] text-[var(--app-muted)] font-medium text-[15px] rounded-xl transition-colors hover:text-[var(--app-text)] hover:border-[var(--app-muted)] outline-none">
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {step < 3 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className={`flex flex-1 items-center justify-center gap-1.5 px-5 py-3.5 font-bold text-[#1C1917] text-[15px] rounded-xl transition-all ${canNext ? "bg-[var(--accent)] hover:bg-[var(--accent-lt)]" : "bg-[var(--accent)]/50 cursor-not-allowed"}`}>
              Next <ArrowRight size={17} strokeWidth={2.5}/>
            </button>
          ) : (
            <button type="button" onClick={handleFinish} disabled={saving || buildingDashboard || !canNext} className={`flex flex-1 items-center justify-center gap-1.5 px-5 py-3.5 font-bold text-[#1C1917] text-[15px] rounded-xl transition-all ${saving || buildingDashboard || !canNext ? "bg-[var(--accent)]/70 cursor-not-allowed" : "bg-[var(--accent)] hover:bg-[var(--accent-lt)]"}`}>
              {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Check size={17} strokeWidth={2.5} /> Finish & Build Dashboard</>}
            </button>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
