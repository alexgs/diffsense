import type { ModelId, ScenarioId } from "./ids";

/** Evaluator contracts */
export interface EvaluationContext<I = unknown, E = unknown> {
  scenario: Scenario<I, E>;
  input: I;
  outputText: string;
}

export interface Evaluator<I = unknown, E = unknown> {
  evaluate(ctx: EvaluationContext<I, E>): Promise<Score | Score[]>;
}

export interface Score {
  key: string;     // e.g. "exact_match"
  value: ScoreValue;
  pass: boolean;
  details?: unknown;
}

export type ScoreValue = number;

/** Runner contracts */
export interface Runner {
  run(prompt: string, options?: RunnerOptions): Promise<RunnerResult>;
}

export interface RunnerOptions {
  timeoutMs?: number;
  [k: string]: unknown;
}

export interface RunnerResult {
  outputText: string;
  model: ModelId;
  tokens?: number;
  latencyMs?: number;
  raw?: unknown;
}

/** Scenario contract (minimal and generic) */
export interface Scenario<I = unknown, E = unknown> {
  id: ScenarioId;
  name: string;
  /** Scenario-specific input payload (free-form). */
  input: I;
  /** Prompt sent to the runner/model. */
  prompt: string;
  /** Optional “expected” value used by simple evaluators. */
  expected?: E;
  /** Free-form metadata. */
  metadata?: Record<string, unknown>;
}

