import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Lightbulb,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";
import { analyzePlan, type PerformanceTip, type TipSeverity } from "../../engine/performanceTips";
import { useDatabaseStore } from "../../store/databaseStore";
import { useResultsStore } from "../../store/resultsStore";

const SEVERITY_BADGE: Record<TipSeverity, string> = {
  high: "border-error/40 bg-error/10 text-error",
  medium: "border-warning/40 bg-warning/10 text-warning",
  low: "border-border bg-bg-elevated text-text-muted",
};
const SEVERITY_LABEL: Record<TipSeverity, string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
};

export function PerformanceTipsPanel() {
  const plan = useResultsStore((s) => s.lastPlan);
  const lastResult = useResultsStore((s) => s.lastResult);
  const setActiveTab = useResultsStore((s) => s.setActiveTab);
  const setSelectedPlanNodeId = useResultsStore((s) => s.setSelectedPlanNodeId);
  const schema = useDatabaseStore((s) => s.schema);

  const tips = useMemo(() => analyzePlan(plan, schema), [plan, schema]);

  if (!plan) {
    if (lastResult?.error) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="max-w-md rounded-lg border border-error/30 bg-error/5 p-4 text-sm">
            <div className="mb-1 font-mono text-xs uppercase tracking-wider text-error">
              Query failed
            </div>
            <p className="text-text-primary">
              Performance tips will appear once the query runs successfully.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Run a query to see performance tips.
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <CheckCircle2 size={32} className="text-success" />
        <div>
          <div className="text-sm font-medium text-text-primary">Looks clean</div>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            No rule-based concerns found in this plan. The query is using
            indexes and avoiding expensive operations.
          </p>
        </div>
      </div>
    );
  }

  const counts: Record<TipSeverity, number> = { high: 0, medium: 0, low: 0 };
  for (const t of tips) counts[t.severity] += 1;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2">
        <div className="flex items-center gap-2">
          <ListChecks size={14} className="text-accent" />
          <span className="text-sm font-medium text-text-primary">
            {tips.length} {tips.length === 1 ? "suggestion" : "suggestions"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {counts.high > 0 && <SeverityCount severity="high" count={counts.high} />}
          {counts.medium > 0 && (
            <SeverityCount severity="medium" count={counts.medium} />
          )}
          {counts.low > 0 && <SeverityCount severity="low" count={counts.low} />}
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {tips.map((tip) => (
          <TipCard
            key={tip.id}
            tip={tip}
            onJumpToNode={(nodeId) => {
              setActiveTab("plan");
              setSelectedPlanNodeId(nodeId);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SeverityCount({ severity, count }: { severity: TipSeverity; count: number }) {
  return (
    <span
      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase ${SEVERITY_BADGE[severity]}`}
    >
      {count} {severity}
    </span>
  );
}

interface TipCardProps {
  tip: PerformanceTip;
  onJumpToNode: (nodeId: number) => void;
}

function TipCard({ tip, onJumpToNode }: TipCardProps) {
  const [open, setOpen] = useState(tip.severity === "high");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!tip.ddl) return;
    try {
      await navigator.clipboard.writeText(tip.ddl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg-elevated">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-bg-elevated/60"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text-primary">
              {tip.title}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${SEVERITY_BADGE[tip.severity]}`}
          >
            {SEVERITY_LABEL[tip.severity]}
          </span>
          <ChevronDown
            size={14}
            className={`shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border/70 px-3 pb-3 pt-2">
          <p className="text-sm text-text-primary">{tip.description}</p>
          <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider">
              <Lightbulb size={11} />
              Recommendation
            </div>
            <div className="text-text-primary">{tip.recommendation}</div>
          </div>
          {tip.ddl && (
            <div className="rounded-md border border-border bg-bg-secondary">
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  Suggested DDL
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
                >
                  <Copy size={11} />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre px-3 py-2 font-mono text-xs text-text-primary">
                {tip.ddl}
              </pre>
            </div>
          )}
          {tip.nodeIds.length > 0 && tip.nodeIds[0] >= 0 && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => onJumpToNode(tip.nodeIds[0])}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-text-muted transition-colors hover:border-border-glow hover:bg-bg-elevated hover:text-text-primary"
              >
                <Target size={11} />
                Highlight in plan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
