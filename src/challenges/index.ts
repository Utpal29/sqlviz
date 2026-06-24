import { EASY_CHALLENGES } from "./easy";
import { MEDIUM_CHALLENGES } from "./medium";
import { HARD_CHALLENGES } from "./hard";
import type { Challenge, Difficulty } from "./types";

export const ALL_CHALLENGES: Challenge[] = [
  ...EASY_CHALLENGES,
  ...MEDIUM_CHALLENGES,
  ...HARD_CHALLENGES,
];

export const CHALLENGES_BY_ID: Record<string, Challenge> = Object.fromEntries(
  ALL_CHALLENGES.map((c) => [c.id, c]),
);

export function challengesByDifficulty(d: Difficulty): Challenge[] {
  return ALL_CHALLENGES.filter((c) => c.difficulty === d);
}

export function findChallenge(id: string): Challenge | undefined {
  return CHALLENGES_BY_ID[id];
}

export function nextChallenge(currentId: string): Challenge | undefined {
  const idx = ALL_CHALLENGES.findIndex((c) => c.id === currentId);
  if (idx < 0 || idx >= ALL_CHALLENGES.length - 1) return undefined;
  return ALL_CHALLENGES[idx + 1];
}
