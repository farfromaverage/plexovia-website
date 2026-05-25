"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Save, CheckCircle, AlertCircle, Plus, X, RefreshCw, User } from "lucide-react";
import ProfileChip from "../components/ProfileChip";
import FedOrgSelector from "../components/FedOrgSelector";

/* ─── Constants ──────────────────────────────────────────── */
const MAX_KEYWORDS = 30;

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const SET_ASIDES = [
  { value: "SB",       label: "Small Business" },
  { value: "8A",       label: "8(a) Business Development" },
  { value: "WOSB",     label: "Women-Owned Small Business (WOSB)" },
  { value: "SDVOSB",   label: "Service-Disabled Veteran-Owned (SDVOSB)" },
  { value: "HUBZONE",  label: "HUBZone" },
  { value: "IEE",      label: "Indian Economic Enterprise" },
  { value: "BICIV",    label: "Buy Indian Act" },
  { value: "VETERAN",  label: "Veteran-Owned Small Business (VOSB)" },
  { value: "LAS",      label: "Local Area Set-Aside" },
];

/* ─── Profile type ───────────────────────────────────────── */
interface ProfileData {
  id: string;
  naics_codes: string[] | null;
  psc_codes: string[] | null;
  states: string[] | null;
  keywords: string[] | null;
  exclude_keywords: string[] | null;
  email_frequency: string | null;
  set_aside_preferences: string[] | null;
  fed_org_prefs: string[] | null;
}

/* ─── NAICS validation ───────────────────────────────────── */
function isValidNaics(code: string): boolean {
  return /^\d{2,6}$/.test(code);
}

