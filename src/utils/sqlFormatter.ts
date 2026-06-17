export async function formatSql(sql: string): Promise<string> {
  const { format } = await import("sql-formatter");
  return format(sql, {
    language: "sqlite",
    keywordCase: "upper",
    linesBetweenQueries: 1,
  });
}
