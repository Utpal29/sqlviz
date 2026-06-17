export interface QueryValidationResult {
  ok: boolean;
  message?: string;
}

const MUTATING_KEYWORDS = [
  "ALTER",
  "ATTACH",
  "CREATE",
  "DELETE",
  "DETACH",
  "DROP",
  "INSERT",
  "REINDEX",
  "REPLACE",
  "UPDATE",
  "VACUUM",
];

function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ")
    .trim();
}

function stripStringLiterals(sql: string): string {
  return sql
    .replace(/'([^']|'')*'/g, "''")
    .replace(/"([^"]|"")*"/g, '""');
}

function hasMultipleStatements(sql: string): boolean {
  const withoutTrailingSemicolon = sql.replace(/;\s*$/, "");
  return withoutTrailingSemicolon.includes(";");
}

export function validateQuery(sql: string): QueryValidationResult {
  const cleaned = stripComments(sql);

  if (!cleaned) {
    return { ok: false, message: "Write a SQL query before running." };
  }

  if (hasMultipleStatements(cleaned)) {
    return {
      ok: false,
      message: "Run one read-only statement at a time so the plan stays clear.",
    };
  }

  const firstKeyword = cleaned.match(/^[a-zA-Z]+/)?.[0].toUpperCase();
  if (!firstKeyword) {
    return { ok: false, message: "The query must start with a SQL keyword." };
  }

  if (MUTATING_KEYWORDS.includes(firstKeyword)) {
    return {
      ok: false,
      message: `${firstKeyword} is blocked for now. Use Reset Dataset for a clean seeded database.`,
    };
  }

  const keywordScanTarget = stripStringLiterals(cleaned).toUpperCase();
  const blockedKeyword = MUTATING_KEYWORDS.find((keyword) =>
    new RegExp(`\\b${keyword}\\b`).test(keywordScanTarget)
  );
  if (blockedKeyword) {
    return {
      ok: false,
      message: `${blockedKeyword} is blocked for now. Use Reset Dataset for a clean seeded database.`,
    };
  }

  if (!["SELECT", "WITH", "EXPLAIN"].includes(firstKeyword)) {
    return {
      ok: false,
      message: "Only SELECT, WITH, and EXPLAIN queries are enabled in the playground right now.",
    };
  }

  return { ok: true };
}
