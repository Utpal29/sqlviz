import type { DatasetName } from "../types/database";

export type Difficulty = "easy" | "medium" | "hard";

export interface ChallengeValidation {
  /**
   * Pinned baseline. Almost everything should use "solution_query": the
   * canonical solution runs against the live database for ground truth.
   */
  kind: "solution_query" | "row_count" | "columns_match";
  expectedRowCount?: number;
  requiredColumns?: string[];
  /**
   * When true, the comparison preserves row order. Defaults to whatever the
   * solution query implies (presence of an explicit ORDER BY).
   */
  orderMatters?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  dataset: DatasetName;
  concepts: string[];
  hints: string[];
  starterQuery: string;
  solutionQuery: string;
  validation: ChallengeValidation;
}

export interface ChallengeVerdict {
  pass: boolean;
  reason: string;
  detail?: string;
}
