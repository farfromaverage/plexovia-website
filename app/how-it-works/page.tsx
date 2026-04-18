import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Mail, ExternalLink } from "lucide-react";
import Footer from "@/components/home/footer";
import FAQSection from "@/components/home/faq-section";

export const metadata: Metadata = {
  title: "How Plexovia Works | Government Contract Monitoring",
  description:
    "Three steps to full automation. Plexovia monitors SAM.gov, DLA DIBBS, and SBA SubNet every night. Scored contract matches delivered to your inbox by 6 AM. No login required.",
  alternates: { canonical: "https://plexovia.com/how-it-works" },
  openGraph: {
    title: "How Plexovia Works",
    description:
      "Set your NAICS codes in minutes. We scan every portal every night and deliver ranked matches to your inbox by 6 AM.",
    url: "https://plexovia.com/how-it-works",
    images: [{ url: "https://plexovia.com/og-how-it-works.jpg", width: 1200, height: 630 }],
  },
};

/* Issue 2 and 3 fix: Restructured from 4 steps to 3.
   Steps 01 (Profile) and old 02 (Alerts) were the same form merged.
   Label tags communicate the effort asymmetry explicitly. */
const steps = [
  {
    number: "01",
    label:  "Profile",
    tag:    "You do this once",
    title:  "Build your firm's profile. One time, three minutes.",
    body:   "You aren't just setting filters; you are replacing 15 hours of manual administrative drag per week. Enter your NAICS codes and location preferences once. We become your automated BD analyst. From this point forward, you do nothing else.",
    detail: [
      "Add unlimited NAICS codes to your tracking profile.",
      "Add custom keywords to catch contracts your NAICS codes miss.",
      "Set your place of performance preference so irrelevant states drop out.",
      "Track competitors to see what federal awards they win.",
      "Set your delivery email. Daily digests at 6 AM, no other login needed.",
    ],
  },
  {
    number: "02",
    label:  "Engine",
    tag:    "We handle this",
    title:  "We scan every portal every night. You do nothing.",
    body:   "Unlike legacy platforms relying on delayed data resellers, our engine pulls directly from the primary government source. When a state agency hits publish, we see it. Your competitors get the alert 48 hours later. You get it the next morning.",
    detail: [
      "SAM.gov federal awards and presolicitations updated daily.",
      "Three federal procurement sources checked nightly. High-priority sources checked every 6 hours.",
      "Set aside types flagged automatically: 8(a), WOSB, SDVOSB, HUBZone.",
      "Bid deadlines tracked. Reminders sent 3 days and 1 day before close.",
    ],
  },
  {
    number: "03",
    label:  "Delivery",
    tag:    "We handle this",
    title:  "Ranked matches in your inbox at 6 AM. No login, ever.",
    body:   "Our matching model ruthlessly filters out false positives. Every contract arrives ranked from 100 down to 0, completely stripping away the noise. You don't just get an alert; you get an AI explanation detailing exactly why the contract triggered, so you never guess.",
    detail: [
      "Every match includes an AI explanation detailing exactly why it scored the way it did.",
      "Each match shows the agency, deadline, place of performance, set aside status, and your score.",
      "Click any contract to go directly to the solicitation. No platform login required.",
      "Weekly bid calendars and performance summaries delivered automatically.",
      "AI Predictive Forecasting: Renewal Radar predicts when incumbent contracts drop.",
      "Track agency 'use-it-or-lose-it' spending heatmaps and Q4 budget surges.",
    ],
  },
];

/* Issue 7 fix: Replaced misplaced pricing FAQ ("Is everything included?")
   with a real process question. Updated "people" to "contractors".
   Removed reference to old plan name "Plexovia Intelligence". */
