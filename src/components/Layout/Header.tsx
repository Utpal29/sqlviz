import { useState } from "react";
import { Database, Moon, RefreshCw, Sun, Trophy } from "lucide-react";
import { useDatabaseStore } from "../../store/databaseStore";
import { useEditorStore } from "../../store/editorStore";
import { useResultsStore } from "../../store/resultsStore";
import { useCompareStore } from "../../store/compareStore";
import { useChallengesStore } from "../../store/challengesStore";
import { useThemeStore } from "../../store/themeStore";
import { starterQueryForDataset } from "../../datasets/starters";
import { ALL_CHALLENGES } from "../../challenges";
import { ChallengeBrowser } from "../Challenges/ChallengeBrowser";
import type { DatasetName } from "../../types/database";

const DATASETS: Array<{
  id: DatasetName;
  label: string;
}> = [
  { id: "ecommerce", label: "E-Commerce" },
  { id: "music", label: "Music Library" },
  { id: "employees", label: "Employees" },
  { id: "social", label: "Social Network" },
];

export function Header() {
  const dataset = useDatabaseStore((s) => s.currentDataset);
  const loadDataset = useDatabaseStore((s) => s.loadDataset);
  const status = useDatabaseStore((s) => s.status);
  const setQuery = useEditorStore((s) => s.setQuery);
  const runQuery = useResultsStore((s) => s.runQuery);
  const setActiveTab = useResultsStore((s) => s.setActiveTab);
  const clearCompareRuns = useCompareStore((s) => s.clearRuns);
  const setCompareQueries = useCompareStore((s) => s.setQueries);
  const challengeProgress = useChallengesStore((s) => s.progress);
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const [challengeBrowserOpen, setChallengeBrowserOpen] = useState(false);
  const completedChallenges = ALL_CHALLENGES.filter(
    (c) => challengeProgress[c.id]?.completed,
  ).length;

  const handleDatasetChange = (value: string) => {
    const next = value as DatasetName;
    const starter = starterQueryForDataset(next);
    void loadDataset(next).then(() => {
      setQuery(starter);
      setCompareQueries(starter, starter);
      clearCompareRuns();
      runQuery(starter);
      setActiveTab("results");
    });
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-bg-secondary/60 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Database size={16} />
        </div>
        <span className="font-display text-sm font-bold tracking-tight">
          SQLViz
        </span>
        <span className="ml-1 rounded-md bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Wave 1
        </span>
      </div>
      <div className="flex items-center gap-2">
        {status === "initializing" && (
          <RefreshCw size={14} className="animate-spin text-accent" />
        )}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-elevated text-text-muted transition-colors hover:border-border-glow hover:text-text-primary"
        >
          {themeMode === "dark" ? <Sun size={13} /> : <Moon size={13} />}
        </button>
        <button
          type="button"
          onClick={() => setChallengeBrowserOpen(true)}
          title="Browse SQL challenges"
          className="flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-border-glow hover:text-text-primary"
        >
          <Trophy size={13} />
          <span>Challenges</span>
          <span className="font-mono">
            {completedChallenges}/{ALL_CHALLENGES.length}
          </span>
        </button>
        <label className="flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-2.5 py-1 font-mono text-xs text-text-muted">
          <span>dataset:</span>
          <select
            value={dataset}
            onChange={(event) => handleDatasetChange(event.target.value)}
            disabled={status === "initializing"}
            className="cursor-pointer bg-transparent text-text-primary outline-none disabled:cursor-not-allowed"
          >
            {DATASETS.map((item) => (
              <option
                key={item.id}
                value={item.id}
                className="bg-bg-elevated text-text-primary"
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ChallengeBrowser open={challengeBrowserOpen} onOpenChange={setChallengeBrowserOpen} />
    </header>
  );
}
