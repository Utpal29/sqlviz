import type { ExplainResult, ExplainRow, PlanNode, PlanNodeType } from "../types/plan";

function classify(detail: string): { type: PlanNodeType; isExpensive: boolean; tableName?: string; indexName?: string; hint?: string } {
  const d = detail.toUpperCase();

  if (d.includes("USE TEMP B-TREE")) {
    return { type: "sort", isExpensive: true, hint: "A temporary B-tree is being built — consider adding an index that matches the ORDER BY or GROUP BY." };
  }
  if (d.startsWith("CO-ROUTINE") || d.includes("MATERIALIZE")) {
    const m = detail.match(/(?:CO-ROUTINE|MATERIALIZE)\s+(\w+)/i);
    return { type: "cte", isExpensive: false, tableName: m?.[1] };
  }
  if (d.startsWith("COMPOUND")) {
    return { type: "compound", isExpensive: false };
  }
  if (d.includes("SUBQUERY") || d.includes("CORRELATED")) {
    return { type: "subquery", isExpensive: d.includes("CORRELATED") };
  }
  if (d.includes("MERGE") && (d.includes("JOIN") || d.includes("(JOIN"))) {
    return { type: "join", isExpensive: false };
  }
  if (d.startsWith("SEARCH")) {
    const tableMatch = detail.match(/SEARCH\s+(\w+)/i);
    const indexMatch = detail.match(/USING\s+(?:COVERING\s+)?INDEX\s+(\w+)/i);
    return { type: "search", isExpensive: false, tableName: tableMatch?.[1], indexName: indexMatch?.[1] };
  }
  if (d.startsWith("SCAN")) {
    const tableMatch = detail.match(/SCAN\s+(\w+)/i);
    return {
      type: "scan",
      isExpensive: true,
      tableName: tableMatch?.[1],
      hint: tableMatch?.[1] ? `Full table scan on ${tableMatch[1]}. If a column is filtered in WHERE, consider indexing it.` : undefined,
    };
  }
  return { type: "filter", isExpensive: false };
}

export function parseExplain(rows: ExplainRow[]): ExplainResult {
  if (rows.length === 0) return { raw: rows, tree: null };

  const nodes = new Map<number, PlanNode>();
  for (const row of rows) {
    const info = classify(row.detail);
    nodes.set(row.id, {
      id: row.id,
      detail: row.detail,
      type: info.type,
      isExpensive: info.isExpensive,
      tableName: info.tableName,
      indexName: info.indexName,
      hint: info.hint,
      children: [],
    });
  }

  let root: PlanNode | null = null;
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    if (row.parent === 0 || !nodes.has(row.parent)) {
      if (!root) {
        root = { id: -1, type: "filter", detail: "QUERY", isExpensive: false, children: [] };
      }
      root.children.push(node);
    } else {
      nodes.get(row.parent)!.children.push(node);
    }
  }

  if (root && root.children.length === 1) root = root.children[0];
  return { raw: rows, tree: root };
}
