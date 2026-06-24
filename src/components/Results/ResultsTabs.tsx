import { useMemo } from "react";
import { useResultsStore } from "../../store/resultsStore";
import { useDatabaseStore } from "../../store/databaseStore";
import { analyzePlan } from "../../engine/performanceTips";
import { ResultsTable } from "./ResultsTable";
import { PlanGraph } from "../QueryPlan/PlanGraph";
import { PerformanceTipsPanel } from "../QueryPlan/PerformanceTipsPanel";
import { ComparePanel } from "./ComparePanel";

const TABS = [
  { id: "results", label: "Results" },
  { id: "plan", label: "Query Plan" },
  { id: "tips", label: "Tips" },
  { id: "compare", label: "Compare" },
] as const;

export function ResultsTabs() {
  const activeTab = useResultsStore((s) => s.activeTab);
  const setActiveTab = useResultsStore((s) => s.setActiveTab);
  const plan = useResultsStore((s) => s.lastPlan);
  const schema = useDatabaseStore((s) => s.schema);

  const tipsCount = useMemo(() => analyzePlan(plan, schema).length, [plan, schema]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-border px-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
            {tab.id === "tips" && tipsCount > 0 && (
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                  activeTab === "tips"
                    ? "bg-accent/20 text-accent"
                    : "bg-bg-elevated text-text-muted"
                }`}
              >
                {tipsCount}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "results" ? (
          <ResultsTable />
        ) : activeTab === "plan" ? (
          <PlanGraph />
        ) : activeTab === "tips" ? (
          <PerformanceTipsPanel />
        ) : (
          <ComparePanel />
        )}
      </div>
    </div>
  );
}
