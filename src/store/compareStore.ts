import { create } from "zustand";
import { databaseEngine } from "../engine/database";
import { validateQuery } from "../engine/queryValidator";
import type { QueryResult } from "../types/database";
import type { PlanNode } from "../types/plan";

const QUERY_A = `SELECT c.name, SUM(o.total) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY total_spent DESC
LIMIT 5;`;

const QUERY_B = `SELECT c.name, SUM(o.total) AS total_spent
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC
LIMIT 5;`;

export interface CompareRun {
  query: string;
  result: QueryResult | null;
  plan: PlanNode | null;
}

interface CompareStore {
  isCompareMode: boolean;
  queryA: string;
  queryB: string;
  runA: CompareRun;
  runB: CompareRun;
  setCompareMode: (enabled: boolean) => void;
  setQueryA: (query: string) => void;
  setQueryB: (query: string) => void;
  setQueries: (queryA: string, queryB: string) => void;
  runCompare: () => void;
  copyAToB: () => void;
  swapQueries: () => void;
  clearRuns: () => void;
}

function blockedResult(message: string): QueryResult {
  return {
    columns: [],
    rows: [],
    rowCount: 0,
    executionTimeMs: 0,
    error: { message },
  };
}

function runOne(query: string): CompareRun {
  const trimmed = query.trim();
  const validation = validateQuery(trimmed);
  if (!validation.ok) {
    return {
      query,
      result: blockedResult(validation.message ?? "Query is not allowed."),
      plan: null,
    };
  }
  const result = databaseEngine.executeQuery(trimmed);
  const plan = result.error ? null : databaseEngine.explainQuery(trimmed).tree;
  return { query, result, plan };
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  isCompareMode: false,
  queryA: QUERY_A,
  queryB: QUERY_B,
  runA: { query: QUERY_A, result: null, plan: null },
  runB: { query: QUERY_B, result: null, plan: null },

  setCompareMode: (enabled) => set({ isCompareMode: enabled }),
  setQueryA: (query) => set({ queryA: query }),
  setQueryB: (query) => set({ queryB: query }),
  setQueries: (queryA, queryB) =>
    set({
      queryA,
      queryB,
      runA: { query: queryA, result: null, plan: null },
      runB: { query: queryB, result: null, plan: null },
    }),
  runCompare: () => {
    const { queryA, queryB } = get();
    set({
      runA: runOne(queryA),
      runB: runOne(queryB),
    });
  },
  copyAToB: () => {
    const { queryA } = get();
    set({ queryB: queryA });
  },
  swapQueries: () => {
    const { queryA, queryB, runA, runB } = get();
    set({ queryA: queryB, queryB: queryA, runA: runB, runB: runA });
  },
  clearRuns: () => {
    const { queryA, queryB } = get();
    set({
      runA: { query: queryA, result: null, plan: null },
      runB: { query: queryB, result: null, plan: null },
    });
  },
}));
