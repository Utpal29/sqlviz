import { Check, Clock3, Columns2, FileCode2, Play, RotateCcw, Share2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useResultsStore } from "../../store/resultsStore";
import { useDatabaseStore } from "../../store/databaseStore";
import { useCompareStore } from "../../store/compareStore";
import { useHistoryStore } from "../../store/historyStore";
import { formatSql } from "../../utils/sqlFormatter";
import { buildShareUrl, copyToClipboard, writeShareParams } from "../../utils/shareUtils";

export function EditorToolbar() {
  const query = useEditorStore((s) => s.query);
  const activeBuffer = useEditorStore((s) => s.activeBuffer);
  const setQuery = useEditorStore((s) => s.setQuery);
  const runQuery = useResultsStore((s) => s.runQuery);
  const setActiveTab = useResultsStore((s) => s.setActiveTab);
  const resetDataset = useDatabaseStore((s) => s.resetDataset);
  const status = useDatabaseStore((s) => s.status);
  const currentDataset = useDatabaseStore((s) => s.currentDataset);
  const [shareCopied, setShareCopied] = useState(false);
  const isCompareMode = useCompareStore((s) => s.isCompareMode);
  const setCompareMode = useCompareStore((s) => s.setCompareMode);
  const runCompare = useCompareStore((s) => s.runCompare);
  const queryA = useCompareStore((s) => s.queryA);
  const queryB = useCompareStore((s) => s.queryB);
  const setQueryA = useCompareStore((s) => s.setQueryA);
  const setQueryB = useCompareStore((s) => s.setQueryB);
  const history = useHistoryStore((s) => s.items);
  const deleteHistoryItem = useHistoryStore((s) => s.deleteItem);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const filteredHistory = history.filter((item) => {
    const needle = historySearch.trim().toLowerCase();
    if (!needle) return true;
    return (
      item.query.toLowerCase().includes(needle) ||
      item.dataset.toLowerCase().includes(needle)
    );
  });

  const handleReset = () => {
    void resetDataset().then(() => {
      if (isCompareMode) {
        runCompare();
        setActiveTab("compare");
      } else {
        runQuery(query);
      }
    });
  };

  const handleToggleCompare = () => {
    const next = !isCompareMode;
    setCompareMode(next);
    setActiveTab(next ? "compare" : "results");
  };

  const handleRun = () => {
    if (isCompareMode) {
      runCompare();
      setActiveTab("compare");
      return;
    }
    runQuery(query);
  };

  const handleFormat = () => {
    void (async () => {
    try {
      if (isCompareMode && activeBuffer === "compareB") {
        setQueryB(await formatSql(queryB));
        return;
      }
      if (isCompareMode && activeBuffer === "compareA") {
        setQueryA(await formatSql(queryA));
        return;
      }
      setQuery(await formatSql(query));
    } catch {
      // Keep the existing SQL unchanged if formatter cannot parse an in-progress query.
    }
    })();
  };

  const handleShare = () => {
    if (isCompareMode) return;
    const url = buildShareUrl(currentDataset, query);
    writeShareParams(currentDataset, query);
    void copyToClipboard(url).then((ok) => {
      if (!ok) return;
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1500);
    });
  };

  const loadHistoryItem = (nextQuery: string) => {
    setCompareMode(false);
    setQuery(nextQuery);
    setActiveTab("results");
    setHistoryOpen(false);
  };

  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
        {isCompareMode ? "Compare Queries" : "Query"}
      </span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-label="Open query history"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-glow hover:bg-bg-elevated hover:text-text-primary"
          >
            <Clock3 size={14} />
          </button>
          {historyOpen && (
            <div className="absolute right-0 top-10 z-20 w-96 overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
                  Query History
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-xs text-text-muted hover:text-text-primary"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    aria-label="Close query history"
                    onClick={() => setHistoryOpen(false)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="border-b border-border p-2">
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Search query history..."
                  className="w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-border-glow"
                />
              </div>
              <div className="max-h-80 overflow-auto p-2">
                {history.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-text-muted">
                    Successful single-query runs will appear here.
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-text-muted">
                    No history items match this search.
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="mb-1 flex items-start gap-2 rounded-md px-2 py-2 transition-colors hover:bg-bg-secondary"
                    >
                      <button
                        type="button"
                        onClick={() => loadHistoryItem(item.query)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                          <span>{item.dataset}</span>
                          <span>
                            {item.rowCount} rows · {item.executionTimeMs.toFixed(1)} ms
                          </span>
                        </div>
                        <div className="mt-1 truncate font-mono text-xs text-text-primary">
                          {item.query}
                        </div>
                      </button>
                      <button
                        type="button"
                        aria-label="Delete history item"
                        onClick={() => deleteHistoryItem(item.id)}
                        className="mt-4 text-text-muted transition-colors hover:text-error"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleShare}
          disabled={isCompareMode}
          aria-label="Copy shareable link"
          title={isCompareMode ? "Disable Compare to share a link" : "Copy shareable link"}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-glow hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {shareCopied ? <Check size={14} className="text-success" /> : <Share2 size={14} />}
        </button>
        <button
          type="button"
          onClick={handleFormat}
          aria-label="Format SQL"
          title="Format SQL (Cmd/Ctrl+S)"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-glow hover:bg-bg-elevated hover:text-text-primary"
        >
          <FileCode2 size={14} />
        </button>
        <button
          type="button"
          onClick={handleToggleCompare}
          aria-label="Toggle compare mode"
          aria-pressed={isCompareMode}
          className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            isCompareMode
              ? "border-accent bg-accent/15 text-text-primary"
              : "border-border text-text-muted hover:border-border-glow hover:bg-bg-elevated hover:text-text-primary"
          }`}
        >
          <Columns2 size={14} />
          Compare
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={status === "initializing"}
          aria-label="Reset dataset"
          title="Reset dataset"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-glow hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={14} />
        </button>
        <button
          type="button"
          onClick={handleRun}
          className="group flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all duration-200 ease-apple hover:bg-accent/90 hover:shadow-accent/40 active:scale-95"
        >
          <Play size={14} className="transition-transform group-hover:translate-x-0.5" />
          {isCompareMode ? "Run Compare" : "Run"}
          <kbd className="ml-1 hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wide sm:inline">
            Cmd+Enter
          </kbd>
        </button>
      </div>
    </div>
  );
}
