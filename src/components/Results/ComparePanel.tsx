import type { CompareRun } from "../../store/compareStore";
import { useCompareStore } from "../../store/compareStore";
import { PlanCanvas } from "../QueryPlan/PlanCanvas";
import { PlanLegend } from "../QueryPlan/PlanLegend";
import { flattenPlan, planSignature } from "../QueryPlan/planVisuals";
import type { PlanNode, PlanNodeType } from "../../types/plan";

const NODE_LABELS: Record<PlanNodeType, string> = {
  scan: "SCAN",
  search: "SEARCH",
  sort: "SORT",
  filter: "FILTER",
  join: "JOIN",
  subquery: "SUBQUERY",
  compound: "COMPOUND",
  cte: "CTE",
  root: "RESULT",
};

const COMPARE_TYPES: PlanNodeType[] = ["scan", "search", "sort"];

function metric(run: CompareRun): {
  rows: string;
  time: string;
  nodes: PlanNode[];
  expensiveCount: number;
  typeCounts: Record<PlanNodeType, number>;
} {
  const nodes = flattenPlan(run.plan);
  const typeCounts = Object.keys(NODE_LABELS).reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<PlanNodeType, number>
  );
  for (const node of nodes) {
    typeCounts[node.type] += 1;
  }
  return {
    rows: run.result?.error ? "error" : `${run.result?.rowCount ?? 0}`,
    time: run.result?.error ? "-" : `${(run.result?.executionTimeMs ?? 0).toFixed(1)} ms`,
    nodes,
    expensiveCount: nodes.filter((node) => node.isExpensive).length,
    typeCounts,
  };
}

function CompareCard({
  label,
  run,
  baseline,
  diffSignatures,
}: {
  label: string;
  run: CompareRun;
  baseline: ReturnType<typeof metric>;
  diffSignatures: Set<string>;
}) {
  const data = metric(run);

  return (
    <section className="flex min-h-0 flex-1 flex-col border-r border-border last:border-r-0">
      <div className="border-b border-border px-4 py-3">
        <div className="font-mono text-xs uppercase tracking-wider text-text-muted">
          {label}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-xs text-text-muted">Rows</div>
            <div className="font-mono text-text-primary">{data.rows}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Time</div>
            <div className="font-mono text-text-primary">{data.time}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">Expensive</div>
            <div className="font-mono text-text-primary">{data.expensiveCount}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {COMPARE_TYPES.map((type) => {
            const changed = data.typeCounts[type] !== baseline.typeCounts[type];
            return (
              <div
                key={type}
                className={`rounded border px-2 py-1 ${
                  changed
                    ? "border-warning/40 bg-warning/10 text-warning"
                    : "border-border bg-bg-secondary text-text-muted"
                }`}
              >
                <div className="font-mono text-[10px] uppercase">
                  {NODE_LABELS[type]}
                </div>
                <div className="font-mono text-sm">{data.typeCounts[type]}</div>
              </div>
            );
          })}
          <div
            className={`rounded border px-2 py-1 ${
              data.expensiveCount !== baseline.expensiveCount
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-border bg-bg-secondary text-text-muted"
            }`}
          >
            <div className="font-mono text-[10px] uppercase">Exp</div>
            <div className="font-mono text-sm">{data.expensiveCount}</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {run.result?.error ? (
          <pre className="whitespace-pre-wrap font-mono text-sm text-error">
            {run.result.error.message}
          </pre>
        ) : data.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            Run compare to inspect this query.
          </div>
        ) : (
          <PlanCanvas
            plan={run.plan!}
            zoom={0.78}
            diffSignatures={diffSignatures}
            compact
          />
        )}
      </div>
    </section>
  );
}

export function ComparePanel() {
  const isCompareMode = useCompareStore((s) => s.isCompareMode);
  const runA = useCompareStore((s) => s.runA);
  const runB = useCompareStore((s) => s.runB);
  const copyAToB = useCompareStore((s) => s.copyAToB);
  const swapQueries = useCompareStore((s) => s.swapQueries);

  if (!isCompareMode) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Turn on Compare in the editor toolbar to run two query plans side by side.
      </div>
    );
  }

  const metricA = metric(runA);
  const metricB = metric(runB);
  const signaturesA = new Set(metricA.nodes.map(planSignature));
  const signaturesB = new Set(metricB.nodes.map(planSignature));
  const diffA = new Set([...signaturesA].filter((signature) => !signaturesB.has(signature)));
  const diffB = new Set([...signaturesB].filter((signature) => !signaturesA.has(signature)));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="text-sm text-text-muted">
          Compare node counts and expensive plan work between query rewrites.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAToB}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            Copy A to B
          </button>
          <button
            type="button"
            onClick={swapQueries}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            Swap A/B
          </button>
        </div>
      </div>
      <PlanLegend />
      <div className="flex min-h-0 flex-1">
        <CompareCard
          label="Query A"
          run={runA}
          baseline={metricB}
          diffSignatures={diffA}
        />
        <CompareCard
          label="Query B"
          run={runB}
          baseline={metricA}
          diffSignatures={diffB}
        />
      </div>
    </div>
  );
}
