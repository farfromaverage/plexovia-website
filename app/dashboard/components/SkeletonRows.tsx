export default function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            display: "flex", alignItems: "center", gap: "var(--space-4)",
            padding: "var(--space-4) var(--space-6)",
            borderBottom: "1px solid var(--app-border)",
          }}
        >
          {/* Score ring skeleton */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <div className="dash-skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="dash-skeleton" style={{ height: 15, width: "75%" }} />
            <div className="dash-skeleton" style={{ height: 15, width: "50%" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <div className="dash-skeleton" style={{ height: 22, width: 90, borderRadius: 4 }} />
              <div className="dash-skeleton" style={{ height: 22, width: 70, borderRadius: 4 }} />
              <div className="dash-skeleton" style={{ height: 22, width: 100, borderRadius: 4 }} />
            </div>
          </div>
          {/* Right metadata skeleton (desktop) */}
          <div className="dash-hide-mobile" style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0, minWidth: 120 }}>
            <div className="dash-skeleton" style={{ height: 11, width: 70 }} />
            <div className="dash-skeleton" style={{ height: 22, width: 86, borderRadius: 999 }} />
            <div className="dash-skeleton" style={{ height: 10, width: 60 }} />
          </div>
          {/* Actions skeleton */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <div className="dash-skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
            <div className="dash-skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading data...</span>
    </>
  );
}
