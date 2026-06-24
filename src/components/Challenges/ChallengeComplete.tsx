import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, PartyPopper, X } from "lucide-react";
import { findChallenge, nextChallenge as findNext } from "../../challenges";
import { useChallengesStore } from "../../store/challengesStore";
import { useDatabaseStore } from "../../store/databaseStore";
import { useEditorStore } from "../../store/editorStore";

function formatDuration(ms: number | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds - minutes * 60);
  return `${minutes}m ${remaining}s`;
}

export function ChallengeComplete() {
  const open = useChallengesStore((s) => s.showCompletion);
  const activeId = useChallengesStore((s) => s.activeChallengeId);
  const progress = useChallengesStore((s) => s.progress);
  const dismissCompletion = useChallengesStore((s) => s.dismissCompletion);
  const startChallenge = useChallengesStore((s) => s.startChallenge);
  const endChallenge = useChallengesStore((s) => s.endChallenge);
  const setQuery = useEditorStore((s) => s.setQuery);
  const loadDataset = useDatabaseStore((s) => s.loadDataset);
  const currentDataset = useDatabaseStore((s) => s.currentDataset);

  const challenge = activeId ? findChallenge(activeId) : undefined;
  const stats = activeId ? progress[activeId] : undefined;
  const next = activeId ? findNext(activeId) : undefined;

  const handleNext = () => {
    if (!next) return;
    startChallenge(next.id);
    setQuery(next.starterQuery);
    if (next.dataset !== currentDataset) {
      void loadDataset(next.dataset);
    }
    dismissCompletion();
  };

  const handleClose = () => {
    dismissCompletion();
    endChallenge();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) dismissCompletion();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-success/40 bg-bg-secondary p-6 shadow-2xl"
        >
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </Dialog.Close>

          <div className="flex items-center gap-2 text-success">
            <PartyPopper size={20} />
            <Dialog.Title className="text-lg font-semibold">Solved</Dialog.Title>
          </div>
          {challenge && (
            <p className="mt-1 text-sm text-text-muted">{challenge.title}</p>
          )}

          {stats && (
            <dl className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-border bg-bg-elevated p-3 text-center">
              <Stat label="Time" value={formatDuration(stats.bestTimeMs)} />
              <Stat label="Attempts" value={String(stats.attempts)} />
              <Stat
                label="Hints"
                value={
                  challenge ? `${stats.hintsUsed} / ${challenge.hints.length}` : "—"
                }
              />
            </dl>
          )}

          {challenge && (
            <details className="mt-4 rounded-lg border border-border bg-bg-elevated">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm text-text-muted hover:text-text-primary">
                See the canonical solution
              </summary>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words border-t border-border px-3 py-2 font-mono text-xs text-text-primary">
                {challenge.solutionQuery}
              </pre>
            </details>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              Exit
            </button>
            {next && (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:bg-accent/90"
              >
                Next challenge
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm text-text-primary">{value}</div>
    </div>
  );
}
