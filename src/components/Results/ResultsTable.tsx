import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { useResultsStore } from "../../store/resultsStore";
import type { QueryResult } from "../../types/database";

const PAGE_SIZE = 50;

type SortDirection = "asc" | "desc";

interface SortState {
  column: number;
  direction: SortDirection;
}

interface TableState {
  result: QueryResult | null;
  page: number;
  sort: SortState | null;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function ResultsTable() {
  const result = useResultsStore((s) => s.lastResult);
  const [tableState, setTableState] = useState<TableState>({
    result: null,
    page: 0,
    sort: null,
  });

  const page = tableState.result === result ? tableState.page : 0;
  const sort = tableState.result === result ? tableState.sort : null;

  const sortedRows = useMemo(() => {
    const rows = result?.rows ?? [];
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const comparison = compareValues(a[sort.column], b[sort.column]);
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [result, sort]);

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Run a query to see results.
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="flex h-full flex-col items-start gap-2 p-4">
        <div className="font-mono text-xs uppercase tracking-wider text-error">
          Error
        </div>
        <pre className="whitespace-pre-wrap font-mono text-sm text-text-primary">
          {result.error.message}
        </pre>
      </div>
    );
  }

  if (result.columns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Query ran. No rows returned.
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const slice = sortedRows.slice(start, start + PAGE_SIZE);

  const toggleSort = (column: number) => {
    setTableState((currentState) => {
      const current =
        currentState.result === result ? currentState.sort : null;
      if (!current || current.column !== column) {
        return { result, page: 0, sort: { column, direction: "asc" } };
      }
      if (current.direction === "asc") {
        return { result, page: 0, sort: { column, direction: "desc" } };
      }
      return { result, page: 0, sort: null };
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full font-mono text-sm">
          <thead className="sticky top-0 bg-bg-secondary/95 backdrop-blur-md">
            <tr className="border-b border-border">
              {result.columns.map((c, column) => {
                const active = sort?.column === column;
                const Icon = !active
                  ? ArrowDownUp
                  : sort.direction === "asc"
                    ? ArrowUp
                    : ArrowDown;
                return (
                <th
                  key={c}
                  className="px-3 py-2 text-left text-xs uppercase tracking-wider text-text-muted"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    className={`flex max-w-full items-center gap-2 transition-colors hover:text-text-primary ${
                      active ? "text-text-primary" : ""
                    }`}
                  >
                    <span className="truncate">{c}</span>
                    <Icon size={12} className="shrink-0" />
                  </button>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr
                key={start + i}
                className="border-b border-border/40 transition-colors hover:bg-bg-elevated/60"
              >
                {row.map((v, j) => (
                  <td key={j} className="px-3 py-1.5 text-text-primary">
                    {formatCell(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-3 border-t border-border px-3 py-2 text-xs text-text-muted">
          <button
            type="button"
            disabled={page === 0}
            onClick={() =>
              setTableState({ result, page: Math.max(0, page - 1), sort })
            }
            className="rounded px-2 py-1 hover:bg-bg-elevated disabled:opacity-30"
          >
            Prev
          </button>
          <span>
            Page {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount - 1}
            onClick={() =>
              setTableState({
                result,
                page: Math.min(pageCount - 1, page + 1),
                sort,
              })
            }
            className="rounded px-2 py-1 hover:bg-bg-elevated disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
