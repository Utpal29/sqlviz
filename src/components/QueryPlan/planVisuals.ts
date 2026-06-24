import {
  ArrowDownUp,
  Combine,
  Database,
  Filter,
  GitMerge,
  Layers,
  Search,
  Target,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PlanNode, PlanNodeType } from "../../types/plan";

export const NODE_COLORS: Record<
  PlanNodeType,
  { fill: string; stroke: string; label: string; Icon: LucideIcon }
> = {
  scan: { fill: "#8B5CF6", stroke: "#A78BFA", label: "SCAN", Icon: Database },
  search: { fill: "#06B6D4", stroke: "#67E8F9", label: "SEARCH", Icon: Search },
  sort: { fill: "#F97316", stroke: "#FB923C", label: "SORT", Icon: ArrowDownUp },
  filter: { fill: "#3B82F6", stroke: "#60A5FA", label: "FILTER", Icon: Filter },
  join: { fill: "#EC4899", stroke: "#F472B6", label: "JOIN", Icon: Combine },
  subquery: { fill: "#6366F1", stroke: "#818CF8", label: "SUBQUERY", Icon: Layers },
  compound: { fill: "#6366F1", stroke: "#818CF8", label: "COMPOUND", Icon: GitMerge },
  cte: { fill: "#14B8A6", stroke: "#2DD4BF", label: "CTE", Icon: Workflow },
  root: { fill: "#64748B", stroke: "#94A3B8", label: "RESULT", Icon: Target },
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

export function topHint(root: PlanNode | null): { node: PlanNode; hint: string } | null {
  if (!root) return null;
  const all = flattenPlan(root).filter((n) => Boolean(n.hint));
  if (all.length === 0) return null;
  const expensive = all.find((n) => n.isExpensive);
  const chosen = expensive ?? all[0];
  return { node: chosen, hint: chosen.hint! };
}

function tableLabel(node: PlanNode): string {
  if (!node.tableName) return "a table";
  // SQLite aliases are 1-2 char identifiers; expand them to the table-name detail.
  if (node.tableName.length <= 2 && node.detail) {
    const match = node.detail.match(/(?:SCAN|SEARCH)\s+(\w+)\s+AS\s+(\w+)/i);
    if (match) return `${match[1]} (as ${match[2]})`;
  }
  return node.tableName;
}

export function captionFor(node: PlanNode | undefined, step: number, total: number): string {
  if (!node) return "Run a query to inspect its execution plan.";

  const prefix = total > 1 ? `Step ${step + 1} of ${total}: ` : "";
  switch (node.type) {
    case "scan":
      return `${prefix}Full scan of ${tableLabel(node)} — every row is read.`;
    case "search":
      return `${prefix}Index lookup on ${tableLabel(node)}${node.indexName ? ` using ${node.indexName}` : ""}.`;
    case "sort":
      return `${prefix}Building a temporary B-tree to sort or group rows.`;
    case "join":
      return `${prefix}Joining rows from multiple sources.`;
    case "subquery":
      return `${prefix}Evaluating a ${node.isExpensive ? "correlated " : ""}subquery.`;
    case "cte":
      return `${prefix}Preparing CTE ${node.tableName ?? ""}${node.isExpensive ? " (materialized)" : ""}.`.replace(/\s+$/, "");
    case "compound":
      return `${prefix}Combining multiple result sets.`;
    case "filter":
      return `${prefix}Applying a filter step.`;
    case "root":
      return `${prefix}Final result assembled from the sub-plans below.`;
  }
}
