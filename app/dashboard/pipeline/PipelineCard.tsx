"use client";

import { useMemo } from "react";
import { ChevronRight, Clock, Shield, FileText, BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";
import {
  type PipelineItem,
  type UrgencyLevel,
  scoreLevel,
  fmtDeadline,
  fmtUpdated,
  fmtSetAside,
  fmtValueShort,
  isTerminal,
  nextStage,
  STAGE_LABELS,
} from "./pipeline-helpers";

interface Props {
  item: PipelineItem;
  onAdvance: (matchId: string, newStage: string) => Promise<void>;
  onOpen: (item: PipelineItem) => void;
  compact?: boolean;
}

const densityTheme: Record<string, { color: string; bg: string; border: string }> = {
  "Low Competition": { color: "var(--success)", bg: "var(--success-subtle)", border: "var(--success-border)" },
  "High Competition": { color: "var(--danger)", bg: "var(--danger-subtle)", border: "var(--danger-border)" },
  "Medium Competition": { color: "var(--warning)", bg: "var(--warning-subtle)", border: "var(--warning-border)" },
};

const urgencyLabel: Record<UrgencyLevel, string> = {
  safe: "on track",
  warning: "deadline approaching",
  danger: "deadline urgent",
  expired: "deadline expired",
  none: "no deadline",
};

export default function PipelineCard({ item, onAdvance, onOpen, compact }: Props) {
  const deadline = fmtDeadline(item.deadline);
  const next = nextStage(item.pipeline_stage);
  const terminal = isTerminal(item.pipeline_stage);
  const sl = scoreLevel(item.score);
  const dt = useMemo(() => densityTheme[item.density_label] || null, [item.density_label]);

  const handleAdvance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (next) await onAdvance(item.match_id, next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(item);
    }
  };

  const valueStr = fmtValueShort(item);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
    >
      <div
        className="pipe-card"
        data-urgency={deadline.urgency}
        role="button"
        tabIndex={0}
        onClick={() => onOpen(item)}
        onKeyDown={handleKeyDown}
        aria-label={`${item.title} — ${item.agency}, score ${item.score}, ${deadline.label}, ${urgencyLabel[deadline.urgency]}`}
      >
        <div className="pipe-card-top">
          <div className="pipe-card-badges">
            <span className="pipe-card-score" data-level={sl} aria-label={`Match score ${item.score}`}>
              {item.score}
            </span>
            <span className="pipe-card-deadline" data-urgency={deadline.urgency}>
              <Clock size={10} aria-hidden="true" />
              {deadline.label}
            </span>
            {dt && (
              <span
                className="pipe-card-density"
                style={{ color: dt.color, background: dt.bg, borderColor: dt.border }}
              >
                <Users size={9} aria-hidden="true" />
                {item.density_label}
              </span>
            )}
          </div>
          {!terminal && next && (
            <button
              className="pipe-card-advance"
              onClick={handleAdvance}
              aria-label={`Advance from ${STAGE_LABELS[item.pipeline_stage]} to ${STAGE_LABELS[next]}`}
              title={`Advance to ${STAGE_LABELS[next]}`}
            >
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <p className="pipe-card-title">{item.title}</p>

        <div className="pipe-card-agency">
          <Shield size={10} aria-hidden="true" />
          <span>{item.agency}</span>
          {item.naics_code && (
            <span className="pipe-card-naics" title={item.naics_title}>
              · {item.naics_code}
            </span>
          )}
        </div>

        <div className="pipe-card-meta">
          {!compact && valueStr && (
            <span className="pipe-card-meta-item">
              <span className="pipe-card-value">{valueStr}</span>
            </span>
          )}
          {!compact && item.set_aside && (
            <span className="pipe-card-set-aside">{fmtSetAside(item.set_aside)}</span>
          )}
          {item.pipeline_notes && (
            <span className="pipe-card-meta-item" title="Has research notes">
              <FileText size={9} aria-hidden="true" />
            </span>
          )}
          {!terminal && item.award_count > 0 && (
            <span className="pipe-card-meta-item">
              <BarChart3 size={9} aria-hidden="true" />
              <span className="pipe-card-award">{item.award_count}</span>
            </span>
          )}
          {item.pipeline_updated_at && !compact && (
            <span className="pipe-card-meta-item" style={{ marginLeft: "auto" }}>
              {fmtUpdated(item.pipeline_updated_at)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
