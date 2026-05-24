export default function SkeletonRows({ rows = 6 }: { rows?: number; columns?: number; columnWidths?: string }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--app-border)",
          }}
        >
          <div className="dash-skeleton" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="dash-skeleton" style={{ height: 14, width: "70%" }} />
            <div className="dash-skeleton" style={{ height: 10, width: "40%" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <div className="dash-skeleton" style={{ height: 20, width: 90, borderRadius: 4 }} />
              <div className="dash-skeleton" style={{ height: 20, width: 70, borderRadius: 4 }} />
              <div className="dash-skeleton" style={{ height: 20, width: 100, borderRadius: 4 }} />
            </div>
          </div>
          <div className="dash-hide-mobile" style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
            <div className="dash-skeleton" style={{ height: 10, width: 60 }} />
            <div className="dash-skeleton" style={{ height: 10, width: 50 }} />
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <div className="dash-skeleton" style={{ width: 28, height: 28, borderRadius: 4 }} />
            <div className="dash-skeleton" style={{ width: 28, height: 28, borderRadius: 4 }} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading data…</span>
    </>
  )
}
