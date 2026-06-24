import type { DatabaseSchema, TableInfo } from "../types/database";
import type { PlanNode } from "../types/plan";

export type TipSeverity = "high" | "medium" | "low";

export type TipCategory =
  | "index"
  | "sort"
  | "subquery"
  | "cte"
  | "compound"
  | "join"
  | "general";

export interface PerformanceTip {
  id: string;
  severity: TipSeverity;
  category: TipCategory;
  title: string;
  description: string;
  recommendation: string;
  ddl?: string;
  nodeIds: number[];
}

function flatten(node: PlanNode | null, acc: PlanNode[] = []): PlanNode[] {
  if (!node) return acc;
  acc.push(node);
  for (const child of node.children) flatten(child, acc);
  return acc;
}

function tableByName(schema: DatabaseSchema | null): Map<string, TableInfo> {
  const map = new Map<string, TableInfo>();
  if (!schema) return map;
  for (const t of schema.tables) map.set(t.name.toLowerCase(), t);
  return map;
}

function severityForTableSize(rows: number | undefined): TipSeverity {
  if (rows == null) return "medium";
  if (rows > 2000) return "high";
  if (rows > 200) return "medium";
  return "low";
}

function indexExistsForTable(table: TableInfo | undefined): boolean {
  if (!table) return false;
  return table.indexes.some(
    (i) => !i.name.toLowerCase().startsWith("sqlite_autoindex"),
  );
}

