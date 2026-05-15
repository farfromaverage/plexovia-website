interface Props {
  score: number;
}

export default function ScoreBadge({ score }: Props) {
  const color = score >= 90 ? "var(--success)" : score >= 75 ? "var(--accent)" : "var(--app-muted)";
  const bg    = score >= 90 ? "var(--success-subtle)"  : score >= 75 ? "var(--accent-subtle)"  : "var(--app-surface-2)";
  const bd    = score >= 90 ? "rgba(26,119,66,0.2)" : score >= 75 ? "var(--accent-border)"  : "var(--app-border)";
  const label = score >= 90 ? "High match" : score >= 75 ? "Medium match" : "Low match";

  return (
    <span
      aria-label={`${label}: ${score} percent`}
      title={`Match score: ${score}%`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        background: bg,
        border: `1px solid ${bd}`,
        borderRadius: 999,
        fontSize: "0.72rem",
        fontWeight: 700,
        color,
        fontFamily: "var(--font-geist-mono, monospace)",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {score}%
    </span>
  );
}
