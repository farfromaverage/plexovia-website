"use client";

import { useEffect, useState } from "react";

interface Props {
  score: number;
}

function scoreColor(score: number): { ring: string; fg: string; bg: string } {
  if (score >= 85) return { ring: "#2D8A56", fg: "#1A7742", bg: "rgba(26, 119, 66, 0.06)" };
  if (score >= 70) return { ring: "#3E9E66", fg: "#267A4A", bg: "rgba(26, 119, 66, 0.05)" };
  if (score >= 55) return { ring: "#C6913A", fg: "#A06E1A", bg: "rgba(194, 125, 26, 0.06)" };
  if (score >= 40) return { ring: "#D09E50", fg: "#A87A22", bg: "rgba(194, 125, 26, 0.05)" };
  return { ring: "#C25555", fg: "#A83A3A", bg: "rgba(194, 59, 59, 0.06)" };
}

function scoreGlow(score: number): string {
  if (score >= 85) return "0 0 8px rgba(26, 119, 66, 0.15)";
  if (score >= 70) return "0 0 6px rgba(26, 119, 66, 0.10)";
  return "none";
}

export default function ScoreBadge({ score }: Props) {
  const { ring, fg, bg } = scoreColor(score);
  const percent = Math.min(100, Math.max(0, score));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - percent / 100);
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(targetOffset));
    return () => cancelAnimationFrame(id);
  }, [targetOffset]);

  const size = 44;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="img"
      aria-label={`Match score: ${score} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "absolute", filter: scoreGlow(score) }}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill={bg} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--app-border)"
          strokeWidth="2.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.7s var(--ease-out-quart)" }}
        />
      </svg>
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: fg,
          fontFamily: "var(--font-geist-mono, monospace)",
          zIndex: 1,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
    </div>
  );
}
