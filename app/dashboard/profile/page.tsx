"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, CheckCircle, AlertCircle, Plus, X, RefreshCw, ExternalLink } from "lucide-react";

/* ─── Constants ──────────────────────────────────────────── */
const MAX_KEYWORDS = 30;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];
const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"Washington D.C.",
};

const SET_ASIDES = [
  { value: "none",   label: "Unrestricted" },
  { value: "sba",    label: "Small Business" },
  { value: "8a",     label: "8(a) Business Development" },
  { value: "sdvosb", label: "Service-Disabled Veteran-Owned (SDVOSB)" },
  { value: "wosb",   label: "Women-Owned Small Business (WOSB)" },
  { value: "hubzone",label: "HUBZone" },
  { value: "vosb",   label: "Veteran-Owned Small Business (VOSB)" },
  { value: "sdb",    label: "Small Disadvantaged Business (SDB)" },
];

/* ─── Profile type ───────────────────────────────────────── */
interface ProfileData {
  id: string;
  company_name: string | null;
  naics_codes: string[] | null;
  psc_codes: string[] | null;
  states: string[] | null;
  keywords: string[] | null;
  exclude_keywords: string[] | null;
  email_frequency: string | null;
  set_aside_preferences: string[] | null;
  min_value: number | null;
  max_value: number | null;
}

/* ─── NAICS validation ───────────────────────────────────── */
function isValidNaics(code: string): boolean {
  return /^\d{2,6}$/.test(code);
}

/* ─── Completeness score ─────────────────────────────────── */
function getCompleteness(
  company: string, naics: string[], states: string[], keywords: string[]
): { score: number; label: string; missing: string[] } {
  const missing: string[] = [];
  let score = 0;
  if (company.trim()) score += 25; else missing.push("Company name");
  if (naics.length > 0) score += 35; else missing.push("At least one NAICS code");
  if (states.length > 0) score += 25; else missing.push("At least one state");
  if (keywords.length > 0) score += 15; else missing.push("Keywords (optional)");
  const label = score === 100 ? "Complete" : score >= 60 ? "Good" : "Incomplete";
  return { score, label, missing };
}

