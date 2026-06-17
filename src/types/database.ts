export type DatasetName = "ecommerce" | "music" | "employees" | "social";

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  executionTimeMs: number;
  error?: { message: string; line?: number; column?: number };
}

export interface ColumnInfo {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNotNull: boolean;
  defaultValue?: string;
}

export interface ForeignKey {
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKey[];
  indexes: IndexInfo[];
  rowCount: number;
}

export interface DatabaseSchema {
  tables: TableInfo[];
}
