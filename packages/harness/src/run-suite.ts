import { loadSuite } from "@diffsense/test-suites";
import type { Scenario, Score } from "@diffsense/types";
import type { RunSuiteOptions, ScenarioRunResult, SuiteRunResult } from './types';

/** Normalize a Score | Score[] into a flat array. */
function toScoreArray(s: Score | Score[]): Score[] {
  return Array.isArray(s) ? s : [s];
}

/**
 * Minimal harness: load a suite, run each scenario through the runner,
 * evaluate the output, and collect results.
 */
export async function runSuite(opts: RunSuiteOptions): Promise<SuiteRunResult> {
  const suite = await loadSuite(opts.suiteIdOrPath);

  const results: ScenarioRunResult[] = [];
  for (const scn of suite.scenarios as Scenario[]) {
    // 1) Run the prompt through the runner
    const rr = await opts.runner.run(scn.prompt);

    // 2) Evaluate the output (async-aware)
    const scores = toScoreArray(
      await opts.evaluator.evaluate({
        scenario: scn,
        input: scn.input,
        outputText: rr.outputText,
      })
    );

    // 3) Aggregate
    const pass = scores.every(s => s.pass);
    results.push({
      scenarioId: scn.id as unknown as string,
      outputText: rr.outputText,
      scores: scores.map(s => ({
        key: s.key,
        value: Number(s.value),
        pass: s.pass,
        details: s.details,
      })),
      pass,
      model: (rr.model as unknown as string) ?? undefined,
      latencyMs: rr.latencyMs,
      tokens: rr.tokens,
    });
  }

  const passed = results.filter(r => r.pass).length;
  const summary = {
    total: results.length,
    passed,
    failed: results.length - passed,
  };

  return {
    suiteId: suite.id,
    results,
    summary,
    metadata: { suiteName: suite.name },
  };
}
