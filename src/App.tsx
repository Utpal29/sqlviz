import { useEffect, useState } from "react";
import { useDatabaseStore } from "./store/databaseStore";
import { useResultsStore } from "./store/resultsStore";
import { useEditorStore } from "./store/editorStore";
import { AppShell } from "./components/Layout/AppShell";
import { DesktopGate } from "./components/Layout/DesktopGate";
import { parseShareParams } from "./utils/shareUtils";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window === "undefined" ? true : window.innerWidth >= 1024
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isDesktop;
}

export default function App() {
  const status = useDatabaseStore((s) => s.status);
  const init = useDatabaseStore((s) => s.init);
  const loadDataset = useDatabaseStore((s) => s.loadDataset);
  const error = useDatabaseStore((s) => s.errorMessage);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (status !== "idle") return;
    const shared = parseShareParams();
    void (async () => {
      if (shared) {
        await loadDataset(shared.dataset);
        useEditorStore.getState().setQuery(shared.query);
        useResultsStore.getState().runQuery(shared.query);
      } else {
        await init();
        const q = useEditorStore.getState().query;
        useResultsStore.getState().runQuery(q);
      }
    })();
  }, [status, init, loadDataset]);

  if (!isDesktop) return <DesktopGate />;

  if (status === "initializing" || status === "idle") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-text-muted">
          <div className="h-1 w-32 overflow-hidden rounded-full bg-bg-elevated">
            <div className="h-full w-1/3 animate-pulse bg-accent" />
          </div>
          Loading SQLite…
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="panel-elevated max-w-md p-6">
          <div className="mb-2 font-mono text-xs uppercase tracking-wider text-error">
            Failed to initialize
          </div>
          <p className="text-sm text-text-primary">{error}</p>
        </div>
      </div>
    );
  }

  return <AppShell />;
}
