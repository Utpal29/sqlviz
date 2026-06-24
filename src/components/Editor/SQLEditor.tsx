import { Suspense, lazy } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useResultsStore } from "../../store/resultsStore";
import { useCompareStore } from "../../store/compareStore";

const EditorPane = lazy(() => import("./EditorPane"));

function EditorFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
      <div className="flex flex-col items-center gap-2">
        <div className="h-1 w-24 overflow-hidden rounded-full bg-bg-elevated">
          <div className="h-full w-1/3 animate-pulse bg-accent" />
        </div>
        Loading editor…
      </div>
    </div>
  );
}

export function SQLEditor() {
  const query = useEditorStore((s) => s.query);
  const setQuery = useEditorStore((s) => s.setQuery);
  const runQuery = useResultsStore((s) => s.runQuery);
  const isCompareMode = useCompareStore((s) => s.isCompareMode);
  const queryA = useCompareStore((s) => s.queryA);
  const queryB = useCompareStore((s) => s.queryB);
  const setQueryA = useCompareStore((s) => s.setQueryA);
  const setQueryB = useCompareStore((s) => s.setQueryB);
  const runCompare = useCompareStore((s) => s.runCompare);

  if (isCompareMode) {
    return (
      <Suspense fallback={<EditorFallback />}>
        <div className="grid h-full grid-cols-2 divide-x divide-border">
          <div className="flex min-w-0 flex-col">
            <div className="border-b border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-muted">
              Query A
            </div>
            <div className="min-h-0 flex-1">
              <EditorPane
                editorId="compare-a.sql"
                value={queryA}
                onChange={setQueryA}
                onRun={runCompare}
                buffer="compareA"
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="border-b border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-muted">
              Query B
            </div>
            <div className="min-h-0 flex-1">
              <EditorPane
                editorId="compare-b.sql"
                value={queryB}
                onChange={setQueryB}
                onRun={runCompare}
                buffer="compareB"
              />
            </div>
          </div>
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<EditorFallback />}>
      <EditorPane
        editorId="main.sql"
        value={query}
        onChange={setQuery}
        onRun={runQuery}
        buffer="main"
      />
    </Suspense>
  );
}
