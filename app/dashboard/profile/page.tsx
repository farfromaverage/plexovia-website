"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, CheckCircle, AlertCircle, ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

/* ── Plan limits ──────────────────────────────────────────────────────────── */
const LIMITS = {
  essential: { naics: 10, states: 7 },
  pro:       { naics: 999, states: 50 },
  enterprise:{ naics: 999, states: 50 },
} as const;

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

interface Profile {
  id: string;
  plan: string | null;
  company_name: string | null;
  naics_codes: string[] | null;
  states: string[] | null;
  keywords: string[] | null;
  alert_email: string | null;
  alert_frequency: string | null;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile]       = useState<Profile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState<string | null>(null);

  /* Form state */
  const [companyName, setCompanyName]   = useState("");
  const [naicsCodes, setNaicsCodes]     = useState<string[]>([]);
  const [naicsInput, setNaicsInput]     = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [keywords, setKeywords]         = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [frequency, setFrequency]       = useState("daily");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id,plan,company_name,naics_codes,states,keywords,alert_email,alert_frequency")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setCompanyName(data.company_name ?? "");
        setNaicsCodes(data.naics_codes ?? []);
        setSelectedStates(data.states ?? []);
        setKeywords(data.keywords ?? []);
        setFrequency(data.alert_frequency ?? "daily");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const plan = (profile?.plan ?? "essential") as keyof typeof LIMITS;
  const limits = LIMITS[plan] ?? LIMITS.essential;

  /* ── NAICS helpers ────────────────────────────────────────────────────── */
  function addNaics() {
    const code = naicsInput.trim().replace(/\D/g, "");
    if (!code || naicsCodes.includes(code)) { setNaicsInput(""); return; }
    if (naicsCodes.length >= limits.naics) {
      setError(`${plan === "essential" ? "Essential" : "Pro"} plan allows up to ${limits.naics} NAICS codes. ${plan === "essential" ? "Upgrade to Pro for unlimited." : ""}`);
      return;
    }
    setNaicsCodes([...naicsCodes, code]);
    setNaicsInput("");
    setError(null);
  }

  function removeNaics(code: string) {
    setNaicsCodes(naicsCodes.filter(c => c !== code));
  }

  /* ── State helpers ────────────────────────────────────────────────────── */
  function toggleState(st: string) {
    if (selectedStates.includes(st)) {
      setSelectedStates(selectedStates.filter(s => s !== st));
    } else {
      if (selectedStates.length >= limits.states) {
        setError(`${plan === "essential" ? "Essential" : "Pro"} plan allows up to ${limits.states} states. ${plan === "essential" ? "Upgrade to Pro for all 50 states." : ""}`);
        return;
      }
      setSelectedStates([...selectedStates, st]);
      setError(null);
    }
  }

  /* ── Keyword helpers ──────────────────────────────────────────────────── */
  function addKeyword() {
    const kw = keywordInput.trim().toLowerCase();
    if (!kw || keywords.includes(kw)) { setKeywordInput(""); return; }
    setKeywords([...keywords, kw]);
    setKeywordInput("");
  }

  /* ── Save ─────────────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from("profiles")
      .update({
        company_name:    companyName || null,
        naics_codes:     naicsCodes,
        states:          selectedStates,
        keywords:        keywords,
        alert_frequency: frequency,
        updated_at:      new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);
    if (err) {
      setError("Failed to save. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  /* ── Styles (design system tokens) ───────────────────────────────────── */
  const s = {
    page:       { minHeight: "100vh", background: "var(--app-bg)", color: "var(--app-text)", fontFamily: "var(--font-inter, sans-serif)", padding: "2rem 1.5rem" } as React.CSSProperties,
    wrap:       { maxWidth: 760, margin: "0 auto" } as React.CSSProperties,
    back:       { display: "inline-flex", alignItems: "center", gap: 6, color: "var(--app-muted)", fontSize: "0.85rem", textDecoration: "none", marginBottom: "1.5rem" } as React.CSSProperties,
    h1:         { fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.25rem" } as React.CSSProperties,
    sub:        { color: "var(--app-muted)", fontSize: "0.9rem", marginBottom: "2rem" } as React.CSSProperties,
    section:    { background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: "var(--radius-md)", padding: "1.5rem", marginBottom: "1.5rem" } as React.CSSProperties,
    sectionH:   { fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" } as React.CSSProperties,
    label:      { display: "block", fontSize: "0.8rem", color: "var(--app-muted)", marginBottom: "0.4rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
    input:      { width: "100%", background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: "var(--radius-sm)", padding: "0.6rem 0.8rem", color: "var(--app-text)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const },
    pill:       { display: "inline-flex", alignItems: "center", gap: 4, background: "var(--accent-bg-app)", border: "1px solid var(--accent)", borderRadius: "999px", padding: "3px 10px", fontSize: "0.8rem", fontFamily: "var(--font-geist-mono, monospace)", color: "var(--accent)" } as React.CSSProperties,
    pillBtn:    { background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", display: "flex", padding: 0 } as React.CSSProperties,
    addRow:     { display: "flex", gap: 8, marginBottom: "0.75rem" } as React.CSSProperties,
    addBtn:     { background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: "var(--radius-sm)", padding: "0.6rem 0.9rem", color: "var(--app-text)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem" } as React.CSSProperties,
    grid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.4rem" } as React.CSSProperties,
    statBtn:    (active: boolean) => ({ background: active ? "var(--accent-bg-app)" : "var(--app-surface-2)", border: `1px solid ${active ? "var(--accent)" : "var(--app-border)"}`, borderRadius: "var(--radius-sm)", padding: "0.4rem 0.5rem", color: active ? "var(--accent)" : "var(--app-muted)", cursor: "pointer", fontSize: "0.75rem", fontWeight: active ? 600 : 400, textAlign: "center" as const }),
    meter:      { fontSize: "0.78rem", color: "var(--app-muted)" } as React.CSSProperties,
    saveBtn:    { background: "#1C1917", border: "none", borderRadius: "var(--radius-sm)", padding: "0.75rem 1.5rem", color: "#fff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 } as React.CSSProperties,
  };

  if (loading) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--app-muted)" }}>Loading profile…</div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <Link href="/dashboard" style={s.back}><ArrowLeft size={14} /> Back to dashboard</Link>
        <h1 style={s.h1}>Profile Settings</h1>
        <p style={s.sub}>Update your NAICS codes, states, and alert preferences.</p>

        {error && (
          <div style={{ background: "#2A1515", border: "1px solid #5A2020", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#F87171", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={15} /> {error}
            {plan === "essential" && (
              <Link href="/dashboard/billing" style={{ marginLeft: "auto", color: "var(--accent)", textDecoration: "none", fontWeight: 600, fontSize: "0.82rem" }}>Upgrade →</Link>
            )}
          </div>
        )}

        {/* Company Name */}
        <div style={s.section}>
          <div style={s.sectionH}>Company</div>
          <label style={s.label}>Company Name</label>
          <input style={s.input} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Federal Solutions LLC" />
        </div>

        {/* NAICS Codes */}
        <div style={s.section}>
          <div style={s.sectionH}>
            <span>NAICS Codes</span>
            <span style={s.meter}>{naicsCodes.length} / {limits.naics === 999 ? "∞" : limits.naics}</span>
          </div>
          <div style={s.addRow}>
            <input
              style={{ ...s.input, flex: 1 }}
              value={naicsInput}
              onChange={e => setNaicsInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addNaics()}
              placeholder="e.g. 541512"
              maxLength={6}
            />
            <button style={s.addBtn} onClick={addNaics}><Plus size={14} /> Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
            {naicsCodes.map(code => (
              <span key={code} style={s.pill}>
                {code}
                <button style={s.pillBtn} onClick={() => removeNaics(code)}><X size={11} /></button>
              </span>
            ))}
            {naicsCodes.length === 0 && <span style={{ color: "var(--app-muted)", fontSize: "0.85rem" }}>No NAICS codes added yet.</span>}
          </div>
        </div>

        {/* States */}
        <div style={s.section}>
          <div style={s.sectionH}>
            <span>States to Monitor</span>
            <span style={s.meter}>{selectedStates.length} / {limits.states === 50 ? "All 50" : limits.states}</span>
          </div>
          <div style={s.grid}>
            {US_STATES.map(st => (
              <button
                key={st}
                style={s.statBtn(selectedStates.includes(st))}
                onClick={() => toggleState(st)}
                title={STATE_NAMES[st]}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div style={s.section}>
          <div style={s.sectionH}>Keywords <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", fontWeight: 400 }}>optional</span></div>
          <div style={s.addRow}>
            <input
              style={{ ...s.input, flex: 1 }}
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addKeyword()}
              placeholder="e.g. cybersecurity, cloud migration"
            />
            <button style={s.addBtn} onClick={addKeyword}><Plus size={14} /> Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
            {keywords.map(kw => (
              <span key={kw} style={{ ...s.pill, borderColor: "var(--app-border)", color: "var(--app-text)" }}>
                {kw}
                <button style={s.pillBtn} onClick={() => setKeywords(keywords.filter(k => k !== kw))}><X size={11} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Alert Frequency */}
        <div style={s.section}>
          <div style={s.sectionH}>Alert Frequency</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["daily", "weekly"].map(f => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "var(--radius-sm)", border: `1px solid ${frequency === f ? "var(--accent)" : "var(--app-border)"}`, background: frequency === f ? "var(--accent-bg-app)" : "var(--app-surface-2)", color: frequency === f ? "var(--accent)" : "var(--app-muted)", cursor: "pointer", fontWeight: frequency === f ? 600 : 400, fontSize: "0.88rem" }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--app-muted)" }}>
            {frequency === "daily" ? "Get a digest every morning at 6 AM Eastern." : "Get a weekly summary every Monday at 6 AM Eastern."}
          </p>
        </div>

        {/* Save */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCwIcon /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
          {saved && <span style={{ color: "#4ADE80", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={14} /> Changes saved successfully</span>}
        </div>
      </div>
    </div>
  );
}

function RefreshCwIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
  );
}
