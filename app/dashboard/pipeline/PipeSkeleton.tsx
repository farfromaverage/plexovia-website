/**
 * PipeSkeleton — Skeleton loading state matching the kanban board layout.
 * Uses the existing `dash-skeleton` shimmer class from dashboard.css.
 * Renders 4 skeleton columns (matching ACTIVE_STAGES) with placeholder cards.
 */
const SKELETON_STAGES = ["qualifying", "pursuing", "proposal_in_progress", "submitted"] as const;

export default function PipeSkeleton() {
  return (
    <div className="dash-main" role="status" aria-label="Loading pipeline">
      {/* Header skeleton */}
      <div className="pipe-skel-header">
        <div className="pipe-skel-header-left">
          <div className="dash-skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="dash-skeleton" style={{ width: 120, height: 22, borderRadius: 4 }} />
            <div className="dash-skeleton" style={{ width: 200, height: 13, borderRadius: 4 }} />
          </div>
        </div>
        <div className="dash-skeleton" style={{ width: 90, height: 34, borderRadius: 6 }} />
      </div>

      {/* Intelligence strip skeleton */}
      <div className="pipe-skel-intel">
        <div className="dash-skeleton" style={{ width: 180, height: 30, borderRadius: 6 }} />
        <div className="dash-skeleton" style={{ width: 160, height: 30, borderRadius: 6 }} />
      </div>

      {/* Command bar skeleton */}
      <div className="pipe-skel-command">
        <div className="dash-skeleton" style={{ width: 300, height: 36, borderRadius: 6 }} />
        <div className="dash-skeleton" style={{ width: 140, height: 36, borderRadius: 6 }} />
      </div>

      {/* Scorecard skeleton */}
      <div className="pipe-skel-scorecard">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pipe-skel-stat">
            <div className="dash-skeleton" style={{ width: 48, height: 24, borderRadius: 4 }} />
            <div className="dash-skeleton" style={{ width: 70, height: 11, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Board skeleton — 4 columns with placeholder cards */}
      <div className="pipe-board">
        {SKELETON_STAGES.map((stage, colIdx) => (
          <div key={stage} className="pipe-column" aria-hidden="true">
            <div className="pipe-column-header" data-stage={stage}>
              <div className="dash-skeleton" style={{ width: 80, height: 14, borderRadius: 4 }} />
              <div className="dash-skeleton" style={{ width: 20, height: 20, borderRadius: 999 }} />
            </div>
            <div className="pipe-column-body">
              {Array.from({ length: colIdx === 0 ? 3 : colIdx === 1 ? 2 : 1 }).map((_, cardIdx) => (
                <div key={cardIdx} className="pipe-skel-card">
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    <div className="dash-skeleton" style={{ width: 28, height: 20, borderRadius: 4 }} />
                    <div className="dash-skeleton" style={{ width: 50, height: 20, borderRadius: 4 }} />
                  </div>
                  <div className="dash-skeleton" style={{ width: "90%", height: 13, borderRadius: 4, marginBottom: 4 }} />
                  <div className="dash-skeleton" style={{ width: "60%", height: 13, borderRadius: 4, marginBottom: 8 }} />
                  <div className="dash-skeleton" style={{ width: "70%", height: 11, borderRadius: 4, marginBottom: 4 }} />
                  <div style={{ display: "flex", gap: 4 }}>
                    <div className="dash-skeleton" style={{ width: 40, height: 10, borderRadius: 3 }} />
                    <div className="dash-skeleton" style={{ width: 30, height: 10, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading your pipeline opportunities...</span>
    </div>
  );
}