const faqs = [
  {
    id: "hiw-faq-0",
    q: "Where does the contract data come from?",
    a: "SAM.gov is the primary federal source. DLA DIBBS covers defense micro-purchases and spare parts RFQs. SBA SubNet tracks subcontracting opportunities. We pull directly from each source. No data resellers.",
  },
  {
    id: "hiw-faq-1",
    q: "How is the match score calculated?",
    a: "It starts with NAICS code. If the solicitation lists your code, the base score is high. We then weight for place of performance, set aside type if you have a certification, keyword density, and deadline proximity. Scores run 0 to 100. Anything above 70 is a strong match.",
  },
  {
    id: "hiw-faq-2",
    q: "Do I need to log in every day?",
    a: "No. The entire point is that you do not have to. Everything you need is in your email. You can log in to review match history, export to CSV, or update your profile. But if you never log in after setup, the alerts still arrive every morning.",
  },
  {
    id: "hiw-faq-3",
    q: "What happens if I add a new NAICS code or keyword after setup?",
    a: "Your profile updates immediately. The next overnight scan runs against your new configuration. No restart, no rebuild. The change takes effect the same night you make it.",
  },
  {
    id: "hiw-faq-4",
    q: "How fast do new solicitations appear?",
    a: "New solicitations appear the morning after they are posted. For high volume portals with 6 hour scanning, an alert can arrive within hours of a new posting depending on the batch timing.",
  },
  {
    id: "hiw-faq-5",
    q: "Can I cancel before my trial ends and pay nothing?",
    a: "Yes. If you cancel your 7 day free trial before your billing cycle begins, your card will never be charged. You have full control from your billing dashboard.",
  },
];

