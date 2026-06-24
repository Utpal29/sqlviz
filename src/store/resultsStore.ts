import { create } from "zustand";
import { databaseEngine } from "../engine/database";
import { validateQuery } from "../engine/queryValidator";
import { useHistoryStore } from "./historyStore";
import type { QueryResult } from "../types/database";
import type { PlanNode } from "../types/plan";

type Tab = "results" | "plan" | "compare";

interface ResultsStore {
  lastResult: QueryResult | null;
  lastPlan: PlanNode | null;
  activeTab: Tab;
  selectedPlanNodeId: number | null;
  runQuery: (sql: string) => void;
  setActiveTab: (t: Tab) => void;
  setSelectedPlanNodeId: (id: number | null) => void;
}

export const useResultsStore = create<ResultsStore>((set) => ({
  lastResult: null,
  lastPlan: null,
  activeTab: "results",
  selectedPlanNodeId: null,

  setSelectedPlanNodeId: (id) => set({ selectedPlanNodeId: id }),

  runQuery: (sql) => {
    const trimmed = sql.trim();
    if (!trimmed) return;
    const validation = validateQuery(trimmed);
    if (!validation.ok) {
      set({
        lastResult: {
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: 0,
          error: { message: validation.message ?? "Query is not allowed." },
        },
        lastPlan: null,
        activeTab: "results",
      });
      return;
    }
    const result = databaseEngine.executeQuery(trimmed);
    const plan = databaseEngine.explainQuery(trimmed);
    if (!result.error) {
      useHistoryStore.getState().addItem({
        query: trimmed,
        dataset: databaseEngine.currentDataset,
        rowCount: result.rowCount,
        executionTimeMs: result.executionTimeMs,
        hasPlan: plan.tree != null,
      });
    }
    set({ lastResult: result, lastPlan: plan.tree, selectedPlanNodeId: null });
  },

  setActiveTab: (t) => set({ activeTab: t }),
}));
