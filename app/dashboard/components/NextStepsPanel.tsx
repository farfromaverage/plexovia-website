"use client";

import { motion } from "framer-motion";
import { Clock, Shield, TrendingUp, Building2, Mail, DollarSign, ExternalLink } from "lucide-react";

interface NextStep {
  step_type: string;
  title: string;
  description: string;
  priority: number;
  action_url: string | null;
  action_label: string | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  deadline:    <Clock className="w-4 h-4" />,
  setaside:    <Shield className="w-4 h-4" />,
  competition: <TrendingUp className="w-4 h-4" />,
  agency:      <Building2 className="w-4 h-4" />,
  contact:     <Mail className="w-4 h-4" />,
  pricing:     <DollarSign className="w-4 h-4" />,
};

function priorityBorder(priority: number): string {
  if (priority >= 9) return "border-l-red-500 dark:border-l-red-400";
  if (priority >= 6) return "border-l-amber-500 dark:border-l-amber-400";
  return "border-l-slate-300 dark:border-l-slate-600";
}

export default function NextStepsPanel({ steps }: { steps: NextStep[] | null }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--app-border)] dark:border-white/10">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)] dark:text-[var(--app-faint)] mb-3">
        Next Steps
      </h4>
      <div className="grid gap-2">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`border-l-2 bg-[var(--app-surface-2)] dark:bg-white/5 rounded-r-md p-3 pl-3 ${priorityBorder(step.priority)}`}
            aria-label={`Priority ${step.priority >= 9 ? "high" : step.priority >= 6 ? "medium" : "standard"}: ${step.title}`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-[var(--app-muted)] dark:text-[var(--app-faint)] flex-shrink-0">
                {TYPE_ICONS[step.step_type] || <ExternalLink className="w-4 h-4" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--app-text)] dark:text-white">
                  {step.title}
                </p>
                <p className="text-xs text-[var(--app-muted)] dark:text-[var(--app-faint)] mt-0.5 leading-relaxed">
                  {step.description}
                </p>
                {step.action_url && (
                  <a
                    href={step.action_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    {step.action_label || "Take action"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
