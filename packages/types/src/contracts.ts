import type { ModelId, ScenarioId } from "./ids.js";

// --- SCHEMA VERSIONS ---

/** Current JSON schema version for results artifacts written to runs/<stamp>. */
export const RESULTS_SCHEMA_VERSION = 1 as const;
export type ResultsSchemaVersion = typeof RESULTS_SCHEMA_VERSION;

/** Current JSON format version for CLI manifest (runs/<stamp>/manifest.json). */
export const MANIFEST_FORMAT_VERSION = 1 as const;
export type ManifestFormatVersion = typeof MANIFEST_FORMAT_VERSION;

// --- EVALUATOR CONTRACTS ---

/** @stability stable */
export interface EvaluationContext<I = unknown, E = unknown> {
  scenario: Scenario<I, E>;
  input: I;
  outputText: string;
}

/** @stability stable */
export interface Evaluator<I = unknown, E = unknown> {
  evaluate(ctx: EvaluationContext<I, E>): Promise<Score | Score[]>;
}

/** @stability stable */
export interface Score {
  key: string;     // e.g. "exact_match"
  value: ScoreValue;
  pass: boolean;
  details?: unknown;
}

/** @stability stable */
export type ScoreValue = number;

// --- RUNNER CONTRACTS ---

/** @stability stable */
export interface Runner {
  run(prompt: string, options?: RunnerOptions): Promise<RunnerResult>;
}

/** @stability stable */
export interface RunnerOptions {
  timeoutMs?: number;
  [k: string]: unknown;
}

/** @stability stable */
export interface RunnerResult {
  outputText: string;
  model: ModelId;
  tokens?: number;
  latencyMs?: number;
  raw?: unknown;
}

/** @stability experimental */
export interface RunSuiteOptions {
  suiteIdOrPath: string;
  runner: Runner;
  evaluator: Evaluator;

  // Optional allow-list of scenario filters (IDs, substrings, or /regex/).
  scenarioFilters?: string[];

  // later: config, concurrency, timeouts, etc.
}

// --- SCENARIO CONTRACTS ---

// Minimal and generic scenario
/** @stability stable */
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

/** @stability stable */
export type ScenarioLike = Scenario<unknown, unknown>;

/** @stability stable */
export interface ScenarioRunResult {
  scenarioId: string;
  outputText: string;
  scores: Array<{
    key: string;
    value: number;
    pass: boolean;
    details?: unknown;
  }>;
  pass: boolean; // aggregate: true iff all scores pass
  model?: string;
  latencyMs?: number;
  tokens?: number;
}

// --- SUITE CONTRACTS ---

// Group of scenarios, used by loaders & harness
/** @stability stable */
export interface Suite<I = unknown, E = unknown> {
  id: string;
  name: string;
  scenarios: Array<Scenario<I, E>>;
}

/** @stability stable */
export interface SuiteRunResult {
  /** Version of the results.json schema. Bump when breaking the JSON shape. */
  schemaVersion: ResultsSchemaVersion;

  suiteId: string;
  results: ScenarioRunResult[];
  summary: SuiteSummary;
  metadata?: Record<string, unknown>;
}

/** @stability stable */
export interface SuiteSummary {
  total: number;
  passed: number;
  failed: number;
}
