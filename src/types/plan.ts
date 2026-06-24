export type PlanNodeType =
  | "scan"
  | "search"
  | "sort"
  | "filter"
  | "join"
  | "subquery"
  | "compound"
  | "cte"
  | "root";

export interface PlanNode {
  id: number;
  type: PlanNodeType;
  detail: string;
  tableName?: string;
  indexName?: string;
  isExpensive: boolean;
  hint?: string;
  estimatedRows?: number;
  children: PlanNode[];
}

export interface ExplainRow {
  id: number;
  parent: number;
  detail: string;
}

export interface ExplainResult {
  raw: ExplainRow[];
  tree: PlanNode | null;
}
