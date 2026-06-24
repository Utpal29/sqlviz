import type { ExplainResult, ExplainRow, PlanNode, PlanNodeType } from "../types/plan";

function classify(detail: string): { type: PlanNodeType; isExpensive: boolean; tableName?: string; indexName?: string; hint?: string } {
  const d = detail.toUpperCase();

  if (d.includes("USE TEMP B-TREE")) {
    const forGroupBy = d.includes("GROUP BY");
    const forOrderBy = d.includes("ORDER BY");
    const target = forGroupBy ? "GROUP BY" : forOrderBy ? "ORDER BY" : "sort";
    return {
      type: "sort",
      isExpensive: true,
      hint: `SQLite is building a temporary B-tree for the ${target}. An index that matches the ${target} columns (in order, same direction) would let it skip this step.`,
    };
  }
  if (d.startsWith("CO-ROUTINE") || d.includes("MATERIALIZE")) {
    const m = detail.match(/(?:CO-ROUTINE|MATERIALIZE)\s+(\w+)/i);
    const isMaterialized = d.includes("MATERIALIZE");
    return {
      type: "cte",
      isExpensive: isMaterialized,
      tableName: m?.[1],
      hint: isMaterialized
        ? `The CTE ${m?.[1] ?? ""} is materialized — its rows are computed once and held in memory. If it's only used once, an inline subquery may be faster.`
        : undefined,
    };
  }
  if (d.startsWith("COMPOUND")) {
    const isUnionAll = d.includes("UNION ALL");
    return {
      type: "compound",
      isExpensive: false,
      hint: isUnionAll
        ? undefined
        : "UNION (without ALL) removes duplicates, which forces a sort. If duplicates are impossible or fine, UNION ALL is cheaper.",
    };
  }
  if (d.includes("SUBQUERY") || d.includes("CORRELATED")) {
    const correlated = d.includes("CORRELATED");
    return {
      type: "subquery",
      isExpensive: correlated,
      hint: correlated
        ? "Correlated subquery — runs once per outer row. Rewriting as a JOIN or window function is usually much faster."
        : undefined,
    };
  }
  if (d.includes("MERGE") && (d.includes("JOIN") || d.includes("(JOIN"))) {
    return { type: "join", isExpensive: false };
  }
  if (d.startsWith("SEARCH")) {
    const tableMatch = detail.match(/SEARCH\s+(\w+)/i);
    const indexMatch = detail.match(/USING\s+(?:COVERING\s+)?INDEX\s+(\w+)/i);
    const isCovering = d.includes("COVERING INDEX");
    const isAutoIndex = indexMatch?.[1]?.toLowerCase().startsWith("sqlite_autoindex");
    const hint = isAutoIndex
      ? `Using an auto-generated index (likely a UNIQUE or PRIMARY KEY constraint). Works, but a purpose-built named index on the filter column may be clearer.`
      : isCovering
        ? `Covering index — all needed columns are in the index, so SQLite doesn't have to touch the table. This is the best case.`
        : undefined;
    return {
      type: "search",
      isExpensive: false,
      tableName: tableMatch?.[1],
      indexName: indexMatch?.[1],
      hint,
    };
  }
  if (d.startsWith("SCAN")) {
    const tableMatch = detail.match(/SCAN\s+(\w+)/i);
    const usingIndex = d.includes("USING INDEX") || d.includes("USING COVERING INDEX");
    return {
      type: "scan",
      isExpensive: !usingIndex,
      tableName: tableMatch?.[1],
      hint: tableMatch?.[1]
        ? usingIndex
          ? `Scanning ${tableMatch[1]} via an index — every row is read in index order. Cheaper than a full table scan but still O(n).`
          : `Full table scan on ${tableMatch[1]} — every row is read. If a column is filtered in WHERE or used in ORDER BY, an index on it would let SQLite use SEARCH instead.`
        : undefined,
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
        root = {
          id: -1,
          type: "root",
          detail: "Final result",
          tableName: "Result",
          isExpensive: false,
          children: [],
        };
      }
      root.children.push(node);
    } else {
      nodes.get(row.parent)!.children.push(node);
    }
  }

  if (root && root.children.length === 1) root = root.children[0];
  return { raw: rows, tree: root };
}
