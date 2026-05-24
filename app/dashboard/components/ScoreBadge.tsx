interface Props {
  score: number
}

function scoreColor(score: number): { bg: string; border: string; fg: string } {
  if (score >= 85) return { bg: "var(--success-subtle)", border: "rgba(26,119,66,0.3)", fg: "var(--success)" }
  if (score >= 70) return { bg: "rgba(26,119,66,0.06)", border: "rgba(26,119,66,0.15)", fg: "var(--success)" }
  if (score >= 55) return { bg: "var(--warning-subtle)", border: "rgba(194,125,26,0.3)", fg: "var(--warning)" }
  if (score >= 40) return { bg: "rgba(194,125,26,0.06)", border: "rgba(194,125,26,0.15)", fg: "var(--warning)" }
  return { bg: "var(--danger-subtle)", border: "rgba(194,59,59,0.3)", fg: "var(--danger)" }
}

export default function ScoreBadge({ score }: Props) {
  const { bg, border, fg } = scoreColor(score)
  const percent = Math.min(100, Math.max(0, score))
  const circumference = 2 * Math.PI * 14
  const offset = circumference * (1 - percent / 100)

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: 38, height: 38 }}>
      <svg width="38" height="38" viewBox="0 0 38 38" style={{ position: "absolute" }}>
        <circle cx="19" cy="19" r="14" fill="none" stroke="var(--app-border)" strokeWidth="2.5" />
        <circle
          cx="19" cy="19" r="14"
          fill="none" stroke={fg} strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 19 19)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span style={{
        fontSize: "0.72rem", fontWeight: 700, color: fg,
        fontFamily: "var(--font-geist-mono, monospace)", zIndex: 1,
        lineHeight: 1
      }}>
        {score}
      </span>
    </div>
  )
}
