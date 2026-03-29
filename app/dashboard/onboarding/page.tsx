"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight, ArrowLeft, Check, X, Loader2,
  Search, Plus, Tag, MapPin, FileText, Mail,
} from "lucide-react";

/* ─── Shared data and logic ───────────────────────────────────────── */
const NAICS_LIST: { code: string; desc: string }[] = [
  { code: "541511", desc: "Custom Computer Programming Services" },
  { code: "541512", desc: "Computer Systems Design Services" },
  { code: "541513", desc: "Computer Facilities Management Services" },
  { code: "541519", desc: "Other Computer Related Services" },
  { code: "541330", desc: "Engineering Services" },
  { code: "541611", desc: "Administrative Management Consulting" },
  { code: "541614", desc: "Process, Physical Distribution & Logistics Consulting" },
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

/* ─── Components ──────────────────────────────────────────────────── */

function StepBar({ current, total }: { current: number; total: number }) {
  const labels = ["Notification Email", "NAICS Codes", "Keywords & Set-asides", "States"];
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

function Step1_Email({ email, setEmail }: { email: string; setEmail: (v: string) => void }) {
  return (
    <div className="flex flex-col h-full fade-in">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Where should we send your matches?</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-6">
        Every morning by 6 AM, we will deliver your scored federal and state contract matches to this address.
      </p>

      <div>
        <label htmlFor="pref-email" className="block text-sm font-medium text-[var(--app-muted)] mb-1.5 pl-0.5">Notification Email</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-faint)]" />
          <input
            id="pref-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full pl-[38px] pr-4 py-3 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[15px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
          />
        </div>
      </div>
    </div>
  );
}

function Step2({ selected, setSelected }: { selected: string[]; setSelected: (v: string[]) => void }) {
  const [query, setQuery] = useState("");
  const LIMIT = 999;

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
    <div className="flex flex-col h-full fade-in">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Which NAICS codes does your firm hold?</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-5">
        Select from the list or type any 6-digit NAICS code directly.
        You can add up to {LIMIT === 999 ? "unlimited" : LIMIT} codes.
        These are the codes your company is registered under at SAM.gov.
      </p>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((code) => {
            const desc = NAICS_MAP.get(code);
            return (
              <span key={code} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-bg-app)] border border-[var(--accent)]/30 rounded-full text-[13px] text-[var(--accent)] font-mono">
                {code}
                {desc && (
                  <span className="text-[11px] text-[var(--accent)]/70 font-sans tracking-tight">
                    {desc.substring(0, 22)}{desc.length > 22 ? "…" : ""}
                  </span>
                )}
                <button type="button" onClick={() => toggle(code)} className="text-[var(--accent)] hover:text-white transition-colors" aria-label={`Remove ${code}`}>
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-faint)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
            placeholder="Search by code or desc, or type 6-digit code…"
            className="w-full pl-[38px] pr-4 py-2.5 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[14px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
            autoComplete="off"
          />
        </div>
        <span className={`text-[13px] font-mono whitespace-nowrap min-w-[36px] text-right ${selected.length >= LIMIT ? "text-amber-500 font-bold" : "text-[var(--app-muted)]"}`}>
          {selected.length}/{LIMIT === 999 ? "∞" : LIMIT}
        </span>
      </div>

      {/* Results */}
      <div className="flex-1 max-h-[290px] overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scroll">
        {canAddCustom && (
          <button
            type="button"
            onClick={addCustom}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-dashed border-[var(--accent)]/50 bg-[var(--accent-bg-app)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)] transition-colors text-left"
          >
            <Plus size={16} className="text-[var(--accent)] shrink-0" />
            <div>
              <span className="font-mono text-[14px] text-[var(--accent)] mr-2 font-semibold">{trimmed}</span>
              <span className="text-[13px] text-[var(--app-muted)]">Add this NAICS code directly</span>
            </div>
          </button>
        )}

        {filtered.map((n) => {
          const isSelected = selected.includes(n.code);
          const isDisabled = !isSelected && selected.length >= LIMIT;
          return (
            <button
              key={n.code}
              type="button"
              onClick={() => toggle(n.code)}
              disabled={isDisabled}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl border transition-all text-left gap-2 ${
                isSelected 
                  ? "bg-[var(--accent-bg-app)] border-[var(--accent)]/50" 
                  : "bg-[var(--app-surface-2)] border-[var(--app-border)] hover:border-[var(--app-muted)]"
              } ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <span className={`font-mono text-[13.5px] mr-2.5 ${isSelected ? "text-[var(--accent)] font-semibold" : "text-[var(--app-text)]"}`}>
                  {n.code}
                </span>
                <span className={`text-[13.5px] truncate ${isSelected ? "text-[var(--accent)]/80" : "text-[var(--app-muted)]"}`}>
                  {n.desc}
                </span>
              </div>
              {isSelected && <Check size={16} className="text-[var(--accent)] shrink-0" strokeWidth={2.5} />}
            </button>
          );
        })}

        {filtered.length === 0 && !canAddCustom && trimmed.length > 0 && (
          <div className="py-5 text-center">
            <p className="text-[14px] text-[var(--app-muted)]">No codes match your search.</p>
            {/^\d+$/.test(trimmed) && trimmed.length < 6 && (
              <p className="text-[13px] text-[var(--app-faint)] mt-1.5">
                NAICS codes are 6 digits — keep typing ({6 - trimmed.length} more)
              </p>
            )}
          </div>
        )}
      </div>

      {selected.length >= LIMIT && (
        <p className="text-[13px] text-amber-500 font-medium mt-3">
          Limit reached ({selected.length}/{LIMIT === 999 ? "∞" : LIMIT}). Remove a code to add another.
        </p>
      )}
    </div>
  );
}

