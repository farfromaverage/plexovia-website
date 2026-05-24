interface Props {
  score: number
}

function scoreColor(score: number): { ring: string; fg: string } {
  if (score >= 85) return { ring: "#2D8A56", fg: "#1A7742" }
  if (score >= 70) return { ring: "#3E9E66", fg: "#267A4A" }
  if (score >= 55) return { ring: "#C6913A", fg: "#A06E1A" }
  if (score >= 40) return { ring: "#D09E50", fg: "#A87A22" }
  return { ring: "#C25555", fg: "#A83A3A" }
}

export default function ScoreBadge({ score }: Props) {
  const { ring, fg } = scoreColor(score)
  const percent = Math.min(100, Math.max(0, score))
  const circumference = 2 * Math.PI * 14
  const offset = circumference * (1 - percent / 100)

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: 38, height: 38 }}>
      <svg width="38" height="38" viewBox="0 0 38 38" style={{ position: "absolute" }}>
        <circle cx="19" cy="19" r="14" fill="none" stroke="var(--app-border)" strokeWidth="2" />
        <circle
          cx="19" cy="19" r="14"
          fill="none" stroke={ring} strokeWidth="2"
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
