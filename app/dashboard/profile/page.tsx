"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Save, CheckCircle, AlertCircle, Plus, RefreshCw, User } from "lucide-react";
import ProfileChip from "../components/ProfileChip";
import FedOrgSelector, { type FedOrg } from "../components/FedOrgSelector";
import fedOrgData from "@/public/data/federal-organizations.json";

interface CodeEntry { code: string; title: string; }

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
  { value: "EDWOSB",   label: "Economically Disadvantaged WOSB (EDWOSB)" },
  { value: "SDVOSB",   label: "Service-Disabled Veteran-Owned (SDVOSB)" },
  { value: "HUBZONE",  label: "HUBZone" },
  { value: "VETERAN",  label: "Veteran-Owned Small Business (VOSB)" },
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
  const [fedOrgList,         setFedOrgList]         = useState<FedOrg[]>([]);

  /* Code reference data for autocomplete */
  const [naicsList,   setNaicsList]   = useState<CodeEntry[]>([]);
  const [pscList,     setPscList]     = useState<CodeEntry[]>([]);
  const [naicsDropdownOpen, setNaicsDropdownOpen] = useState(false);
  const [pscDropdownOpen,   setPscDropdownOpen]   = useState(false);
  const naicsInputRef = useRef<HTMLInputElement>(null);
  const pscInputRef   = useRef<HTMLInputElement>(null);
  const naicsDropdownRef = useRef<HTMLDivElement>(null);
  const pscDropdownRef   = useRef<HTMLDivElement>(null);

  /* Fetch code reference data on mount */
  useEffect(() => {
    fetch("/data/naics-2022.json")
      .then(r => r.json())
      .then((d: CodeEntry[]) => setNaicsList(d))
      .catch(() => {});
    fetch("/data/psc-codes.json")
      .then(r => r.json())
      .then((d: CodeEntry[]) => setPscList(d))
      .catch(() => {});
  }, []);

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
      setPscCodes(d.psc_codes ?? []);
      setSelectedStates(d.states ?? []);
      setKeywords(d.keywords ?? []);
      setExcludeKeywords(d.exclude_keywords ?? []);
      setFrequency(d.email_frequency ?? "daily");
      setSetAsides((d.set_aside_preferences ?? []).filter(c => SET_ASIDES.some(s => s.value === c)));
      setFedOrgs(d.fed_org_prefs ?? []);
    }
    setLoading(false);
    setIsDirty(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setFedOrgList(fedOrgData as FedOrg[]);
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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (naicsDropdownRef.current && !naicsDropdownRef.current.contains(e.target as Node) && naicsInputRef.current && !naicsInputRef.current.contains(e.target as Node)) {
        setNaicsDropdownOpen(false);
      }
      if (pscDropdownRef.current && !pscDropdownRef.current.contains(e.target as Node) && pscInputRef.current && !pscInputRef.current.contains(e.target as Node)) {
        setPscDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* Filtered code suggestions */
  interface CodeSuggestions {
    matches: CodeEntry[];
    isCustom: boolean;
    query: string;
  }
  const naicsSuggestions: CodeSuggestions = (() => {
    const q = naicsInput.trim().replace(/\D/g, "");
    if (!q) return { matches: [], isCustom: false, query: "" };
    const matches = naicsList.filter(n => n.code.startsWith(q) || n.title.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
    const isCustom = /^\d{2,6}$/.test(q) && !naicsList.some(n => n.code === q) && !naicsCodes.includes(q);
    return { matches, isCustom, query: q };
  })();

  const pscSuggestions = (() => {
    const q = pscInput.trim().toUpperCase();
    if (!q) return [];
    return pscList.filter(p => p.code.toUpperCase().startsWith(q) || p.title.toUpperCase().includes(q)).slice(0, 8);
  })();

  /* ─── Helpers (mark dirty on any change) ─────────────────── */
  function markDirty() { setIsDirty(true); setSaved(false); }

  function addNaics(code?: string) {
    const resolved = (code || naicsInput.trim().replace(/\D/g, ""));
    if (!resolved) { setNaicsInput(""); return; }
    if (!isValidNaics(resolved)) {
      setNaicsError("NAICS codes must be 2 to 6 digits.");
      return;
    }
    if (naicsCodes.includes(resolved)) {
      setNaicsError("Already added.");
      setNaicsInput("");
      return;
    }
    setNaicsCodes(prev => [...prev, resolved]);
    setNaicsInput("");
    setNaicsError(null);
    setNaicsDropdownOpen(false);
    markDirty();
  }

  function removeNaics(code: string) {
    setNaicsCodes(prev => prev.filter(c => c !== code));
    markDirty();
  }

  function addPsc(code?: string) {
    const resolved = (code || pscInput.trim().toUpperCase());
    if (!resolved) { setPscInput(""); return; }
    if (pscCodes.includes(resolved)) {
      setPscInput("");
      return;
    }
    setPscCodes(prev => [...prev, resolved]);
    setPscInput("");
    setPscDropdownOpen(false);
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

    // Resolve pending inputs into local copies BEFORE state updates
    let resolvedNaics = [...naicsCodes];
    let resolvedPsc = [...pscCodes];
    let resolvedKw = [...keywords];
    let resolvedEx = [...excludeKeywords];

    const pendingNaics = naicsInput.trim().replace(/\D/g, "");
    if (pendingNaics && isValidNaics(pendingNaics) && !resolvedNaics.includes(pendingNaics)) {
      resolvedNaics = [...resolvedNaics, pendingNaics];
    }

    const pendingPsc = pscInput.trim().toUpperCase();
    if (pendingPsc && !resolvedPsc.includes(pendingPsc)) {
      resolvedPsc = [...resolvedPsc, pendingPsc];
    }

    const pendingKw = keywordInput.trim().toLowerCase();
    if (pendingKw && pendingKw.length <= 80 && !resolvedKw.includes(pendingKw) && resolvedKw.length < MAX_KEYWORDS) {
      resolvedKw = [...resolvedKw, pendingKw];
    }

    const pendingEx = excludeInput.trim().toLowerCase();
    if (pendingEx && pendingEx.length <= 80 && !resolvedEx.includes(pendingEx) && resolvedEx.length < MAX_KEYWORDS) {
      resolvedEx = [...resolvedEx, pendingEx];
    }

    // Sync state with resolved values
    setNaicsCodes(resolvedNaics);
    setNaicsInput("");
    setNaicsError(null);
    setPscCodes(resolvedPsc);
    setPscInput("");
    setKeywords(resolvedKw);
    setKeywordInput("");
    setExcludeKeywords(resolvedEx);
    setExcludeInput("");

    setSaving(true);
    setError(null);

    try {
      const { error: err } = await supabase
        .from("profiles")
        .update({
          naics_codes: resolvedNaics,
          psc_codes: resolvedPsc,
          states: selectedStates,
          keywords: resolvedKw,
          exclude_keywords: resolvedEx,
          email_frequency: frequency,
          set_aside_preferences: setAsides,
          fed_org_prefs: fedOrgs,
        })
        .eq("id", userId);

      if (err) {
        setError("Failed to save your profile. Please try again.");
      } else {
        setSaved(true);
        setIsDirty(false);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch {
      setError("Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

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

      {/* Error alert */}
      {error && (
        <div className="dash-alert-error" role="alert" style={{ marginBottom: "var(--space-4)" }}>
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Unsaved changes warning */}
      {isDirty && (
        <div className="dash-alert-warning" style={{ marginBottom: "var(--space-4)", fontSize: "0.8rem" }}>
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
            <h2 className="dash-profile-section-title">NAICS Codes</h2>
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
        <div className="dash-profile-input-row" style={{ position: "relative" }}>
          <label htmlFor="naics-input" className="sr-only">Add NAICS code</label>
          <input
            ref={naicsInputRef}
            id="naics-input" type="text" inputMode="numeric"
            value={naicsInput}
            onChange={e => { setNaicsInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setNaicsError(null); setNaicsDropdownOpen(true); }}
            onFocus={() => { if (naicsInput.trim()) setNaicsDropdownOpen(true); }}
            onKeyDown={e => e.key === "Enter" && addNaics()}
            placeholder="e.g. 541512"
            className="dash-input-lg"
            maxLength={6}
            aria-describedby={naicsError ? "naics-error" : undefined}
            autoComplete="off"
          />
          <button className="dash-btn dash-btn-primary" onClick={() => addNaics()}>
            <Plus size={14} aria-hidden="true" /> Add
          </button>
          {naicsDropdownOpen && naicsInput.trim() && (
            <div
              ref={naicsDropdownRef}
              className="dash-dropdown"
              style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4 }}
            >
              {naicsSuggestions.isCustom && (
                <button type="button" className="dash-dropdown-item dash-dropdown-item-custom" onClick={() => addNaics(naicsSuggestions.query)}>
                  <span className="dash-dropdown-code">{naicsSuggestions.query}</span>
                  <span className="dash-dropdown-title" style={{ fontStyle: "italic" }}>Custom code (not in standard list)</span>
                </button>
              )}
              {naicsSuggestions.matches.map((n: CodeEntry) => {
                const alreadyAdded = naicsCodes.includes(n.code);
                return (
                  <button key={n.code} type="button" className={`dash-dropdown-item ${alreadyAdded ? "dash-dropdown-item-disabled" : ""}`} onClick={() => !alreadyAdded && addNaics(n.code)} disabled={alreadyAdded}>
                    <span className="dash-dropdown-code">{n.code}</span>
                    <span className="dash-dropdown-title">{n.title}</span>
                    {alreadyAdded && <span style={{ fontSize: "0.65rem", color: "var(--app-faint)", flexShrink: 0 }}>Added</span>}
                  </button>
                );
              })}
              {!naicsSuggestions.isCustom && naicsSuggestions.matches.length === 0 && (
                <div className="dash-dropdown-empty">No matching NAICS codes found</div>
              )}
            </div>
          )}
        </div>
        {naicsError && (
          <p id="naics-error" role="alert" style={{ fontSize: "0.78rem", color: "var(--danger)", margin: "0 0 var(--space-2)" }}>
            {naicsError}
          </p>
        )}
        <div className="dash-profile-chip-list">
          <AnimatePresence>
            {naicsCodes.map(code => {
              const match = naicsList.find(n => n.code === code);
              return (
                <ProfileChip key={code} label={code} subLabel={match?.title} onRemove={() => removeNaics(code)} variant="accent" monospace />
              );
            })}
          </AnimatePresence>
          {naicsCodes.length === 0 && (
            <span className="dash-profile-empty-hint">No NAICS codes added yet. Required for contract matching.</span>
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
            <h2 className="dash-profile-section-title">Product &amp; Service Codes (PSC)</h2>
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
        <div className="dash-profile-input-row" style={{ position: "relative" }}>
          <label htmlFor="psc-input" className="sr-only">Add PSC code</label>
          <input
            ref={pscInputRef}
            id="psc-input" type="text" value={pscInput}
            onChange={e => { setPscInput(e.target.value.toUpperCase()); setPscDropdownOpen(true); }}
            onFocus={() => { if (pscInput.trim()) setPscDropdownOpen(true); }}
            onKeyDown={e => e.key === "Enter" && addPsc()}
            placeholder="e.g. D302"
            className="dash-input-lg"
            maxLength={4}
            autoComplete="off"
          />
          <button className="dash-btn dash-btn-primary" onClick={() => addPsc()}>
            <Plus size={14} aria-hidden="true" /> Add
          </button>
          {pscDropdownOpen && pscInput.trim() && (
            <div
              ref={pscDropdownRef}
              className="dash-dropdown"
              style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4 }}
            >
              {pscSuggestions.map(p => {
                const alreadyAdded = pscCodes.includes(p.code);
                return (
                  <button key={p.code} type="button" className={`dash-dropdown-item ${alreadyAdded ? "dash-dropdown-item-disabled" : ""}`} onClick={() => !alreadyAdded && addPsc(p.code)} disabled={alreadyAdded}>
                    <span className="dash-dropdown-code">{p.code}</span>
                    <span className="dash-dropdown-title">{p.title}</span>
                    {alreadyAdded && <span style={{ fontSize: "0.65rem", color: "var(--app-faint)", flexShrink: 0 }}>Added</span>}
                  </button>
                );
              })}
              {pscSuggestions.length === 0 && /^[A-Z0-9]{1,4}$/.test(pscInput.trim()) && !pscCodes.includes(pscInput.trim()) && (
                <button type="button" className="dash-dropdown-item dash-dropdown-item-custom" onClick={() => addPsc(pscInput.trim())}>
                  <span className="dash-dropdown-code">{pscInput.trim()}</span>
                  <span className="dash-dropdown-title" style={{ fontStyle: "italic" }}>Custom code (not in standard list)</span>
                </button>
              )}
              {pscSuggestions.length === 0 && !(/^[A-Z0-9]{1,4}$/.test(pscInput.trim())) && (
                <div className="dash-dropdown-empty">No matching PSC codes found</div>
              )}
            </div>
          )}
        </div>
        <div className="dash-profile-chip-list">
          <AnimatePresence>
            {pscCodes.map(code => {
              const match = pscList.find(p => p.code === code);
              return (
                <ProfileChip key={code} label={code} subLabel={match?.title} onRemove={() => removePsc(code)} variant="accent" monospace />
              );
            })}
          </AnimatePresence>
          {pscCodes.length === 0 && (
            <span className="dash-profile-empty-hint">No PSC codes added yet. Optional precision filter.</span>
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
            <h2 className="dash-profile-section-title">Federal Organizations</h2>
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
          <div className="dash-profile-chip-list" style={{ marginBottom: "var(--space-3)" }}>
            <AnimatePresence>
              {fedOrgs.map((code) => {
                const org = fedOrgList.find(o => o.code === code);
                return (
                  <ProfileChip
                    key={code} label={code}
                    subLabel={org?.name}
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
          <span className="dash-profile-empty-hint">No agencies selected. All agencies treated equally.</span>
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
            <h2 className="dash-profile-section-title">States to Monitor</h2>
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
                aria-pressed={active}
                aria-label={`Toggle ${st}`}
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
          <h2 className="dash-profile-section-title">Positive Keywords</h2>
          <span className="dash-profile-section-badge">{keywords.length} / {MAX_KEYWORDS}</span>
        </div>
        <div className="dash-profile-input-row">
          <label htmlFor="keyword-input" className="sr-only">Add keyword</label>
          <input
            id="keyword-input" type="text" value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addKeyword()}
            placeholder="e.g. cybersecurity"
            className="dash-input-lg"
            maxLength={80}
            disabled={keywords.length >= MAX_KEYWORDS}
          />
          <button className="dash-btn dash-btn-primary" onClick={addKeyword} disabled={keywords.length >= MAX_KEYWORDS}>
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="dash-profile-chip-list">
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
          <h2 className="dash-profile-section-title" style={{ color: "var(--danger)" }}>Negative Keywords</h2>
          <span className="dash-profile-section-badge">{excludeKeywords.length} / {MAX_KEYWORDS}</span>
        </div>
        <p className="dash-profile-section-desc">
          Exclude contracts containing these words to eliminate false positives.
        </p>
        <div className="dash-profile-input-row">
          <label htmlFor="exclude-input" className="sr-only">Add exclude keyword</label>
          <input
            id="exclude-input" type="text" value={excludeInput}
            onChange={e => setExcludeInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addExcludeKeyword()}
            placeholder="e.g. cleaning"
            className="dash-input-lg"
            maxLength={80}
            disabled={excludeKeywords.length >= MAX_KEYWORDS}
          />
          <button className="dash-btn" onClick={addExcludeKeyword} disabled={excludeKeywords.length >= MAX_KEYWORDS}>
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="dash-profile-chip-list">
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
            <h2 className="dash-profile-section-title">Set-Aside Preferences</h2>
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
