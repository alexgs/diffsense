import { loadSuite } from "@diffsense/test-suites";
import type { RunSuiteOptions, Scenario, Score } from "@diffsense/types";
import type { ScenarioRunResult, SuiteRunResult } from './types.js';

function matchesFilter(filter: string, id: string): boolean {
  if (filter.startsWith('/') && filter.endsWith('/')) {
    return new RegExp(filter.slice(1, -1)).test(id);
  }
  return id === filter || id.toLowerCase().includes(filter.toLowerCase());
}

/** Normalize a Score | Score[] into a flat array. */
function toScoreArray(s: Score | Score[]): Score[] {
  return Array.isArray(s) ? s : [s];
}

/**
 * Minimal harness: load a suite, run each scenario through the runner,
 * evaluate the output, and collect results.
 */
export async function runSuite(opts: RunSuiteOptions): Promise<SuiteRunResult> {
  const { suiteIdOrPath, runner, evaluator, scenarioFilters } = opts;

  const suite = await loadSuite(suiteIdOrPath); // whatever you already do

  const scenarios = scenarioFilters?.length
    ? suite.scenarios.filter(s =>
      scenarioFilters.some(f => matchesFilter(f, s.id))
    )
    : suite.scenarios;

  if (!scenarios.length) {
    throw new Error(
      `No scenarios matched filters: ${scenarioFilters?.join(', ')}`
    );
  }

  const results: ScenarioRunResult[] = [];
  for (const scn of scenarios as Scenario[]) {
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
