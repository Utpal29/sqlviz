import { useResultsStore } from "../../store/resultsStore";
import { ResultsTable } from "./ResultsTable";
import { PlanGraph } from "../QueryPlan/PlanGraph";
import { ComparePanel } from "./ComparePanel";

export function ResultsTabs() {
  const activeTab = useResultsStore((s) => s.activeTab);
  const setActiveTab = useResultsStore((s) => s.setActiveTab);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-border px-3">
        {(["results", "plan", "compare"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab === "plan" ? "Query Plan" : tab === "compare" ? "Compare" : "Results"}
            {activeTab === tab && (
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
        ) : (
          <ComparePanel />
        )}
      </div>
    </div>
  );
}
