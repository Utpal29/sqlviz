import { format } from "sql-formatter";

export function formatSql(sql: string): string {
  return format(sql, {
    language: "sqlite",
    keywordCase: "upper",
    linesBetweenQueries: 1,
  });
}
