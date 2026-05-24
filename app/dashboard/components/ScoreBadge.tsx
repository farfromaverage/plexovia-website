interface Props {
  score: number
}

export default function ScoreBadge({ score }: Props) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444"
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 8,
        background: `${color}15`, border: `1.5px solid ${color}40`,
        fontSize: "0.75rem", fontWeight: 700, color,
        fontFamily: "var(--font-geist-mono, monospace)",
      }}>
        {score}
      </span>
    </div>
  )
}