export function analyzePlan(
  plan: PlanNode | null,
  schema: DatabaseSchema | null,
): PerformanceTip[] {
  if (!plan) return [];
  const nodes = flatten(plan);
  const tables = tableByName(schema);
  const tips: PerformanceTip[] = [];

  const scanNodes = nodes.filter((n) => n.type === "scan");
  const sortNodes = nodes.filter((n) => n.type === "sort");
  const correlated = nodes.filter(
    (n) => n.type === "subquery" && n.isExpensive,
  );
  const autoIndexNodes = nodes.filter(
    (n) =>
      n.type === "search" &&
      n.indexName?.toLowerCase().startsWith("sqlite_autoindex"),
  );
  const materializedCTEs = nodes.filter(
    (n) => n.type === "cte" && n.isExpensive,
  );
  const compoundUnionNoAll = nodes.filter(
    (n) => n.type === "compound" && Boolean(n.hint?.includes("UNION ALL")),
  );

  for (const scan of scanNodes) {
    const table = scan.tableName ? tables.get(scan.tableName.toLowerCase()) : undefined;
    const rows = table?.rowCount ?? scan.estimatedRows;
    const severity = severityForTableSize(rows);
    const hasIndex = indexExistsForTable(table);
    const tableLabel = scan.tableName ?? "a table";
    const rowText = rows ? ` (~${rows.toLocaleString()} rows)` : "";

    tips.push({
      id: `scan-${scan.id}-${tableLabel}`,
      severity,
      category: "index",
      title: `Full scan on ${tableLabel}${rowText}`,
      description:
        "SQLite reads every row in this table to satisfy the query. " +
        "On small tables this is fine, but it gets slow as the table grows.",
      recommendation: hasIndex
        ? `\`${tableLabel}\` already has indexes, but none match this query's filter or join condition. ` +
          "Check that your WHERE / JOIN columns line up with an existing index, or add one that does."
        : `If this query filters or joins on a specific column of \`${tableLabel}\`, ` +
          "create an index on that column so SQLite can use SEARCH instead of SCAN.",
      ddl:
        scan.tableName && !hasIndex
          ? `CREATE INDEX idx_${scan.tableName}_<column>\n  ON ${scan.tableName} (<column>);`
          : undefined,
      nodeIds: [scan.id],
    });
  }

  for (const sort of sortNodes) {
    const isGroupBy = sort.hint?.includes("GROUP BY");
    tips.push({
      id: `sort-${sort.id}`,
      severity: "high",
      category: "sort",
      title: isGroupBy
        ? "Temporary B-tree built for GROUP BY"
        : "Temporary B-tree built for sorting",
      description:
        "SQLite is materializing a sorted intermediate result in memory. " +
        "An index whose column order (and direction) matches the " +
        (isGroupBy ? "GROUP BY" : "ORDER BY") +
        " would let SQLite skip this step.",
      recommendation:
        "Add or extend an index on the " +
        (isGroupBy ? "GROUP BY" : "ORDER BY") +
        " column(s), in the same order, with matching ASC/DESC direction.",
      nodeIds: [sort.id],
    });
  }

  for (const sub of correlated) {
    tips.push({
      id: `subquery-${sub.id}`,
      severity: "high",
      category: "subquery",
      title: "Correlated subquery",
      description:
        "A correlated subquery runs once per outer row. On a large outer " +
        "table this multiplies the work and is one of the most common " +
        "causes of slow queries.",
      recommendation:
        "Rewrite as a JOIN (often LEFT JOIN + GROUP BY) or use a window function " +
        "so SQLite can evaluate the inner result set once.",
      nodeIds: [sub.id],
    });
  }

  for (const cte of materializedCTEs) {
    tips.push({
      id: `cte-${cte.id}`,
      severity: "medium",
      category: "cte",
      title: `Materialized CTE${cte.tableName ? `: ${cte.tableName}` : ""}`,
      description:
        "This CTE is computed once and stored in memory before being read by " +
        "the outer query. If you only reference it in one place, an inline " +
        "subquery often runs faster.",
      recommendation:
        "If the CTE is referenced only once, try inlining it as a subquery " +
        "and let SQLite fuse it with the outer query.",
      nodeIds: [cte.id],
    });
  }

  for (const auto of autoIndexNodes) {
    tips.push({
      id: `autoindex-${auto.id}`,
      severity: "low",
      category: "index",
      title: "Using an auto-generated index",
      description:
        `SQLite is using \`${auto.indexName}\`, an index it created implicitly ` +
        "from a UNIQUE or PRIMARY KEY constraint. The query works, but a " +
        "purpose-built named index on the actual filter column would be " +
        "clearer in EXPLAIN output and easier to reason about.",
      recommendation:
        "Consider creating an explicit named index on the WHERE / JOIN column.",
      nodeIds: [auto.id],
    });
  }

  for (const compound of compoundUnionNoAll) {
    tips.push({
      id: `compound-${compound.id}`,
      severity: "medium",
      category: "compound",
      title: "UNION removes duplicates",
      description:
        "Plain `UNION` forces SQLite to deduplicate rows, which means a sort. " +
        "If duplicates are impossible or fine in this result, `UNION ALL` is " +
        "strictly cheaper.",
      recommendation: "Replace `UNION` with `UNION ALL` if duplicates aren't a concern.",
      nodeIds: [compound.id],
    });
  }

  // Aggregate: many scans on different tables likely means missing FK indexes.
  if (scanNodes.length >= 2) {
    const distinctTables = new Set(
      scanNodes.map((n) => n.tableName).filter(Boolean) as string[],
    );
    if (distinctTables.size >= 2) {
      tips.push({
        id: "aggregate-multi-scan",
        severity: "high",
        category: "join",
        title: `${distinctTables.size} tables scanned in full`,
        description:
          "Multiple SCAN nodes usually means the join columns don't have " +
          "supporting indexes, so SQLite reads each table top to bottom and " +
          "matches rows in memory.",
        recommendation:
          "Add indexes on the foreign-key columns that participate in the joins. " +
          "Tables: " +
          [...distinctTables].join(", "),
        nodeIds: scanNodes.map((n) => n.id),
      });
    }
  }

  const order: Record<TipSeverity, number> = { high: 0, medium: 1, low: 2 };
  tips.sort((a, b) => order[a.severity] - order[b.severity]);
  return tips;
}
