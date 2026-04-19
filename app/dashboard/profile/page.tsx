"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, CheckCircle, AlertCircle, Plus, X, RefreshCw } from "lucide-react";

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
  states: string[] | null;
  keywords: string[] | null;
  alert_frequency: string | null;
  set_aside_preferences: string[] | null;
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
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [keywords,      setKeywords]      = useState<string[]>([]);
  const [keywordInput,  setKeywordInput]  = useState("");
  const [frequency,     setFrequency]     = useState("daily");
  const [setAsides,     setSetAsides]     = useState<string[]>([]);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    setUserId(user.id);
    setUserEmail(user.email ?? null);

    const { data, error: err } = await supabase
      .from("profiles")
      .select("id,company_name,naics_codes,states,keywords,alert_frequency,set_aside_preferences")
      .eq("id", user.id)
      .single();

    if (err) {
      setError("Could not load your profile.");
    } else if (data) {
      const d = data as ProfileData;
      setCompanyName(d.company_name ?? "");
      setNaicsCodes(d.naics_codes ?? []);
      setSelectedStates(d.states ?? []);
      setKeywords(d.keywords ?? []);
      setFrequency(d.alert_frequency ?? "daily");
      setSetAsides(d.set_aside_preferences ?? []);
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

  function toggleSetAside(val: string) {
    setSetAsides(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
    markDirty();
  }

  /* ─── Save ────────────────────────────────────────────────── */
  async function handleSave() {
    if (!userId) return;
    if (naicsInput.trim()) {
      // Commit pending NAICS before save
      addNaics();
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        company_name:             companyName.trim() || null,
        naics_codes:              naicsCodes,
        states:                   selectedStates,
        keywords:                 keywords,
        alert_frequency:          frequency,
        set_aside_preferences:    setAsides,
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
    }
  }

  const completeness = getCompleteness(companyName, naicsCodes, selectedStates, keywords);
  const completenessColor =
    completeness.score === 100 ? "#4ADE80"
    : completeness.score >= 60  ? "var(--accent)"
    :                              "#F87171";

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
            Configure your NAICS codes, states, keywords, and alert preferences.
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

      {/* Account email (read-only from auth) */}
      {userEmail && (
        <div className="dash-alert-warning" style={{ marginBottom: "1.25rem", fontSize: "0.8rem" }}>
          <AlertCircle size={13} aria-hidden="true" />
          <span>
            Account email: <strong>{userEmail}</strong>.
            System notifications (billing, trial reminders) are sent to this address.
          </span>
        </div>
      )}

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
          <button
            className="dash-btn dash-btn-primary"
            onClick={addNaics}
            style={{ padding: "0 1rem", minHeight: 42, gap: 4 }}
            aria-label="Add NAICS code"
          >
            <Plus size={13} aria-hidden="true" /> Add
          </button>
        </div>
        {naicsError && (
          <p id="naics-error" role="alert" style={{ fontSize: "0.78rem", color: "#F87171", margin: "0 0 0.5rem" }}>
            {naicsError}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="list" aria-label="Added NAICS codes">
          {naicsCodes.map(code => (
            <span
              key={code}
              role="listitem"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: 999, padding: "3px 10px",
                fontSize: "0.8rem", fontFamily: "var(--font-geist-mono, monospace)",
                color: "var(--accent)",
              }}
            >
              {code}
              <button
                onClick={() => removeNaics(code)}
                aria-label={`Remove NAICS code ${code}`}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", padding: 0, display: "flex", lineHeight: 1 }}
              >
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          ))}
          {naicsCodes.length === 0 && (
            <span style={{ color: "var(--app-faint)", fontSize: "0.85rem" }}>No NAICS codes added yet.</span>
          )}
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
            <button
              className="dash-pill"
              onClick={() => { setSelectedStates(US_STATES as unknown as string[]); markDirty(); }}
              aria-label="Select all states"
              style={{ fontSize: "0.68rem", padding: "2px 8px" }}
            >
              All
            </button>
            <button
              className="dash-pill"
              onClick={() => { setSelectedStates([]); markDirty(); }}
              aria-label="Clear all states"
              style={{ fontSize: "0.68rem", padding: "2px 8px" }}
            >
              Clear
            </button>
          </div>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(55px, 1fr))", gap: "0.375rem" }}
          role="group"
          aria-label="Select states to monitor"
        >
          {US_STATES.map(st => {
            const active = selectedStates.includes(st);
            return (
              <button
                key={st}
                onClick={() => toggleState(st)}
                aria-pressed={active}
                aria-label={STATE_NAMES[st] ?? st}
                title={STATE_NAMES[st]}
                style={{
                  padding: "5px 4px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: active ? 700 : 400,
                  cursor: "pointer",
                  border: `1px solid ${active ? "rgba(201,168,76,0.5)" : "var(--app-border)"}`,
                  background: active ? "rgba(201,168,76,0.1)" : "var(--app-surface-2)",
                  color: active ? "var(--accent)" : "var(--app-muted)",
                  transition: "all 0.1s",
                  textAlign: "center",
                  fontFamily: "inherit",
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Keywords */}
      <div className="dash-section">
        <div className="dash-section-h">
          <span>Keywords</span>
          <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", fontWeight: 400 }}>
            {keywords.length} / {MAX_KEYWORDS}
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
          Optional. The engine also searches contract titles for these keywords.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="keyword-input" className="sr-only">Add keyword</label>
            <input
              id="keyword-input"
              type="text"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addKeyword()}
              placeholder="e.g. cybersecurity"
              className="dash-input-lg"
              disabled={keywords.length >= MAX_KEYWORDS}
            />
          </div>
          <button
            className="dash-btn dash-btn-primary"
            onClick={addKeyword}
            disabled={keywords.length >= MAX_KEYWORDS}
            style={{ padding: "0 1rem", minHeight: 42, gap: 4 }}
            aria-label="Add keyword"
          >
            <Plus size={13} aria-hidden="true" /> Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="list" aria-label="Added keywords">
          {keywords.map(kw => (
            <span
              key={kw}
              role="listitem"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "var(--app-surface-2)", border: "1px solid var(--app-border)",
                borderRadius: 999, padding: "3px 10px",
                fontSize: "0.8rem", color: "var(--app-muted)",
              }}
            >
              {kw}
              <button
                onClick={() => { setKeywords(k => k.filter(x => x !== kw)); markDirty(); }}
                aria-label={`Remove keyword ${kw}`}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--app-faint)", padding: 0, display: "flex", lineHeight: 1 }}
              >
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          ))}
          {keywords.length === 0 && (
            <span style={{ color: "var(--app-faint)", fontSize: "0.85rem" }}>No keywords added yet.</span>
          )}
        </div>
      </div>

      {/* Set-aside preferences */}
      <div className="dash-section">
        <h2 className="dash-section-h">Set-Aside Preferences</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "0 0 0.875rem", lineHeight: 1.5 }}>
          Select applicable set-aside designations to weight contract matching towards contracts you're eligible in.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }} role="group" aria-label="Set-aside preferences">
          {SET_ASIDES.map(({ value, label }) => {
            const active = setAsides.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleSetAside(value)}
                aria-pressed={active}
                className="dash-pill"
                style={{
                  fontSize: "0.8rem",
                  padding: "6px 12px",
                  background: active ? "rgba(201,168,76,0.1)" : undefined,
                  borderColor: active ? "rgba(201,168,76,0.4)" : undefined,
                  color: active ? "var(--accent)" : undefined,
                  fontWeight: active ? 600 : undefined,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert frequency */}
      <div className="dash-section">
        <h2 className="dash-section-h">Alert Frequency</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }} role="group" aria-label="Alert frequency">
          {["daily", "weekly"].map(f => (
            <button
              key={f}
              onClick={() => { setFrequency(f); markDirty(); }}
              aria-pressed={frequency === f}
              className="dash-pill"
              style={{
                padding: "8px 20px", fontSize: "0.875rem",
                background: frequency === f ? "rgba(201,168,76,0.1)" : undefined,
                borderColor: frequency === f ? "rgba(201,168,76,0.4)" : undefined,
                color: frequency === f ? "var(--accent)" : undefined,
                fontWeight: frequency === f ? 700 : undefined,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--app-muted)" }}>
          {frequency === "daily"
            ? "New matches appear in your dashboard every morning."
            : "Dashboard updated weekly with a full summary every Monday."}
        </p>
      </div>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingBottom: "2rem" }}>
        <button
          className="dash-btn dash-btn-primary"
          onClick={handleSave}
          disabled={saving || (!isDirty && !saved)}
          style={{ padding: "0.75rem 2rem", minHeight: 44, fontSize: "0.9375rem", gap: 6 }}
          aria-label="Save profile changes"
        >
          {saving ? (
            <><RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} aria-hidden="true" /> Saving…</>
          ) : saved ? (
            <><CheckCircle size={14} aria-hidden="true" /> Saved!</>
          ) : (
            <><Save size={14} aria-hidden="true" /> Save Changes</>
          )}
        </button>
        {saved && (
          <span role="status" style={{ color: "#4ADE80", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle size={14} aria-hidden="true" /> Changes saved successfully
          </span>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
