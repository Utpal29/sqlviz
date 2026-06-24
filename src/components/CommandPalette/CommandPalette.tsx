import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useCompareStore } from "../../store/compareStore";
import { useDatabaseStore } from "../../store/databaseStore";
import { useEditorStore } from "../../store/editorStore";
import { useHistoryStore } from "../../store/historyStore";
import { useResultsStore } from "../../store/resultsStore";
import { useChallengesStore } from "../../store/challengesStore";
import { ALL_CHALLENGES } from "../../challenges";
import { formatSql } from "../../utils/sqlFormatter";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const query = useEditorStore((s) => s.query);
  const setQuery = useEditorStore((s) => s.setQuery);
  const activeBuffer = useEditorStore((s) => s.activeBuffer);
  const runQuery = useResultsStore((s) => s.runQuery);
  const setActiveTab = useResultsStore((s) => s.setActiveTab);
  const resetDataset = useDatabaseStore((s) => s.resetDataset);
  const isCompareMode = useCompareStore((s) => s.isCompareMode);
  const setCompareMode = useCompareStore((s) => s.setCompareMode);
  const runCompare = useCompareStore((s) => s.runCompare);
  const queryA = useCompareStore((s) => s.queryA);
  const queryB = useCompareStore((s) => s.queryB);
  const setQueryA = useCompareStore((s) => s.setQueryA);
  const setQueryB = useCompareStore((s) => s.setQueryB);
  const history = useHistoryStore((s) => s.items);
  const startChallenge = useChallengesStore((s) => s.startChallenge);
  const endChallenge = useChallengesStore((s) => s.endChallenge);
  const challengeProgress = useChallengesStore((s) => s.progress);
  const activeChallengeId = useChallengesStore((s) => s.activeChallengeId);
  const loadDataset = useDatabaseStore((s) => s.loadDataset);
  const currentDataset = useDatabaseStore((s) => s.currentDataset);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = (action: () => void | Promise<void>) => {
    void action();
    setOpen(false);
  };

  const formatActive = async () => {
    if (isCompareMode && activeBuffer === "compareB") {
      setQueryB(await formatSql(queryB));
      return;
    }
    if (isCompareMode && activeBuffer === "compareA") {
      setQueryA(await formatSql(queryA));
      return;
    }
    setQuery(await formatSql(query));
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed left-1/2 top-24 z-50 w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-2xl"
      overlayClassName="fixed inset-0 z-40 bg-bg-primary/60 backdrop-blur-sm"
    >
      <Command.Input
        autoFocus
        placeholder="Run command..."
        className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
      />
      <Command.List className="max-h-96 overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-text-muted">
          No command found.
        </Command.Empty>
        <Command.Group heading="Actions" className="text-text-muted">
          <Command.Item
            value="run query"
            onSelect={() => run(() => runQuery(query))}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
          >
            Run query
          </Command.Item>
          <Command.Item
            value="run compare"
            onSelect={() =>
              run(() => {
                runCompare();
                setActiveTab("compare");
              })
            }
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
          >
            Run compare
          </Command.Item>
          <Command.Item
            value="toggle compare mode"
            onSelect={() =>
              run(() => {
                setCompareMode(!isCompareMode);
                setActiveTab(!isCompareMode ? "compare" : "results");
              })
            }
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
          >
            Toggle compare mode
          </Command.Item>
          <Command.Item
            value="reset dataset"
            onSelect={() =>
              run(() => {
                void resetDataset().then(() => runQuery(query));
              })
            }
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
          >
            Reset dataset
          </Command.Item>
          <Command.Item
            value="format query"
            onSelect={() => run(formatActive)}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
          >
            Format query
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Views" className="mt-2 text-text-muted">
          <Command.Item
            value="open query plan"
            onSelect={() => run(() => setActiveTab("plan"))}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
          >
            Open Query Plan tab
          </Command.Item>
          <Command.Item
            value="open compare"
            onSelect={() => run(() => setActiveTab("compare"))}
            className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
          >
            Open Compare tab
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Challenges" className="mt-2 text-text-muted">
          {ALL_CHALLENGES.map((challenge) => {
            const done = challengeProgress[challenge.id]?.completed;
            const active = activeChallengeId === challenge.id;
            return (
              <Command.Item
                key={challenge.id}
                value={`challenge ${challenge.title} ${challenge.difficulty} ${challenge.dataset}`}
                onSelect={() =>
                  run(() => {
                    startChallenge(challenge.id);
                    setCompareMode(false);
                    setQuery(challenge.starterQuery);
                    setActiveTab("results");
                    if (challenge.dataset !== currentDataset) {
                      void loadDataset(challenge.dataset);
                    }
                  })
                }
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{challenge.title}</span>
                  <span className="font-mono text-[10px] uppercase text-text-muted">
                    {challenge.difficulty}
                    {done ? " · done" : active ? " · active" : ""}
                  </span>
                </div>
              </Command.Item>
            );
          })}
          {activeChallengeId && (
            <Command.Item
              value="exit challenge mode"
              onSelect={() => run(endChallenge)}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
            >
              Exit challenge mode
            </Command.Item>
          )}
        </Command.Group>
        {history.length > 0 && (
          <Command.Group heading="History" className="mt-2 text-text-muted">
            {history.slice(0, 8).map((item) => (
              <Command.Item
                key={item.id}
                value={`history ${item.dataset} ${item.query}`}
                onSelect={() =>
                  run(() => {
                    setCompareMode(false);
                    setQuery(item.query);
                    setActiveTab("results");
                  })
                }
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-primary aria-selected:bg-bg-secondary"
              >
                <div className="truncate font-mono text-xs">{item.query}</div>
                <div className="mt-1 text-xs text-text-muted">
                  {item.dataset} · {item.rowCount} rows · {item.executionTimeMs.toFixed(1)} ms
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}
