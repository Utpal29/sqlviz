import { create } from "zustand";
import { findChallenge } from "../challenges";
import type { Challenge, ChallengeVerdict } from "../challenges/types";

const STORAGE_KEY = "sqlviz.challengeProgress";

export interface ChallengeProgress {
  completed: boolean;
  attempts: number;
  bestTimeMs?: number;
  completedAt?: number;
  hintsUsed: number;
}

interface PersistedState {
  progress: Record<string, ChallengeProgress>;
}

interface ChallengesStore {
  activeChallengeId: string | null;
  startedAt: number | null;
  attempts: number;
  hintsRevealed: number;
  lastVerdict: ChallengeVerdict | null;
  showCompletion: boolean;
  progress: Record<string, ChallengeProgress>;
  startChallenge: (challengeId: string) => Challenge | null;
  endChallenge: () => void;
  revealHint: () => void;
  recordSubmission: (verdict: ChallengeVerdict) => ChallengeProgress | null;
  dismissCompletion: () => void;
  resetProgress: () => void;
}

function loadProgress(): Record<string, ChallengeProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedState;
    return parsed.progress ?? {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, ChallengeProgress>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ progress } satisfies PersistedState),
  );
}

export const useChallengesStore = create<ChallengesStore>((set, get) => ({
  activeChallengeId: null,
  startedAt: null,
  attempts: 0,
  hintsRevealed: 0,
  lastVerdict: null,
  showCompletion: false,
  progress: loadProgress(),

  startChallenge: (challengeId) => {
    const challenge = findChallenge(challengeId);
    if (!challenge) return null;
    set({
      activeChallengeId: challengeId,
      startedAt: Date.now(),
      attempts: 0,
      hintsRevealed: 0,
      lastVerdict: null,
      showCompletion: false,
    });
    return challenge;
  },

  endChallenge: () => {
    set({
      activeChallengeId: null,
      startedAt: null,
      attempts: 0,
      hintsRevealed: 0,
      lastVerdict: null,
      showCompletion: false,
    });
  },

  revealHint: () => {
    const challengeId = get().activeChallengeId;
    if (!challengeId) return;
    const challenge = findChallenge(challengeId);
    if (!challenge) return;
    set((s) => ({
      hintsRevealed: Math.min(s.hintsRevealed + 1, challenge.hints.length),
    }));
  },

  recordSubmission: (verdict) => {
    const challengeId = get().activeChallengeId;
    if (!challengeId) return null;
    const startedAt = get().startedAt ?? Date.now();
    const elapsedMs = Date.now() - startedAt;
    const nextAttempts = get().attempts + 1;

    set({ attempts: nextAttempts, lastVerdict: verdict });

    if (!verdict.pass) return null;

    const previous: ChallengeProgress | undefined = get().progress[challengeId];
    const updated: ChallengeProgress = {
      completed: true,
      attempts: (previous?.attempts ?? 0) + nextAttempts,
      bestTimeMs:
        previous?.bestTimeMs != null
          ? Math.min(previous.bestTimeMs, elapsedMs)
          : elapsedMs,
      completedAt: Date.now(),
      hintsUsed: Math.max(previous?.hintsUsed ?? 0, get().hintsRevealed),
    };
    const nextProgress = { ...get().progress, [challengeId]: updated };
    saveProgress(nextProgress);
    set({ progress: nextProgress, showCompletion: true });
    return updated;
  },

  dismissCompletion: () => set({ showCompletion: false }),

  resetProgress: () => {
    saveProgress({});
    set({ progress: {} });
  },
}));

export function isChallengeCompleted(
  progress: Record<string, ChallengeProgress>,
  id: string,
): boolean {
  return Boolean(progress[id]?.completed);
}