export default function HowItWorksPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to automate government contract monitoring with Plexovia",
    "description": "Three steps to set up automated nightly scanning of SAM.gov and state procurement portals.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Build your profile",
        "text": "Add your NAICS codes and location preferences once. Replaces manual tracking."
      },
      {
        "@type": "HowToStep",
        "name": "Engine scans portals",
        "text": "Our engine pulls directly from SAM.gov, DLA DIBBS, and SBA SubNet every night."
      },
      {
        "@type": "HowToStep",
        "name": "Delivery of matches with AI Forecasting",
        "text": "Ranked matches, scored from 0 to 100, delivered to your inbox at 6 AM. Includes AI Predictive Forecasting for incumbent expirations and Q4 budget surges."
      }
    ]
  };

  return (
    <div style={{ backgroundColor: "var(--pub-bg)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* HERO */}
      <section
        style={{
          paddingTop:    "clamp(6rem, 10vw, 9rem)",
          paddingBottom: "5rem",
          paddingLeft:   "1.5rem",
          paddingRight:  "1.5rem",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <span
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           "0.375rem",
              fontFamily:    "var(--font-geist-mono), monospace",
              fontSize:      "0.6875rem",
              fontWeight:    500,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color:         "var(--accent)",
              marginBottom:  "1.5rem",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", display: "block" }} />
            How It Works
          </span>

          <h1
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    800,
              fontSize:      "clamp(2.25rem, 5vw, 3.5rem)",
              letterSpacing: "-0.05em",
              lineHeight:    1.05,
              color:         "var(--pub-text)",
              marginBottom:  "1.5rem",
            }}
          >
            Stop searching for contracts.
            <br />
            <span style={{ color: "var(--accent)" }}>Let them find you.</span>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "1.125rem",
              color:      "var(--pub-muted)",
              lineHeight: 1.7,
              maxWidth:   "580px",
              margin:     "0 auto 2.5rem",
            }}
          >
            While your competitors spend two hours logging into portals to search for updates, you are reviewing a ranked shortlist over morning coffee. Stop hunting. Let the contracts find you.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/auth/signup"
              id="hiw-hero-cta"
              className="btn-gold"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              Start Free Trial
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              style={{
                fontFamily:          "var(--font-inter), sans-serif",
                fontSize:            "0.9375rem",
                fontWeight:          500,
                color:               "var(--pub-muted)",
                textDecoration:      "underline",
                textUnderlineOffset: "3px",
                alignSelf:           "center",
              }}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* STAT STRIP */}
      <div
        style={{
          borderTop:       "1px solid var(--pub-border)",
          borderBottom:    "1px solid var(--pub-border)",
          backgroundColor: "var(--pub-surface)",
        }}
      >
        <div
          style={{
            maxWidth:            "960px",
            margin:              "0 auto",
            padding:             "2.75rem 1.5rem",
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap:                 "2rem",
            textAlign:           "center",
          }}
        >
          {[
            { stat: "50+",   unit: "states",   label: "monitored every night"      },
            { stat: "6 AM",  unit: "",          label: "contracts in your inbox"    },
            { stat: "0 to 100", unit: "",          label: "AI match score per contract"},
            { stat: "15+ hrs", unit: "",          label: "saved per week on manual search"          },
          ].map(({ stat, unit, label }) => (
            <div key={label}>
              <p
                style={{
                  fontFamily:   "var(--font-inter), sans-serif",
                  fontWeight:   800,
                  fontSize:     "1.875rem",
                  letterSpacing:"-0.05em",
                  color:        "var(--pub-text)",
                  lineHeight:   1,
                  marginBottom: "0.25rem",
                }}
              >
                {stat}{" "}
                <span style={{ fontWeight: 400, fontSize: "1rem", color: "var(--pub-muted)" }}>
                  {unit}
                </span>
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize:   "0.875rem",
                  color:      "var(--pub-muted)",
                  lineHeight: 1.5,
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* THREE STEPS */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Section header */}
          <div style={{ maxWidth: "640px", marginBottom: "4rem" }}>
            <p
              style={{
                fontFamily:    "var(--font-geist-mono), monospace",
                fontSize:      "0.6875rem",
                fontWeight:    500,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color:         "var(--accent)",
                marginBottom:  "0.75rem",
              }}
            >
              The process
            </p>
            <h2
              style={{
                fontFamily:    "var(--font-inter), sans-serif",
                fontWeight:    700,
                fontSize:      "clamp(1.75rem, 3vw, 2.5rem)",
                letterSpacing: "-0.04em",
                color:         "var(--pub-text)",
                lineHeight:    1.1,
                marginBottom:  "0.75rem",
              }}
            >
              Set up once.<br />Contracts arrive every morning after that.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.9375rem",
                color:      "var(--pub-muted)",
                lineHeight: 1.7,
              }}
            >
              Step 01 is yours. Steps 02 and 03 run permanently on their own, every night, without you.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const }}>
            {steps.map((step, idx) => (
              <div
                key={step.number}
                style={{
                  display:             "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap:                 "4rem",
                  padding:             "4rem 0",
                  borderBottom:        idx < steps.length - 1 ? "1px solid var(--pub-border)" : "none",
                  alignItems:          "start",
                }}
              >
                {/* Left col */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily:      "var(--font-geist-mono), monospace",
                        fontWeight:      700,
                        fontSize:        "0.75rem",
                        letterSpacing:   "0.06em",
                        color:           "var(--accent)",
                        backgroundColor: "rgba(201,168,76,0.1)",
                        padding:         "0.3rem 0.75rem",
                        borderRadius:    "var(--radius-pill)",
                      }}
                    >
                      {step.number}
                    </span>
                    <span
                      style={{
                        fontFamily:    "var(--font-geist-mono), monospace",
                        fontWeight:    500,
                        fontSize:      "0.6875rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        color:         "var(--pub-faint)",
                      }}
                    >
                      {step.label}
                    </span>
                    {/* Issue 3 fix: YOU DO THIS / WE HANDLE THIS tag */}
                    <span
                      style={{
                        fontFamily:      "var(--font-geist-mono), monospace",
                        fontSize:        "0.6rem",
                        fontWeight:      600,
                        letterSpacing:   "0.07em",
                        textTransform:   "uppercase" as const,
                        padding:         "0.15rem 0.5rem",
                        borderRadius:    "4px",
                        backgroundColor: step.number === "01"
                          ? "rgba(201,168,76,0.12)"
                          : "rgba(0,0,0,0.05)",
                        color:           step.number === "01"
                          ? "var(--accent)"
                          : "var(--pub-faint)",
                      }}
                    >
                      {step.tag}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily:    "var(--font-inter), sans-serif",
                      fontWeight:    700,
                      fontSize:      "clamp(1.375rem, 2.5vw, 1.75rem)",
                      letterSpacing: "-0.03em",
                      color:         "var(--pub-text)",
                      lineHeight:    1.2,
                      marginBottom:  "1.25rem",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize:   "1rem",
                      color:      "var(--pub-muted)",
                      lineHeight: 1.75,
                    }}
                  >
                    {step.body}
                  </p>
                </div>

                {/* Right col detail bullets */}
                <div
                  style={{
                    backgroundColor: "var(--pub-surface)",
                    border:          "1px solid var(--pub-border)",
                    borderRadius:    "var(--radius-md)",
                    padding:         "2rem",
                  }}
                >
                  <ul
                    style={{
                      listStyle:     "none",
                      margin:        0,
                      padding:       0,
                      display:       "flex",
                      flexDirection: "column" as const,
                      gap:           "1rem",
                    }}
                  >
                    {step.detail.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <CheckCircle
                          size={16}
                          style={{ color: "var(--success)", flexShrink: 0, marginTop: "0.2rem" }}
                          aria-hidden="true"
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-inter), sans-serif",
                            fontSize:   "0.9375rem",
                            color:      "var(--pub-text)",
                            lineHeight: 1.6,
                          }}
                        >
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EMAIL DIGEST MOCKUP */}
      <section
        aria-label="Example contract digest"
        style={{
          borderTop:       "1px solid var(--pub-border)",
          borderBottom:    "1px solid var(--pub-border)",
          backgroundColor: "var(--pub-surface)",
          padding:         "5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>

          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span
              style={{
                display:       "inline-flex",
                alignItems:    "center",
                gap:           "0.375rem",
                fontFamily:    "var(--font-geist-mono), monospace",
                fontSize:      "0.6875rem",
                fontWeight:    500,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color:         "var(--accent)",
                marginBottom:  "1rem",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", display: "block" }} />
              What it looks like
            </span>
            <h2
              style={{
                fontFamily:    "var(--font-inter), sans-serif",
                fontWeight:    700,
                fontSize:      "clamp(1.5rem, 2.5vw, 2rem)",
                letterSpacing: "-0.04em",
                color:         "var(--pub-text)",
                lineHeight:    1.15,
                marginBottom:  "0.75rem",
              }}
            >
              This is what lands in your inbox at 6 AM.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize:   "0.9375rem",
                color:      "var(--pub-muted)",
                lineHeight: 1.65,
              }}
            >
              One entry from a real digest. Every match includes a score, an AI explanation, and a direct link.
            </p>
          </div>

          {/* Mock email card */}
          <div
            style={{
              backgroundColor: "var(--pub-bg)",
              border:          "1px solid var(--pub-border)",
              borderRadius:    "var(--radius-md)",
              overflow:        "hidden",
              boxShadow:       "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            {/* Email header bar */}
            <div
              style={{
                borderBottom:    "1px solid var(--pub-border)",
                padding:         "1rem 1.5rem",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "space-between",
                flexWrap:        "wrap",
                gap:             "0.5rem",
                backgroundColor: "var(--pub-surface-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <Mail size={14} style={{ color: "var(--accent)" }} aria-hidden="true" />
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize:   "0.75rem",
                    color:      "var(--pub-muted)",
                    fontWeight: 500,
                  }}
                >
                  alerts@plexovia.com
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize:   "0.8125rem",
                  color:      "var(--pub-muted)",
                  fontWeight: 500,
                }}
              >
                Your morning digest 3 new matches 6:00 AM
              </span>
            </div>

            {/* Contract match entry */}
            <div style={{ padding: "1.75rem 2rem" }}>

              {/* Title row + score badge */}
              <div
                style={{
                  display:        "flex",
                  alignItems:     "flex-start",
                  justifyContent: "space-between",
                  gap:            "1.5rem",
                  marginBottom:   "1.25rem",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily:    "var(--font-inter), sans-serif",
                      fontWeight:    700,
                      fontSize:      "1rem",
                      letterSpacing: "-0.02em",
                      color:         "var(--pub-text)",
                      lineHeight:    1.3,
                      marginBottom:  "0.25rem",
                    }}
                  >
                    IT Support Services Department of Veterans Affairs
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize:   "0.7rem",
                      color:      "var(--pub-faint)",
                      fontWeight: 400,
                    }}
                  >
                    Solicitation 36C24826R0041 Northern Virginia and Maryland
                  </p>
                </div>

                {/* Score circle */}
                <div
                  style={{
                    flexShrink:      0,
                    display:         "flex",
                    flexDirection:   "column" as const,
                    alignItems:      "center",
                    justifyContent:  "center",
                    width:           "72px",
                    height:          "72px",
                    borderRadius:    "50%",
                    border:          "2.5px solid var(--accent)",
                    backgroundColor: "rgba(201,168,76,0.08)",
                  }}
                >
                  <span
                    style={{
                      fontFamily:    "var(--font-inter), sans-serif",
                      fontWeight:    800,
                      fontSize:      "1.5rem",
                      letterSpacing: "-0.05em",
                      color:         "var(--accent)",
                      lineHeight:    1,
                    }}
                  >
                    87
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), sans-serif",
                      fontWeight: 400,
                      fontSize:   "0.6875rem",
                      color:      "var(--pub-muted)",
                      lineHeight: 1,
                    }}
                  >
                    /100
                  </span>
                </div>
              </div>

              {/* AI explanation block */}
              <div
                style={{
                  backgroundColor: "rgba(201,168,76,0.05)",
                  border:          "1px solid rgba(201,168,76,0.2)",
                  borderRadius:    "8px",
                  padding:         "1rem 1.25rem",
                  marginBottom:    "1.25rem",
                }}
              >
                <p
                  style={{
                    fontFamily:    "var(--font-geist-mono), monospace",
                    fontSize:      "0.6875rem",
                    fontWeight:    600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase" as const,
                    color:         "var(--accent)",
                    marginBottom:  "0.5rem",
                  }}
                >
                  Why this scored 87
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize:   "0.9rem",
                    color:      "var(--pub-text)",
                    lineHeight: 1.7,
                  }}
                >
                  Primary NAICS 541512 matches solicitation record (strong signal). Place of performance
                  is Maryland, your preferred state. SDVOSB set aside aligns with your certification on
                  file. Deadline is 12 days out, within your active pursuit window.
                </p>
              </div>

              {/* Metadata cards */}
              <div
                style={{
                  display:             "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap:                 "0.75rem",
                  marginBottom:        "1.5rem",
                }}
              >
                {[
                  { label: "Agency",    value: "Dept. of Veterans Affairs" },
                  { label: "Deadline",  value: "Apr 18, 2026"              },
                  { label: "Set aside", value: "SDVOSB"                    },
                  { label: "State",     value: "Maryland"                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      backgroundColor: "var(--pub-surface)",
                      border:          "1px solid var(--pub-border)",
                      borderRadius:    "6px",
                      padding:         "0.625rem 0.875rem",
                    }}
                  >
                    <p
                      style={{
                        fontFamily:    "var(--font-geist-mono), monospace",
                        fontSize:      "0.6rem",
                        fontWeight:    600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        color:         "var(--pub-faint)",
                        marginBottom:  "0.2rem",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize:   "0.875rem",
                        fontWeight: 600,
                        color:      "var(--pub-text)",
                        lineHeight: 1.3,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Direct link */}
              <span
                style={{
                  display:             "inline-flex",
                  alignItems:          "center",
                  gap:                 "0.375rem",
                  fontFamily:          "var(--font-inter), sans-serif",
                  fontSize:            "0.875rem",
                  fontWeight:          600,
                  color:               "var(--accent)",
                  textDecoration:      "underline",
                  textUnderlineOffset: "3px",
                  cursor:              "default",
                }}
              >
                View Solicitation on SAM.gov
                <ExternalLink size={13} aria-hidden="true" />
              </span>
            </div>

            {/* Footer bar */}
            <div
              style={{
                borderTop:       "1px solid var(--pub-border)",
                padding:         "0.875rem 1.5rem",
                backgroundColor: "var(--pub-surface-2)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "space-between",
                flexWrap:        "wrap",
                gap:             "0.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize:   "0.8125rem",
                  color:      "var(--pub-muted)",
                }}
              >
                2 more matches in this digest, scores 74 and 61
              </span>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize:   "0.7rem",
                  color:      "var(--pub-faint)",
                }}
              >
                example only, not a real solicitation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Issue 7 fix: "contractors" not "people",
          replaced pricing FAQ with process FAQ */}
      <FAQSection 
        title="Questions contractors ask before signing up" 
        items={faqs} 
        hideCta={true} 
      />

      {/* FINAL CTA */}
      <section
        style={{
          backgroundColor: "var(--pub-bg)",
          borderTop:       "1px solid var(--pub-border)",
          padding:         "6rem 1.5rem",
          textAlign:       "center",
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily:    "var(--font-inter), sans-serif",
              fontWeight:    700,
              fontSize:      "clamp(1.625rem, 3.5vw, 2.5rem)",
              letterSpacing: "-0.05em",
              color:         "var(--pub-text)",
              lineHeight:    1.1,
              marginBottom:  "1rem",
            }}
          >
            The firms winning government contracts are not better than you. They just found out first.
          </h2>
          <p
            style={{
              fontFamily:   "var(--font-inter), sans-serif",
              fontSize:     "1rem",
              color:        "var(--pub-muted)",
              lineHeight:   1.7,
              marginBottom: "2.5rem",
            }}
          >
            Set up in three minutes. Tomorrow morning at 6 AM, the matches are waiting.
          </p>
          <Link
            href="/auth/signup"
            id="hiw-bottom-cta"
            className="btn-gold"
            style={{
              display:         "inline-flex",
              alignItems:      "center",
              gap:             "0.5rem",
              backgroundColor: "var(--pub-text)",
              color:           "var(--pub-bg)",
            }}
          >
            Start Your Free Trial
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize:   "0.8125rem",
              color:      "var(--pub-faint)",
              marginTop:  "1rem",
            }}
          >
            Cancel anytime. No commitment.
          </p>
        </div>
      </section>

      <Footer />

    </div>
  );
}
