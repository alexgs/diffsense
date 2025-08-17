import type { Evaluator, Runner, Scenario } from '@diffsense/types';

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

export interface SuiteSummary {
  total: number;
  passed: number;
  failed: number;
}

export interface SuiteRunResult {
  suiteId: string;
  results: ScenarioRunResult[];
  summary: SuiteSummary;
  metadata?: Record<string, unknown>;
}

export type ScenarioLike = Scenario<unknown, unknown>;
