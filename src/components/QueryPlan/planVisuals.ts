import type { PlanNode, PlanNodeType } from "../../types/plan";

export const NODE_COLORS: Record<
  PlanNodeType,
  { fill: string; stroke: string; label: string }
> = {
  scan: { fill: "#8B5CF6", stroke: "#A78BFA", label: "SCAN" },
  search: { fill: "#06B6D4", stroke: "#67E8F9", label: "SEARCH" },
  sort: { fill: "#F97316", stroke: "#FB923C", label: "SORT" },
  filter: { fill: "#3B82F6", stroke: "#60A5FA", label: "FILTER" },
  join: { fill: "#EC4899", stroke: "#F472B6", label: "JOIN" },
  subquery: { fill: "#6366F1", stroke: "#818CF8", label: "SUBQUERY" },
  compound: { fill: "#6366F1", stroke: "#818CF8", label: "COMPOUND" },
  cte: { fill: "#14B8A6", stroke: "#2DD4BF", label: "CTE" },
};

export const PLAN_NODE_TYPES = Object.keys(NODE_COLORS) as PlanNodeType[];

export function executionOrder(root: PlanNode): PlanNode[] {
  const ordered: PlanNode[] = [];
  const visit = (node: PlanNode) => {
    node.children.forEach(visit);
    ordered.push(node);
  };
  visit(root);
  return ordered;
}

export function planSignature(node: PlanNode): string {
  return [
    node.type,
    node.tableName ?? "",
    node.indexName ?? "",
    node.detail.replace(/\s+/g, " ").trim(),
  ].join("|");
}

export function flattenPlan(node: PlanNode | null): PlanNode[] {
  if (!node) return [];
  return [node, ...node.children.flatMap(flattenPlan)];
}

export function captionFor(node: PlanNode | undefined, step: number, total: number): string {
  if (!node) return "Run a query to inspect its execution plan.";

  const prefix = `Step ${step + 1} of ${total}: `;
  switch (node.type) {
    case "scan":
      return `${prefix}SQLite scans ${node.tableName ?? "a table"} row by row.`;
    case "search":
      return `${prefix}SQLite uses ${node.indexName ?? "an index"} to narrow the lookup.`;
    case "sort":
      return `${prefix}SQLite builds temporary ordering work for this result.`;
    case "join":
      return `${prefix}SQLite combines rows from multiple sources.`;
    case "subquery":
      return `${prefix}SQLite evaluates a nested query.`;
    case "cte":
      return `${prefix}SQLite prepares a common table expression.`;
    case "compound":
      return `${prefix}SQLite combines multiple result sets.`;
    case "filter":
      return `${prefix}SQLite applies the query operation.`;
  }
}
