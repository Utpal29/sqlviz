import initSqlJs from "sql.js";
import type { Database, SqlJsStatic } from "sql.js";
import { buildEcommerceSQL } from "../datasets/ecommerce";
import { buildEmployeesSQL } from "../datasets/employees";
import { buildMusicSQL } from "../datasets/music";
import { buildSocialSQL } from "../datasets/social";
import { introspectSchema } from "./schemaIntrospector";
import { parseExplain } from "./explainParser";
import type { DatabaseSchema, DatasetName, QueryResult } from "../types/database";
import type { ExplainResult, ExplainRow, PlanNode } from "../types/plan";

function annotateEstimatedRows(node: PlanNode, schema: DatabaseSchema | null): void {
  if (schema && node.tableName && (node.type === "scan" || node.type === "search")) {
    const table = schema.tables.find((t) => t.name === node.tableName);
    if (table) node.estimatedRows = table.rowCount;
  }
  for (const child of node.children) annotateEstimatedRows(child, schema);
}

let SQL: SqlJsStatic | null = null;

async function getSqlJs(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: (file) => `/${file}`,
  });
  return SQL;
}

function seedFor(dataset: DatasetName): string {
  switch (dataset) {
    case "ecommerce":
      return buildEcommerceSQL();
    case "music":
      return buildMusicSQL();
    case "employees":
      return buildEmployeesSQL();
    case "social":
      return buildSocialSQL();
  }
}

export class DatabaseEngine {
  private db: Database | null = null;
  private _schema: DatabaseSchema | null = null;
  private _dataset: DatasetName = "ecommerce";

  async loadDataset(name: DatasetName): Promise<void> {
    const sqlJs = await getSqlJs();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.db = new sqlJs.Database();
    this.db.exec(seedFor(name));
    this._dataset = name;
    this._schema = introspectSchema(this.db);
  }

  destroy(): void {
    this.db?.close();
    this.db = null;
    this._schema = null;
  }

  get currentDataset(): DatasetName {
    return this._dataset;
  }

  getSchema(): DatabaseSchema | null {
    return this._schema;
  }

  executeQuery(sql: string): QueryResult {
    if (!this.db) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        error: { message: "Database not initialized" },
      };
    }
    const t0 = performance.now();
    try {
      const res = this.db.exec(sql);
      const t1 = performance.now();
      if (res.length === 0) {
        return { columns: [], rows: [], rowCount: 0, executionTimeMs: t1 - t0 };
      }
      const first = res[res.length - 1];
      return {
        columns: first.columns,
        rows: first.values,
        rowCount: first.values.length,
        executionTimeMs: t1 - t0,
      };
    } catch (e) {
      const t1 = performance.now();
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: t1 - t0,
        error: { message: e instanceof Error ? e.message : String(e) },
      };
    }
  }

  explainQuery(sql: string): ExplainResult {
    if (!this.db) return { raw: [], tree: null };
    try {
      const res = this.db.exec(`EXPLAIN QUERY PLAN ${sql}`);
      if (res.length === 0) return { raw: [], tree: null };
      const rows: ExplainRow[] = res[0].values.map((row) => ({
        id: row[0] as number,
        parent: row[1] as number,
        detail: row[3] as string,
      }));
      const parsed = parseExplain(rows);
      if (parsed.tree) annotateEstimatedRows(parsed.tree, this._schema);
      return parsed;
    } catch {
      return { raw: [], tree: null };
    }
  }
}

export const databaseEngine = new DatabaseEngine();
