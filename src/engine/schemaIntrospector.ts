import type { Database } from "sql.js";
import type { ColumnInfo, DatabaseSchema, ForeignKey, IndexInfo, TableInfo } from "../types/database";

export function introspectSchema(db: Database): DatabaseSchema {
  const tablesRes = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  if (tablesRes.length === 0) return { tables: [] };

  const tableNames = tablesRes[0].values.map((row) => row[0] as string);
  const tables: TableInfo[] = [];

  for (const name of tableNames) {
    const columns: ColumnInfo[] = [];
    const colRes = db.exec(`PRAGMA table_info(${name})`);
    if (colRes[0]) {
      for (const row of colRes[0].values) {
        columns.push({
          name: row[1] as string,
          type: row[2] as string,
          isNotNull: Boolean(row[3]),
          defaultValue: row[4] != null ? String(row[4]) : undefined,
          isPrimaryKey: Boolean(row[5]),
        });
      }
    }

    const foreignKeys: ForeignKey[] = [];
    const fkRes = db.exec(`PRAGMA foreign_key_list(${name})`);
    if (fkRes[0]) {
      for (const row of fkRes[0].values) {
        foreignKeys.push({
          fromColumn: row[3] as string,
          toTable: row[2] as string,
          toColumn: row[4] as string,
        });
      }
    }

    const indexes: IndexInfo[] = [];
    const ixRes = db.exec(`PRAGMA index_list(${name})`);
    if (ixRes[0]) {
      for (const row of ixRes[0].values) {
        const ixName = row[1] as string;
        const isUnique = Boolean(row[2]);
        const cols: string[] = [];
        const ixCols = db.exec(`PRAGMA index_info(${ixName})`);
        if (ixCols[0]) {
          for (const c of ixCols[0].values) cols.push(c[2] as string);
        }
        indexes.push({ name: ixName, columns: cols, isUnique });
      }
    }

    let rowCount: number;
    try {
      const countRes = db.exec(`SELECT COUNT(*) FROM ${name}`);
      rowCount = (countRes[0]?.values[0]?.[0] as number) ?? 0;
    } catch {
      rowCount = 0;
    }

    tables.push({ name, columns, foreignKeys, indexes, rowCount });
  }

  return { tables };
}
