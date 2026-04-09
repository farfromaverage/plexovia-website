interface Props {
  score: number;
}

export default function ScoreBadge({ score }: Props) {
  const color = score >= 90 ? "#4ADE80" : score >= 75 ? "var(--accent)" : "var(--app-muted)";
  const bg    = score >= 90 ? "rgba(74,222,128,0.1)"  : score >= 75 ? "rgba(201,168,76,0.1)"  : "var(--app-surface-2)";
  const bd    = score >= 90 ? "rgba(74,222,128,0.25)" : score >= 75 ? "rgba(201,168,76,0.3)"  : "var(--app-border)";
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
