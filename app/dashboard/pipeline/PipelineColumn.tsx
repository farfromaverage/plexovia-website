"use client";

import { AnimatePresence } from "framer-motion";
import PipelineCard from "./PipelineCard";
import { type PipelineItem, type StageColumn } from "./pipeline-helpers";

interface Props {
  column: StageColumn;
  onAdvance: (matchId: string, newStage: string) => Promise<void>;
  onOpen: (item: PipelineItem) => void;
  compact?: boolean;
}

export default function PipelineColumn({ column, onAdvance, onOpen, compact }: Props) {
  return (
    <div className="pipe-column">
      <div className="pipe-column-header" data-stage={column.stage}>
        <h3 className="pipe-column-label">{column.label}</h3>
        <span className="pipe-column-count" aria-label={`${column.count} items`}>{column.count}</span>
      </div>
      <div className="pipe-column-body">
        {column.items.length === 0 ? (
          <div className="pipe-column-empty">No opportunities</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {column.items.map((item) => (
              <PipelineCard
                key={item.match_id}
                item={item}
                onAdvance={onAdvance}
                onOpen={onOpen}
                compact={compact}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
