import { ChevronDown, ChevronRight, Lightbulb, Play, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { findChallenge } from "../../challenges";
import { validateChallengeSubmission } from "../../challenges/validator";
import { useChallengesStore } from "../../store/challengesStore";
import { useEditorStore } from "../../store/editorStore";
import { useResultsStore } from "../../store/resultsStore";
import { useDatabaseStore } from "../../store/databaseStore";

export function ChallengeBanner() {
  const activeId = useChallengesStore((s) => s.activeChallengeId);
  const hintsRevealed = useChallengesStore((s) => s.hintsRevealed);
  const lastVerdict = useChallengesStore((s) => s.lastVerdict);
  const attempts = useChallengesStore((s) => s.attempts);
  const revealHint = useChallengesStore((s) => s.revealHint);
  const recordSubmission = useChallengesStore((s) => s.recordSubmission);
  const endChallenge = useChallengesStore((s) => s.endChallenge);
  const query = useEditorStore((s) => s.query);
  const setQuery = useEditorStore((s) => s.setQuery);
  const runQuery = useResultsStore((s) => s.runQuery);
  const setActiveTab = useResultsStore((s) => s.setActiveTab);
  const loadDataset = useDatabaseStore((s) => s.loadDataset);
  const currentDataset = useDatabaseStore((s) => s.currentDataset);
  const [collapsed, setCollapsed] = useState(false);

  const challenge = useMemo(
    () => (activeId ? findChallenge(activeId) : undefined),
    [activeId],
  );

  if (!challenge) return null;

  const handleCheck = () => {
    if (currentDataset !== challenge.dataset) {
      // Guardrail: nudge the user back to the correct dataset before checking.
      void loadDataset(challenge.dataset).then(() => {
        runQuery(query);
      });
      return;
    }
    runQuery(query);
    const outcome = validateChallengeSubmission(challenge, query);
    recordSubmission(outcome.verdict);
    setActiveTab("results");
  };

  const handleReset = () => {
    setQuery(challenge.starterQuery);
  };

  return (
    <div className="border-b border-accent/30 bg-accent/5">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-text-muted" />
          ) : (
            <ChevronDown size={14} className="text-text-muted" />
          )}
          <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
            Challenge
          </span>
          <span className="truncate text-sm font-medium text-text-primary">
            {challenge.title}
          </span>
          <span className="hidden font-mono text-xs text-text-muted sm:inline">
            · {challenge.difficulty}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleReset}
            title="Reset to starter query"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-glow hover:bg-bg-elevated hover:text-text-primary"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={endChallenge}
            title="Exit challenge mode"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-border-glow hover:bg-bg-elevated hover:text-text-primary"
          >
            <X size={13} />
          </button>
          <button
            type="button"
            onClick={handleCheck}
            className="flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-white shadow-md shadow-success/20 transition-all hover:bg-success/90"
          >
            <Play size={13} />
            Check
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-accent/20 px-3 pb-3 pt-2">
          <p className="text-sm text-text-primary">{challenge.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span className="font-mono">dataset: {challenge.dataset}</span>
            {challenge.concepts.length > 0 && (
              <>
                <span>·</span>
                {challenge.concepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono"
                  >
                    {concept}
                  </span>
                ))}
              </>
            )}
          </div>

          {hintsRevealed > 0 && (
            <ul className="mt-3 space-y-1">
              {challenge.hints.slice(0, hintsRevealed).map((hint, i) => (
                <li
                  key={i}
                  className="flex gap-2 rounded-md border border-warning/30 bg-warning/5 px-2 py-1.5 text-xs text-warning"
                >
                  <Lightbulb size={12} className="mt-0.5 shrink-0" />
                  <span className="text-text-primary">{hint}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex items-center gap-2 text-xs">
            {hintsRevealed < challenge.hints.length && (
              <button
                type="button"
                onClick={revealHint}
                className="flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-warning transition-colors hover:bg-warning/20"
              >
                <Lightbulb size={12} />
                Show hint ({hintsRevealed + 1} / {challenge.hints.length})
              </button>
            )}
            {attempts > 0 && (
              <span className="text-text-muted">
                {attempts} {attempts === 1 ? "attempt" : "attempts"}
              </span>
            )}
            {lastVerdict && !lastVerdict.pass && (
              <span className="rounded-md border border-error/40 bg-error/5 px-2 py-1 text-error">
                {lastVerdict.reason}
                {lastVerdict.detail ? ` — ${lastVerdict.detail}` : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
