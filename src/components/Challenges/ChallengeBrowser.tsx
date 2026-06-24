import * as Dialog from "@radix-ui/react-dialog";
import { Check, Sparkles, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ALL_CHALLENGES, challengesByDifficulty } from "../../challenges";
import type { Challenge, Difficulty } from "../../challenges/types";
import { useChallengesStore } from "../../store/challengesStore";
import { useDatabaseStore } from "../../store/databaseStore";
import { useEditorStore } from "../../store/editorStore";
import { useResultsStore } from "../../store/resultsStore";

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard"];
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: "border-success/40 bg-success/10 text-success",
  medium: "border-warning/40 bg-warning/10 text-warning",
  hard: "border-error/40 bg-error/10 text-error",
};

interface ChallengeBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChallengeBrowser({ open, onOpenChange }: ChallengeBrowserProps) {
  const [filter, setFilter] = useState<Difficulty | "all">("all");
  const progress = useChallengesStore((s) => s.progress);
  const startChallenge = useChallengesStore((s) => s.startChallenge);
  const loadDataset = useDatabaseStore((s) => s.loadDataset);
  const currentDataset = useDatabaseStore((s) => s.currentDataset);
  const setQuery = useEditorStore((s) => s.setQuery);
  const setActiveTab = useResultsStore((s) => s.setActiveTab);

  const visibleChallenges = useMemo(() => {
    if (filter === "all") return ALL_CHALLENGES;
    return challengesByDifficulty(filter);
  }, [filter]);

  const completedCount = ALL_CHALLENGES.filter((c) => progress[c.id]?.completed).length;

  const handleStart = (challenge: Challenge) => {
    startChallenge(challenge.id);
    setQuery(challenge.starterQuery);
    setActiveTab("results");
    onOpenChange(false);
    if (challenge.dataset !== currentDataset) {
      void loadDataset(challenge.dataset);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex h-[80vh] w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-warning" />
              <Dialog.Title className="text-sm font-medium text-text-primary">
                Challenges
              </Dialog.Title>
              <span className="rounded-md bg-bg-elevated px-2 py-0.5 font-mono text-xs text-text-muted">
                {completedCount} / {ALL_CHALLENGES.length}
              </span>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close challenges"
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex items-center gap-1 border-b border-border/70 px-4 py-2">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterChip>
            {DIFFICULTY_ORDER.map((d) => (
              <FilterChip
                key={d}
                active={filter === d}
                onClick={() => setFilter(d)}
              >
                {DIFFICULTY_LABEL[d]}
              </FilterChip>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-3">
              {visibleChallenges.map((challenge) => {
                const done = progress[challenge.id]?.completed;
                return (
                  <button
                    key={challenge.id}
                    type="button"
                    onClick={() => handleStart(challenge)}
                    className={`group flex flex-col gap-2 rounded-lg border border-border bg-bg-elevated p-4 text-left transition-all hover:border-accent/60 hover:bg-bg-elevated/80 ${
                      done ? "border-success/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {done ? (
                          <Check size={14} className="shrink-0 text-success" />
                        ) : (
                          <Sparkles size={14} className="shrink-0 text-text-muted group-hover:text-accent" />
                        )}
                        <h3 className="truncate text-sm font-medium text-text-primary">
                          {challenge.title}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase ${DIFFICULTY_STYLE[challenge.difficulty]}`}
                      >
                        {DIFFICULTY_LABEL[challenge.difficulty]}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">{challenge.description}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                        {challenge.dataset}
                      </span>
                      <span className="text-text-muted">·</span>
                      {challenge.concepts.map((concept) => (
                        <span
                          key={concept}
                          className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-text-muted"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-accent bg-accent/15 text-text-primary"
          : "border-border text-text-muted hover:border-border-glow hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
