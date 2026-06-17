import { useResultsStore } from "../../store/resultsStore";
import { useDatabaseStore } from "../../store/databaseStore";

export function StatusBar() {
  const result = useResultsStore((s) => s.lastResult);
  const dataset = useDatabaseStore((s) => s.currentDataset);

  return (
    <div
      className="flex items-center justify-between border-t border-border bg-bg-secondary/60 px-4 py-1.5 font-mono text-xs text-text-muted backdrop-blur-md"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {result?.error ? (
          <span className="text-error">⚠ {result.error.message}</span>
        ) : result ? (
          <>
            <span>{result.rowCount} rows</span>
            <span className="text-border">·</span>
            <span>{result.executionTimeMs.toFixed(1)} ms</span>
          </>
        ) : (
          <span>Ready</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span>dataset: {dataset}</span>
      </div>
    </div>
  );
}
