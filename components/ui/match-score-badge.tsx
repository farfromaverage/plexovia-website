import { cn } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score:     number;
  className?: string;
  size?:      "sm" | "md";
}

function getTier(score: number) {
  if (score >= 70) return { label: "high", class: "badge-score-high" };
  if (score >= 40) return { label: "mid",  class: "badge-score-mid"  };
  return               { label: "low",  class: "badge-score-low"  };
}

export default function MatchScoreBadge({
  score,
  className,
  size = "sm",
}: MatchScoreBadgeProps) {
  const tier = getTier(score);

  return (
    <span
      className={cn(
        "badge-score",
        tier.class,
        size === "md" && "text-sm px-3 py-1",
        className
      )}
      aria-label={`Match score ${score} out of 100`}
      role="status"
    >
      {score}
    </span>
  );
}