/* ─── Completeness score ─────────────────────────────────── */
function getCompleteness(
  naics: string[], states: string[], keywords: string[]
): { score: number; label: string; missing: string[] } {
  const missing: string[] = [];
  let score = 0;
  if (naics.length > 0) score += 40; else missing.push("At least one NAICS code");
  if (states.length > 0) score += 35; else missing.push("At least one state");
  if (keywords.length > 0) score += 25; else missing.push("Keywords (optional)");
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

  const [fedOrgs,            setFedOrgs]            = useState<string[]>([]);
  const [fedOrgList,         setFedOrgList]         = useState<{code: string; name: string}[]>([]);

  const [originalNaicsCodes, setOriginalNaicsCodes] = useState<string[]>([]);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }
    setUserId(user.id);
    setUserEmail(user.email ?? null);

    const { data, error: err } = await supabase
      .from("profiles")
      .select("id,naics_codes,psc_codes,states,keywords,exclude_keywords,email_frequency,set_aside_preferences,fed_org_prefs")
      .eq("id", user.id)
      .single();

    if (err) {
      setError("Could not load your profile.");
    } else if (data) {
      const d = data as ProfileData;
      setNaicsCodes(d.naics_codes ?? []);
      setOriginalNaicsCodes(d.naics_codes ?? []);
      setPscCodes(d.psc_codes ?? []);
      setSelectedStates(d.states ?? []);
      setKeywords(d.keywords ?? []);
      setExcludeKeywords(d.exclude_keywords ?? []);
      setFrequency(d.email_frequency ?? "daily");
      setSetAsides(d.set_aside_preferences ?? []);
      setFedOrgs(d.fed_org_prefs ?? []);
    }
    setLoading(false);
    setIsDirty(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Fetch available federal organization list from backend
  useEffect(() => {
    fetch("/api/onboarding/first-login")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.organizations) setFedOrgList(d.organizations); })
      .catch(() => {});
  }, []);

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
    setSetAsides(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
    markDirty();
  }

  /* ─── Save ────────────────────────────────────────────────── */
  async function handleSave() {
    if (!userId) return;
    if (naicsInput.trim()) addNaics();
    if (pscInput.trim()) addPsc();
    if (keywordInput.trim()) addKeyword();
    if (excludeInput.trim()) addExcludeKeyword();
    
    setSaving(true);
    setError(null);
    
    const { error: err } = await supabase
      .from("profiles")
      .update({
        naics_codes:              naicsCodes,
        psc_codes:                pscCodes,
        states:                   selectedStates,
        keywords:                 keywords,
        exclude_keywords:         excludeKeywords,
        email_frequency:          frequency,
        set_aside_preferences:    setAsides,
        fed_org_prefs:            fedOrgs,
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

  const completeness = getCompleteness(naicsCodes, selectedStates, keywords);
  const completenessColor =
    completeness.score === 100 ? "var(--success)"
    : completeness.score >= 60  ? "var(--accent)"
    :                              "var(--danger)";

  if (loading) {
    return (
      <div className="dash-main" style={{ maxWidth: 800 }}>
        <div className="dash-page-header">
          <div>
            <div className="dash-skeleton" style={{ width: 180, height: 24, marginBottom: 8 }} />
            <div className="dash-skeleton" style={{ width: 300, height: 14 }} />
          </div>
        </div>
        <div className="dash-skeleton" style={{ width: "100%", height: 56, borderRadius: "var(--radius-md)", marginBottom: "var(--space-5)" }} />
        <div className="dash-skeleton" style={{ width: "100%", height: 32, borderRadius: "var(--radius-md)", marginBottom: "var(--space-5)" }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="dash-profile-section" style={{ opacity: 0.6 }}>
            <div className="dash-skeleton" style={{ width: 200, height: 16, marginBottom: 12 }} />
            <div className="dash-skeleton" style={{ width: "100%", height: 42, marginBottom: 8 }} />
            <div className="dash-skeleton" style={{ width: "60%", height: 12 }} />
          </div>
        ))}
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
      </div>

      {/* Identity card */}
      {userId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          style={{
            background: "var(--app-surface)",
            border: "1px solid var(--app-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4) var(--space-5)",
            marginBottom: "var(--space-5)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            flexWrap: "wrap",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "var(--accent-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <User size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--app-text)", margin: 0 }}>
              {userEmail || "Account"}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: "2px 0 0" }}>
              Your matching preferences control which federal contracts you see.
            </p>
          </div>
        </motion.div>
      )}

      {/* Completeness banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        style={{
          background: completeness.score === 100
            ? "var(--success-subtle)"
            : completeness.score >= 60
              ? "var(--accent-subtle)"
              : "var(--danger-subtle)",
          border: `1px solid ${
            completeness.score === 100
              ? "rgba(26, 119, 66, 0.2)"
              : completeness.score >= 60
                ? "var(--accent-border)"
                : "rgba(194, 59, 59, 0.2)"
          }`,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-3) var(--space-5)",
          marginBottom: "var(--space-5)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: completenessColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ color: "#FFF", fontSize: "0.625rem", fontWeight: 800 }}>
            {completeness.score}%
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--app-text)", margin: 0 }}>
            Profile {completeness.score === 100 ? "Complete" : completeness.score >= 60 ? "Good — almost there" : "Needs setup"}
          </p>
          {completeness.missing.length > 0 && (
            <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: "2px 0 0" }}>
              Add: {completeness.missing.join(" · ")}
            </p>
          )}
        </div>
        <div className="dash-progress-track" style={{ width: 120, flexShrink: 0 }}>
          <div className="dash-progress-fill" style={{ width: `${completeness.score}%`, background: completenessColor }} />
        </div>
      </motion.div>

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

      {/* NAICS Codes */}
      <motion.div
        className="dash-profile-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.10, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="dash-profile-section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className="dash-profile-section-title">NAICS Codes</span>
            <span style={{
              fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase",
              color: "var(--danger)", letterSpacing: "0.06em",
              background: "var(--danger-subtle)", padding: "2px 6px", borderRadius: 4,
            }}>Required</span>
          </div>
          <span className="dash-profile-section-badge">{naicsCodes.length} added</span>
        </div>
        <p className="dash-profile-section-desc">
          Enter 2 to 6 digit NAICS codes that describe your business. These determine which contracts you see.
        </p>
        <div className="dash-profile-input-row">
          <label htmlFor="naics-input" className="sr-only">Add NAICS code</label>
          <input
            id="naics-input" type="text" inputMode="numeric"
            value={naicsInput}
            onChange={e => { setNaicsInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setNaicsError(null); }}
            onKeyDown={e => e.key === "Enter" && addNaics()}
            placeholder="e.g. 541512"
            className="dash-input-lg"
            maxLength={6}
            aria-describedby={naicsError ? "naics-error" : undefined}
          />
          <button className="dash-btn dash-btn-primary" onClick={addNaics} style={{ minHeight: 42 }}>
            <Plus size={14} aria-hidden="true" /> Add
          </button>
        </div>
        {naicsError && (
          <p id="naics-error" role="alert" style={{ fontSize: "0.78rem", color: "var(--danger)", margin: "0 0 var(--space-2)" }}>
            {naicsError}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <AnimatePresence>
            {naicsCodes.map(code => (
              <ProfileChip key={code} label={code} onRemove={() => removeNaics(code)} variant="accent" monospace />
            ))}
          </AnimatePresence>
          {naicsCodes.length === 0 && (
            <span style={{ color: "var(--app-faint)", fontSize: "0.8125rem", padding: "var(--space-2) 0" }}>No NAICS codes added yet. Required for contract matching.</span>
          )}
        </div>
      </motion.div>

      {/* PSC Codes */}
      <motion.div
        className="dash-profile-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="dash-profile-section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className="dash-profile-section-title">Product &amp; Service Codes (PSC)</span>
            <span style={{
              fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase",
              color: "var(--app-muted)", letterSpacing: "0.06em",
              background: "var(--app-surface-2)", padding: "2px 6px", borderRadius: 4,
            }}>Recommended</span>
          </div>
          <span className="dash-profile-section-badge">{pscCodes.length} added</span>
        </div>
        <p className="dash-profile-section-desc">
          4-character Product Service Codes for higher match precision. Optional but recommended.
        </p>
        <div className="dash-profile-input-row">
          <input
            type="text" value={pscInput}
            onChange={e => setPscInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && addPsc()}
            placeholder="e.g. D302"
            className="dash-input-lg"
          />
          <button className="dash-btn dash-btn-primary" onClick={addPsc} style={{ minHeight: 42 }}>
            <Plus size={14} aria-hidden="true" /> Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <AnimatePresence>
            {pscCodes.map(code => (
              <ProfileChip key={code} label={code} onRemove={() => removePsc(code)} variant="accent" monospace />
            ))}
          </AnimatePresence>
          {pscCodes.length === 0 && (
            <span style={{ color: "var(--app-faint)", fontSize: "0.8125rem", padding: "var(--space-2) 0" }}>No PSC codes added yet. Optional precision filter.</span>
          )}
        </div>
      </motion.div>

      {/* Federal Organizations */}
      <motion.div
        className="dash-profile-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="dash-profile-section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className="dash-profile-section-title">Federal Organizations</span>
            <span style={{
              fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase",
              color: "var(--app-muted)", letterSpacing: "0.06em",
              background: "var(--app-surface-2)", padding: "2px 6px", borderRadius: 4,
            }}>Recommended</span>
          </div>
          <span className="dash-profile-section-badge">{fedOrgs.length} selected</span>
        </div>
        <p className="dash-profile-section-desc">
          Prioritize contracts from specific agencies. Matched agencies receive a score bonus.
        </p>
        {fedOrgs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--space-3)" }}>
            <AnimatePresence>
              {fedOrgs.map((code) => {
                const org = fedOrgList.find(o => o.code === code);
                return (
                  <ProfileChip
                    key={code} label={code}
                    subLabel={org ? org.name.substring(0, 20) : undefined}
                    onRemove={() => { setFedOrgs(prev => prev.filter(a => a !== code)); markDirty(); }}
                    variant="accent" monospace
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
        <FedOrgSelector
          selected={fedOrgs}
          onToggle={(code) => {
            if (fedOrgs.includes(code)) setFedOrgs(prev => prev.filter(c => c !== code));
            else setFedOrgs(prev => [...prev, code]);
            markDirty();
          }}
          orgList={fedOrgList}
        />
        {fedOrgs.length === 0 && (
          <span style={{ color: "var(--app-faint)", fontSize: "0.8125rem", padding: "var(--space-2) 0" }}>No agencies selected. All agencies treated equally.</span>
        )}
      </motion.div>

      {/* States */}
      <motion.div
        className="dash-profile-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="dash-profile-section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className="dash-profile-section-title">States to Monitor</span>
            <span style={{
              fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase",
              color: "var(--danger)", letterSpacing: "0.06em",
              background: "var(--danger-subtle)", padding: "2px 6px", borderRadius: 4,
            }}>Required</span>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <span className="dash-profile-section-badge">{selectedStates.length} / {US_STATES.length}</span>
            <button className="dash-pill" onClick={() => { setSelectedStates([...US_STATES]); markDirty(); }} style={{ fontSize: "0.6875rem" }}>Select All</button>
            <button className="dash-pill" onClick={() => { setSelectedStates([]); markDirty(); }} style={{ fontSize: "0.6875rem" }}>Clear</button>
          </div>
        </div>
        <div className="dash-profile-state-grid">
          {US_STATES.map(st => {
            const active = selectedStates.includes(st);
            return (
              <button
                key={st}
                className="dash-profile-state-btn"
                data-active={active ? "true" : undefined}
                onClick={() => toggleState(st)}
                title={st}
              >{st}</button>
            );
          })}
        </div>
      </motion.div>

      {/* Positive Keywords */}
      <motion.div
        className="dash-profile-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="dash-profile-section-header">
          <span className="dash-profile-section-title">Positive Keywords</span>
          <span className="dash-profile-section-badge">{keywords.length} / {MAX_KEYWORDS}</span>
        </div>
        <div className="dash-profile-input-row">
          <input
            type="text" value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addKeyword()}
            placeholder="e.g. cybersecurity"
            className="dash-input-lg"
            disabled={keywords.length >= MAX_KEYWORDS}
          />
          <button className="dash-btn dash-btn-primary" onClick={addKeyword} disabled={keywords.length >= MAX_KEYWORDS} style={{ minHeight: 42 }}>
            <Plus size={14} /> Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <AnimatePresence>
            {keywords.map(kw => (
              <ProfileChip key={kw} label={kw} onRemove={() => { setKeywords(k => k.filter(x => x !== kw)); markDirty(); }} variant="neutral" />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Negative Keywords */}
      <motion.div
        className="dash-profile-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.40, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="dash-profile-section-header">
          <span className="dash-profile-section-title" style={{ color: "var(--danger)" }}>Negative Keywords</span>
          <span className="dash-profile-section-badge">{excludeKeywords.length} / {MAX_KEYWORDS}</span>
        </div>
        <p className="dash-profile-section-desc">
          Exclude contracts containing these words to eliminate false positives.
        </p>
        <div className="dash-profile-input-row">
          <input
            type="text" value={excludeInput}
            onChange={e => setExcludeInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addExcludeKeyword()}
            placeholder="e.g. cleaning"
            className="dash-input-lg"
            disabled={excludeKeywords.length >= MAX_KEYWORDS}
          />
          <button className="dash-btn" onClick={addExcludeKeyword} disabled={excludeKeywords.length >= MAX_KEYWORDS} style={{ minHeight: 42 }}>
            <Plus size={14} /> Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <AnimatePresence>
            {excludeKeywords.map(kw => (
              <ProfileChip key={kw} label={kw} onRemove={() => { setExcludeKeywords(k => k.filter(x => x !== kw)); markDirty(); }} variant="danger" />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Set-Aside Preferences */}
      <motion.div
        className="dash-profile-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="dash-profile-section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className="dash-profile-section-title">Set-Aside Preferences</span>
            <span style={{
              fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase",
              color: "var(--app-muted)", letterSpacing: "0.06em",
              background: "var(--app-surface-2)", padding: "2px 6px", borderRadius: 4,
            }}>Recommended</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {SET_ASIDES.map(({ value, label }) => {
            const active = setAsides.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleSetAside(value)}
                className="dash-pill"
                aria-pressed={active}
                style={{ fontSize: "0.8rem", padding: "6px 14px" }}
              >{label}</button>
            );
          })}
        </div>
      </motion.div>

      {/* Save */}
      <div className="dash-profile-save-bar">
        <motion.button
          className="dash-profile-save-btn"
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
        >
          {saving ? (
            <><RefreshCw size={16} className="dash-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle size={16} /> Saved</>
          ) : (
            <><Save size={16} /> Save Changes</>
          )}
        </motion.button>
        <AnimatePresence>
          {saved && (
            <motion.span
              className="dash-profile-save-success"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              Profile saved. Changes take effect at the next scheduled pipeline run (daily at 11:00 + 18:00 UTC).
            </motion.span>
          )}
        </AnimatePresence>
        {isDirty && !saved && (
          <span style={{ fontSize: "0.8125rem", color: "var(--app-muted)" }}>
            You have unsaved changes.
          </span>
        )}
      </div>
    </div>
  );
}