function Step4({ selected, setSelected }: { selected: string[]; setSelected: (v: string[]) => void }) {
  const LIMIT = 50;

  function toggleState(state: string) {
    if (selected.includes(state)) {
      setSelected(selected.filter((s) => s !== state));
    } else if (selected.length < LIMIT) {
      setSelected([...selected, state]);
    }
  }

  return (
    <div className="flex flex-col h-full fade-in">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Which states do you want to monitor?</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-1">
        Select up to 50 states to monitor.
        <br />We monitor each state's procurement portal nightly.
      </p>

      <div className="flex justify-end mb-3">
        <span className={`text-[13px] font-mono ${selected.length >= LIMIT ? "text-amber-500 font-bold" : "text-[var(--app-muted)]"}`}>
          {selected.length}/{LIMIT === 50 ? "50" : LIMIT} selected
        </span>
      </div>

      <div className="flex-1 max-h-[340px] overflow-y-auto flex flex-col gap-4 pr-2 custom-scroll">
        {Object.entries(REGIONS).map(([region, states]) => (
          <div key={region}>
            <p className="text-[12px] font-bold text-[var(--app-faint)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin size={12} /> {region}
            </p>
            <div className="flex flex-wrap gap-2">
              {states.map((state) => {
                const isSelected = selected.includes(state);
                const isDisabled = !isSelected && selected.length >= LIMIT;
                return (
                  <button
                    key={state}
                    type="button"
                    onClick={() => toggleState(state)}
                    disabled={isDisabled}
                    className={`px-3 py-1.5 rounded-full border text-[13.5px] font-medium transition-all ${
                      isSelected 
                        ? "bg-[var(--accent-bg-app)] border-[var(--accent)] text-[var(--accent)] shadow-sm" 
                        : "bg-[var(--app-surface-2)] border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-muted)]"
                    } ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {state}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected.length >= LIMIT && (
        <p className="text-[13px] text-amber-500 font-medium mt-3">
          Limit reached ({LIMIT}/{LIMIT}). Remove a state to add another.
        </p>
      )}
    </div>
  );
}

function Step3({
  keywords, setKeywords, company, setCompany, setAsides, setSetAsides,
}: {
  keywords: string[]; setKeywords: (v: string[]) => void;
  company: string; setCompany: (v: string) => void;
  setAsides: string[]; setSetAsides: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const keywordLimit = 999;

  function clean(raw: string): string {
    return raw.trim().replace(/^["'\s]+|["'.,;\s]+$/g, "").trim().toLowerCase();
  }

  function flush(source?: string) {
    const src = (source ?? input).trim();
    if (!src) return;
    const parts = src.split(",").map(clean).filter(Boolean);
    const next = [...keywords];
    let changed = false;
    for (const val of parts) {
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
    <div className="flex flex-col h-full fade-in">
      <h2 className="font-bold text-xl tracking-tight text-[var(--app-text)] mb-2">Refine your matches (optional)</h2>
      <p className="text-[var(--app-muted)] text-[14px] leading-relaxed mb-6">
        Keywords let the engine catch contracts beyond your NAICS codes.
        Press <strong className="text-[var(--accent)] font-semibold">Enter</strong> or <strong className="text-[var(--accent)] font-semibold">comma</strong> to add each keyword.
        You can also paste a comma-separated list.
      </p>

      {/* Company name */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[var(--app-muted)] mb-1.5 pl-0.5">Company name</label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Your registered business name"
          className="w-full px-4 py-2.5 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[14px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
        />
      </div>

      {/* Keywords input */}
      <div className="mb-5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--app-muted)] mb-1.5 pl-0.5">
          <Tag size={14} /> Keywords
          <span className={`ml-auto font-mono text-[12px] ${keywordLimit < 999 && keywords.length >= keywordLimit ? "text-amber-500 font-bold" : "text-[var(--app-faint)]"}`}>
            {keywords.length}/{keywordLimit === 999 ? "∞" : keywordLimit}
          </span>
        </label>
        <div
          className="min-h-[96px] p-2.5 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] flex-col rounded-xl flex flex-wrap gap-2 items-start cursor-text transition-colors focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]"
          onClick={() => inputRef.current?.focus()}
        >
          {keywords.map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-bg-app)] border border-[var(--accent)]/30 rounded-full text-[13px] text-[var(--accent)]">
              {kw}
              <button
                type="button"
                onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                className="text-[var(--accent)] hover:text-white transition-colors"
                aria-label={`Remove ${kw}`}
              >
                <X size={12} strokeWidth={2.5} />
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
            className="flex-1 min-w-[160px] bg-transparent border-none outline-none text-[var(--app-text)] text-[14px] placeholder-[var(--app-faint)] mt-1"
          />
        </div>
        <p className="text-[12.5px] text-[var(--app-muted)] mt-2 leading-relaxed">
          Each word/phrase counts as one keyword. Quotes and commas are stripped.
        </p>
        {keywordLimit < 999 && keywords.length >= keywordLimit && (
          <p className="text-[13px] text-amber-500 font-medium mt-1">Keyword limit reached ({keywordLimit}/{keywordLimit}).</p>
        )}
      </div>

      {/* Set-aside preferences */}
      <div className="mt-1">
        <label className="flex items-center gap-1.5 text-sm font-medium text-[var(--app-muted)] mb-1 pl-0.5">
          <FileText size={14} /> Set-Aside Preferences
          <span className="text-[11px] text-[var(--app-faint)] opacity-80 uppercase tracking-widest ml-1">(Optional)</span>
        </label>
        <p className="text-[13px] text-[var(--app-muted)] mb-3 leading-relaxed">
          Only show contracts with these designations. Leave empty to see all available.
        </p>
        <div className="flex flex-wrap gap-2">
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
                className={`px-3 py-1.5 rounded-full border text-[13.5px] font-medium transition-all ${
                  active 
                    ? "bg-[var(--accent-bg-app)] border-[var(--accent)] text-[var(--accent)] shadow-sm" 
                    : "bg-[var(--app-surface-2)] border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-muted)]"
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
  const [email,    setEmail]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("naics_codes, states, keywords, company_name, plan, set_aside_preferences, email")
        .eq("id", user.id)
        .single();
      if (!data) return;
      if (data.email)                setEmail(data.email);
      else if (user.email)           setEmail(user.email);
      if (data.naics_codes?.length)  setNaics(data.naics_codes);
      if (data.states?.length)       setStates(data.states);
      if (data.company_name)         setCompany(data.company_name);
      if (data.plan)                 setPlan(data.plan);
      if (data.set_aside_preferences?.length) setSetAsides(data.set_aside_preferences);
      
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
      email:                   email.trim() || user.email,
      onboarding_complete:     true,
    }).eq("id", user.id);

    setSaving(false);
    if (err) { setError("Could not save your preferences. Please try again."); return; }
    router.push("/dashboard");
  }

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const canNext = step === 1 ? isValidEmail(email) : step === 2 ? naics.length > 0 : step === 4 ? states.length > 0 : true;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)] relative">
      <div className="absolute top-6 left-7 z-20">
        <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-[var(--accent)]">P</span><span className="text-[var(--app-text)]">lexovia</span>
        </Link>
      </div>

      <div className="w-full max-w-[580px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-2xl min-h-[580px] flex flex-col">
        <StepBar current={step} total={4} />

        <div className="flex-1 mb-8 overflow-hidden">
          {step === 1 && <Step1_Email email={email}  setEmail={setEmail} />}
          {step === 2 && <Step2 selected={naics}    setSelected={setNaics} />}
          {step === 3 && <Step3 keywords={keywords} setKeywords={setKeywords} company={company} setCompany={setCompany} setAsides={setAsides} setSetAsides={setSetAsides} />}
          {step === 4 && <Step4 selected={states}   setSelected={setStates} />}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mb-4">
            <p className="flex items-center gap-1.5"><X size={15}/> {error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 border-t border-[var(--app-border)] pt-6 mt-auto">
          {step > 1 && (
            <button 
              type="button" 
              onClick={() => setStep((s) => s - 1)} 
              className="flex items-center justify-center gap-1.5 px-5 py-3.5 bg-[var(--app-surface-2)] border border-[var(--app-border)] text-[var(--app-muted)] font-medium text-[15px] rounded-xl transition-colors hover:text-[var(--app-text)] hover:border-[var(--app-muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] outline-none"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className={`flex flex-1 items-center justify-center gap-1.5 px-5 py-3.5 font-bold text-[#1C1917] text-[15px] rounded-xl transition-all ${
                canNext 
                  ? "bg-[var(--accent)] hover:bg-[var(--accent-lt)]" 
                  : "bg-[var(--accent)]/50 cursor-not-allowed"
              }`}
            >
              Next <ArrowRight size={17} strokeWidth={2.5}/>
            </button>
          ) : (
            <div className="flex flex-col flex-1 gap-2">
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className={`flex items-center justify-center gap-1.5 px-5 py-3.5 font-bold text-[#1C1917] text-[15px] rounded-xl transition-all ${
                  saving 
                    ? "bg-[var(--accent)]/70 cursor-not-allowed" 
                    : "bg-[var(--accent)] hover:bg-[var(--accent-lt)]"
                }`}
              >
                {saving
                  ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
                  : <><Check size={17} strokeWidth={2.5} /> Go to Dashboard</>
                }
              </button>
              <button 
                type="button" 
                onClick={handleFinish} 
                disabled={saving} 
                className="text-center text-[13px] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors py-1 outline-none focus-visible:text-[var(--accent)]"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
