export interface AggregateMetrics {
  byTag?: Record<string, { passed: number; total: number }>;
  runId: string;
  totals: { passed: number; failed: number; total: number };
}

export type EvaluationMode = "patch" | "diff";

export interface Evaluator {
  evaluate(s: Scenario, output: unknown): Promise<Record<string, number | string | boolean>>;
  key: string;
}

export interface RunConfig {
  maxTokens?: number;
  runner: string; // "openai:gpt-4o-mini" | "local:cli" | etc.
  seed?: number;
  temperature?: number;
  timeoutSec?: number;
}

export interface RunManifest {
  schemaVersion: "1.0";
  artifacts: { path: string; sha256: string; bytes: number }[];
  privatePacks?: string[]; // names@versions used
  publicGitRef: string;    // commit SHA for this repo
  runId: string;
  runners: { id: string; api?: string }[];
  seed?: number;
  suite: string;           // e.g., "core@0.1.0"
  createdAt: string;
}

export interface Scenario {
  id: string;
  evaluationMode: EvaluationMode;
  expected?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  prompt: string;
  repoFixture?: string;
  tags?: string[];
}

export interface ScenarioMetric {
  scenarioId: string;
  metrics: Record<string, number | string | boolean>;
  ok: boolean;
  runner: string;
}
