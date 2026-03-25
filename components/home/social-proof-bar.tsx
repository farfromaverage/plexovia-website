"use client";

/* ─────────────────────────────────────────────────────────
   SocialProofBar — Portal Coverage Marquee
   Shows the 50+ procurement portals Plexovia monitors.
   No fake testimonials. Real portal names contractors know.
   Layout: thin strip | label | scrolling portal name tape
───────────────────────────────────────────────────────── */

const PORTALS = [
  "SAM.gov",
  "TX BidsOnline",
  "CA eProcure",
  "NY Contract Reporter",
  "FL Vendor Bid System",
  "PA eMarketplace",
  "IL Procurement Bulletin",
  "OH State Procurement",
  "GA Procurement Registry",
  "NC Interactive Purchasing",
  "VA eVA",
  "WA WEBS",
  "MI SIGMA",
  "MD eMMA",
  "CO COFRS",
  "AZ ProcureAZ",
  "TN Edison",
  "NJ NJSTART",
  "MA COMMBUYS",
  "MN Supplier Portal",
  "MO MissouriBUYS",
  "IN INBiz Procurement",
  "WI VendorNet",
  "KY eProcurement",
  "AR ArkBid",
  "SC SciQuest",
  "OR Oregon Marketplace",
  "NV NevadaEPro",
  "NM SHARE",
  "UT FINET",
];

/* Duplicate list for a seamless infinite loop */
const DOUBLED = [...PORTALS, ...PORTALS];

export default function SocialProofBar() {
  return (
    <section
      aria-label="Procurement portals we monitor"
      style={{
        borderTop:    "1px solid var(--pub-border)",
        borderBottom: "1px solid var(--pub-border)",
        backgroundColor: "var(--pub-surface-2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          height:     "52px",
        }}
      >
        {/* ── Label (non-scrolling) ── */}
        <div
          aria-hidden="true"
          style={{
            flexShrink:  0,
            display:     "flex",
            alignItems:  "center",
            gap:         "0.5rem",
            padding:     "0 1.25rem 0 1.5rem",
            borderRight: "1px solid var(--pub-border)",
            height:      "100%",
            whiteSpace:  "nowrap",
          }}
        >
          <span
            style={{
              display:       "block",
              width:         "6px",
              height:        "6px",
              borderRadius:  "50%",
              backgroundColor: "var(--accent)",
              flexShrink:    0,
            }}
          />
          <span
            style={{
              fontFamily:    "var(--font-geist-mono), monospace",
              fontSize:      "0.6875rem",
              fontWeight:    500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color:         "var(--pub-muted)",
              whiteSpace:    "nowrap",
            }}
          >
            50+ portals monitored
          </span>
        </div>

        {/* ── Marquee track ── */}
        <div
          style={{
            flex:     1,
            overflow: "hidden",
            height:   "100%",
            display:  "flex",
            alignItems: "center",
            /* Fade edges */
            maskImage:       "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          }}
        >
          <ul
            role="list"
            aria-label="Portal list"
            style={{
              display:         "flex",
              alignItems:      "center",
              gap:             0,
              listStyle:       "none",
              margin:          0,
              padding:         0,
              animation:       "scroll-x 42s linear infinite",
              willChange:      "transform",
            }}
            /* Pause on hover for readability */
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLUListElement).style.animationPlayState = "paused";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLUListElement).style.animationPlayState = "running";
            }}
          >
            {DOUBLED.map((portal, i) => (
              <li
                key={`${portal}-${i}`}
                style={{
                  display:    "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily:    "var(--font-geist-mono), monospace",
                    fontSize:      "0.8125rem",
                    fontWeight:    400,
                    color:         "var(--pub-muted)",
                    whiteSpace:    "nowrap",
                    padding:       "0 1rem",
                  }}
                >
                  {portal}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    color:      "var(--pub-border)",
                    fontSize:   "0.75rem",
                    flexShrink: 0,
                  }}
                >
                  ·
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