/* ─── Page ───────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();

  const [userId,         setUserId]         = useState<string | null>(null);
  const [userEmail,      setUserEmail]      = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [isDirty,        setIsDirty]        = useState(false);

  /* Form state */
  const [companyName,   setCompanyName]   = useState("");
  const [naicsCodes,    setNaicsCodes]    = useState<string[]>([]);
  const [naicsInput,    setNaicsInput]    = useState("");
  const [naicsError,    setNaicsError]    = useState<string | null>(null);
  
  const [pscCodes,      setPscCodes]      = useState<string[]>([]);
  const [pscInput,      setPscInput]      = useState("");
  
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [keywords,      setKeywords]      = useState<string[]>([]);
  const [keywordInput,  setKeywordInput]  = useState("");
  
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [excludeInput,    setExcludeInput]    = useState("");

  const [frequency,     setFrequency]     = useState("daily");
  const [setAsides,     setSetAsides]     = useState<string[]>([]);
  
  const [minValue,      setMinValue]      = useState<string>("");
  const [maxValue,      setMaxValue]      = useState<string>("");

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    setUserId(user.id);
    setUserEmail(user.email ?? null);

    const { data, error: err } = await supabase
      .from("profiles")
      .select("id,company_name,naics_codes,psc_codes,states,keywords,exclude_keywords,email_frequency,set_aside_preferences,min_value,max_value")
      .eq("id", user.id)
      .single();

    if (err) {
      setError("Could not load your profile.");
    } else if (data) {
      const d = data as ProfileData;
      setCompanyName(d.company_name ?? "");
      setNaicsCodes(d.naics_codes ?? []);
      setOriginalNaicsCodes(d.naics_codes ?? []);
      setPscCodes(d.psc_codes ?? []);
      setSelectedStates(d.states ?? []);
      setKeywords(d.keywords ?? []);
      setExcludeKeywords(d.exclude_keywords ?? []);
      setFrequency(d.email_frequency ?? "daily");
      setSetAsides(d.set_aside_preferences ?? []);
      setMinValue(d.min_value !== null ? String(d.min_value) : "");
      setMaxValue(d.max_value !== null ? String(d.max_value) : "");
    }
    setLoading(false);
    setIsDirty(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Warn before leaving if dirty
  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  /* ─── Helpers (mark dirty on any change) ─────────────────── */
  function markDirty() { setIsDirty(true); setSaved(false); }

  function addNaics() {
    const code = naicsInput.trim().replace(/\D/g, "");
    if (!code) { setNaicsInput(""); return; }
    if (!isValidNaics(code)) {
      setNaicsError("NAICS codes must be 2 to 6 digits.");
      return;
    }
    if (naicsCodes.includes(code)) {
      setNaicsError("Already added.");
      setNaicsInput("");
      return;
    }
    setNaicsCodes(prev => [...prev, code]);
    setNaicsInput("");
    setNaicsError(null);
    markDirty();
  }

  function removeNaics(code: string) {
    setNaicsCodes(prev => prev.filter(c => c !== code));
    markDirty();
  }

  function addPsc() {
    const code = pscInput.trim().toUpperCase();
    if (!code) { setPscInput(""); return; }
    if (pscCodes.includes(code)) {
      setPscInput("");
      return;
    }
    setPscCodes(prev => [...prev, code]);
    setPscInput("");
    markDirty();
  }

  function removePsc(code: string) {
    setPscCodes(prev => prev.filter(c => c !== code));
    markDirty();
  }

  function toggleState(st: string) {
    setSelectedStates(prev =>
      prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
    );
    markDirty();
  }

  function addKeyword() {
    const kw = keywordInput.trim().toLowerCase();
    if (!kw || keywords.includes(kw)) { setKeywordInput(""); return; }
    if (keywords.length >= MAX_KEYWORDS) {
      setError(`Max ${MAX_KEYWORDS} keywords allowed.`);
      return;
    }
    setKeywords(prev => [...prev, kw]);
    setKeywordInput("");
    markDirty();
  }
  
  function addExcludeKeyword() {
    const kw = excludeInput.trim().toLowerCase();
    if (!kw || excludeKeywords.includes(kw)) { setExcludeInput(""); return; }
    if (excludeKeywords.length >= MAX_KEYWORDS) {
      setError(`Max ${MAX_KEYWORDS} exclude keywords allowed.`);
      return;
    }
    setExcludeKeywords(prev => [...prev, kw]);
    setExcludeInput("");
    markDirty();
  }

  function toggleSetAside(val: string) {
    if (val === "none") {
      setSetAsides(["none"]);
      markDirty();
      return;
    }
    setSetAsides(prev => {
      let next = prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val];
      next = next.filter(v => v !== "none");
      return next;
    });
    markDirty();
  }

  /* Track original NAICS codes loaded from DB */
  const [originalNaicsCodes, setOriginalNaicsCodes] = useState<string[]>([]);

  /* ─── Save ────────────────────────────────────────────────── */
  async function handleSave() {
    if (!userId) return;
    if (naicsInput.trim()) addNaics();
    if (pscInput.trim()) addPsc();
    if (keywordInput.trim()) addKeyword();
    if (excludeInput.trim()) addExcludeKeyword();
    
    setSaving(true);
    setError(null);
    
    const finalSetAsides = setAsides.includes("none") ? [] : setAsides;

    const { error: err } = await supabase
      .from("profiles")
      .update({
        company_name:             companyName.trim() || null,
        naics_codes:              naicsCodes,
        psc_codes:                pscCodes,
        states:                   selectedStates,
        keywords:                 keywords,
        exclude_keywords:         excludeKeywords,
        email_frequency:          frequency,
        set_aside_preferences:    finalSetAsides,
        min_value:                minValue ? parseInt(minValue, 10) : null,
        max_value:                maxValue ? parseInt(maxValue, 10) : null,
        updated_at:               new Date().toISOString(),
      })
      .eq("id", userId);
    setSaving(false);
    if (err) {
      setError("Failed to save. " + (err.message || "Please try again."));
    } else {
      setSaved(true);
      setIsDirty(false);
      setTimeout(() => setSaved(false), 3500);

      // Profile changes take effect on the next scheduled pipeline run
      // (runs twice daily at 11:00 + 18:00 UTC). No on-demand rematch.

      // Trigger forecast cold start for any newly added NAICS codes
      const newCodes = naicsCodes.filter(c => !originalNaicsCodes.includes(c));
      if (newCodes.length > 0) {
        fetch("/api/forecasts/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ naics_codes: newCodes }),
        }).catch(e => console.error("Forecast trigger error:", e));
      }

      // Update the baseline so subsequent saves only trigger for truly new codes
      setOriginalNaicsCodes([...naicsCodes]);
    }
  }

  const completeness = getCompleteness(companyName, naicsCodes, selectedStates, keywords);
  const completenessColor =
    completeness.score === 100 ? "var(--success)"
    : completeness.score >= 60  ? "var(--accent)"
    :                              "var(--danger)";

  if (loading) {
    return (
      <div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw size={20} style={{ color: "var(--app-muted)", animation: "spin 0.8s linear infinite" }} aria-label="Loading profile…" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dash-main" style={{ maxWidth: 800 }}>

      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Profile Settings</h1>
          <p className="dash-page-sub">
            Configure your NAICS codes, PSC codes, states, keywords, and alert preferences.
          </p>
        </div>

        {/* Completeness indicator */}
        <div style={{ minWidth: 160, textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "0.72rem", color: "var(--app-muted)" }}>Profile completeness</span>
            <span style={{ fontSize: "0.72rem", color: completenessColor, fontWeight: 700 }}>
              {completeness.score}% · {completeness.label}
            </span>
          </div>
          <div className="dash-progress-track">
            <div className="dash-progress-fill" style={{ width: `${completeness.score}%`, background: completenessColor }} />
          </div>
          {completeness.missing.length > 0 && (
            <p style={{ fontSize: "0.68rem", color: "var(--app-faint)", marginTop: "3px", textAlign: "right" }}>
              Missing: {completeness.missing.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="dash-alert-error" role="alert" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Unsaved changes warning */}
      {isDirty && (
        <div className="dash-alert-warning" style={{ marginBottom: "1rem", fontSize: "0.8rem" }}>
          <AlertCircle size={13} aria-hidden="true" />
          You have unsaved changes. Scroll down and click Save Changes.
        </div>
      )}

      {/* Company name */}
      <div className="dash-section">
        <h2 className="dash-section-h">Company</h2>
        <label htmlFor="company-name" className="dash-label">Company Name</label>
        <input
          id="company-name"
          type="text"
          value={companyName}
          onChange={e => { setCompanyName(e.target.value); markDirty(); }}
          placeholder="Acme Federal Solutions LLC"
          className="dash-input-lg"
          autoComplete="organization"
        />
      </div>

      {/* NAICS codes */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span>NAICS Codes</span>
          <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", fontWeight: 400 }}>
            {naicsCodes.length} added
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
          Enter 2 to 6 digit NAICS codes that describe your business. The engine matches contracts using these codes.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="naics-input" className="sr-only">Add NAICS code</label>
            <input
              id="naics-input"
              type="text"
              inputMode="numeric"
              value={naicsInput}
              onChange={e => { setNaicsInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setNaicsError(null); }}
              onKeyDown={e => e.key === "Enter" && addNaics()}
              placeholder="e.g. 541512"
              className="dash-input-lg"
              maxLength={6}
              aria-describedby={naicsError ? "naics-error" : undefined}
            />
          </div>
          <button className="dash-btn dash-btn-primary" onClick={addNaics} style={{ padding: "0 1rem", minHeight: 42, gap: 4 }}>
            <Plus size={13} aria-hidden="true" /> Add
          </button>
        </div>
        {naicsError && (
          <p id="naics-error" role="alert" style={{ fontSize: "0.78rem", color: "var(--danger)", margin: "0 0 0.5rem" }}>
            {naicsError}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="list">
          {naicsCodes.map(code => (
            <span key={code} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--accent-subtle)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "3px 10px", fontSize: "0.8rem", fontFamily: "var(--font-geist-mono, monospace)", color: "var(--accent)" }}>
              {code}
              <button onClick={() => removeNaics(code)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", padding: 0, display: "flex", lineHeight: 1 }}>
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          ))}
          {naicsCodes.length === 0 && <span style={{ color: "var(--app-faint)", fontSize: "0.85rem" }}>No NAICS codes added yet.</span>}
        </div>
      </div>

      {/* PSC Codes */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span>Product &amp; Service Codes (PSC)</span>
          <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", fontWeight: 400 }}>
            {pscCodes.length} added
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
          Enter 4-character Product Service Codes (e.g. D302, 1005). Optional, but highly recommended for precision.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <input
              type="text"
              value={pscInput}
              onChange={e => setPscInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && addPsc()}
              placeholder="e.g. D302"
              className="dash-input-lg uppercase"
            />
          </div>
          <button className="dash-btn dash-btn-primary" onClick={addPsc} style={{ padding: "0 1rem", minHeight: 42, gap: 4 }}>
            <Plus size={13} aria-hidden="true" /> Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="list">
          {pscCodes.map(code => (
            <span key={code} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--accent-subtle)", border: "1px solid var(--accent-border)", borderRadius: 999, padding: "3px 10px", fontSize: "0.8rem", fontFamily: "var(--font-geist-mono, monospace)", color: "var(--accent)" }}>
              {code}
              <button onClick={() => removePsc(code)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", padding: 0, display: "flex", lineHeight: 1 }}>
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          ))}
          {pscCodes.length === 0 && <span style={{ color: "var(--app-faint)", fontSize: "0.85rem" }}>No PSC codes added yet.</span>}
        </div>
      </div>

      {/* Target Value Range */}
      <div className="dash-section">
        <h2 className="dash-section-h">Target Contract Value</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
          Optional. Filter out contracts that are too small or too large. Leave blank for unrestricted.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--app-faint)" }}>$</span>
            <input
              type="number"
              value={minValue}
              onChange={(e) => { setMinValue(e.target.value); markDirty(); }}
              placeholder="Min value (e.g. 25000)"
              className="dash-input-lg"
              style={{ paddingLeft: "28px" }}
            />
          </div>
          <span style={{ color: "var(--app-muted)", fontSize: "0.9rem" }}>to</span>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--app-faint)" }}>$</span>
            <input
              type="number"
              value={maxValue}
              onChange={(e) => { setMaxValue(e.target.value); markDirty(); }}
              placeholder="Max value (e.g. 5000000)"
              className="dash-input-lg"
              style={{ paddingLeft: "28px" }}
            />
          </div>
        </div>
      </div>

      {/* States */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span>States to Monitor</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", fontWeight: 400 }}>
              {selectedStates.length} / {US_STATES.length} selected
            </span>
            <button className="dash-pill" onClick={() => { setSelectedStates(US_STATES as unknown as string[]); markDirty(); }} style={{ fontSize: "0.68rem", padding: "2px 8px" }}>All</button>
            <button className="dash-pill" onClick={() => { setSelectedStates([]); markDirty(); }} style={{ fontSize: "0.68rem", padding: "2px 8px" }}>Clear</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(55px, 1fr))", gap: "0.375rem" }}>
          {US_STATES.map(st => {
            const active = selectedStates.includes(st);
            return (
              <button
                key={st}
                onClick={() => toggleState(st)}
                style={{
                  padding: "5px 4px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: active ? 700 : 400,
                  cursor: "pointer", border: `1px solid ${active ? "var(--accent-border)" : "var(--app-border)"}`,
                  background: active ? "var(--accent-subtle)" : "var(--app-surface-2)", color: active ? "var(--accent)" : "var(--app-muted)",
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Positive Keywords */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span>Positive Keywords</span>
          <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", fontWeight: 400 }}>{keywords.length} / {MAX_KEYWORDS}</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addKeyword()} placeholder="e.g. cybersecurity" className="dash-input-lg" disabled={keywords.length >= MAX_KEYWORDS} />
          </div>
          <button className="dash-btn dash-btn-primary" onClick={addKeyword} disabled={keywords.length >= MAX_KEYWORDS} style={{ padding: "0 1rem", minHeight: 42, gap: 4 }}>
            <Plus size={13} /> Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {keywords.map(kw => (
            <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: 999, padding: "3px 10px", fontSize: "0.8rem", color: "var(--app-text)" }}>
              {kw}
              <button onClick={() => { setKeywords(k => k.filter(x => x !== kw)); markDirty(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--app-faint)" }}><X size={11} /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Negative Keywords */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span style={{ color: "var(--danger)" }}>Negative Keywords</span>
          <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", fontWeight: 400 }}>{excludeKeywords.length} / {MAX_KEYWORDS}</span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
          Exclude contracts containing these words (e.g. "hardware"). Highly recommended to eliminate false positives.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <input type="text" value={excludeInput} onChange={e => setExcludeInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addExcludeKeyword()} placeholder="e.g. cleaning" className="dash-input-lg" disabled={excludeKeywords.length >= MAX_KEYWORDS} />
          </div>
          <button className="dash-btn" onClick={addExcludeKeyword} disabled={excludeKeywords.length >= MAX_KEYWORDS} style={{ padding: "0 1rem", minHeight: 42, gap: 4 }}>
            <Plus size={13} /> Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {excludeKeywords.map(kw => (
            <span key={kw} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--danger-subtle)", border: "1px solid rgba(194,59,59,0.2)", borderRadius: 999, padding: "3px 10px", fontSize: "0.8rem", color: "var(--danger)" }}>
              {kw}
              <button onClick={() => { setExcludeKeywords(k => k.filter(x => x !== kw)); markDirty(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }}><X size={11} /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Set-aside preferences */}
      <div className="dash-section">
        <h2 className="dash-section-h">Set-Aside Preferences</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {SET_ASIDES.map(({ value, label }) => {
            const active = value === "none" ? (setAsides.length === 0 || setAsides.includes("none")) : setAsides.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleSetAside(value)}
                className="dash-pill"
                style={{
                  fontSize: "0.8rem", padding: "6px 12px",
                  background: active ? "var(--accent-subtle)" : undefined,
                  borderColor: active ? "var(--accent-border)" : undefined,
                  color: active ? "var(--accent)" : undefined, fontWeight: active ? 600 : undefined,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingBottom: "1.5rem" }}>
        <button
          className="dash-btn dash-btn-primary"
          onClick={handleSave}
          disabled={saving || (!isDirty && !saved)}
          style={{ padding: "0.75rem 2rem", minHeight: 44, fontSize: "0.9375rem", gap: 6 }}
        >
          {saving ? <><RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</> : saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
        {saved && (
          <span style={{ color: "var(--success)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle size={14} /> Profile saved. Updated matches will appear on the next scheduled check.
          </span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
