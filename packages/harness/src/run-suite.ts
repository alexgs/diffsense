import { LegacyEvaluation, LegacyRunResult, LegacyScenarioResult } from "@diffsense/types";
import { loadSuite } from "@diffsense/test-suites";
import { makeRunner } from "@diffsense/runners";
import { exactMatchEvaluator, codefixEvaluator } from "@diffsense/evaluators";

export async function runSuite(args: { suite: string; runnerName: string }): Promise<LegacyRunResult> {
  const startedAt = new Date().toISOString();
  const suite = loadSuite(args.suite);
  const runner = makeRunner(args.runnerName);

  const results: LegacyScenarioResult[] = [];
  for (const scenario of suite) {
    const output = await runner.run((scenario as any).prompt ?? scenario.prompt, scenario);
    const evals: LegacyEvaluation[] = [];
    if ((scenario as any).kind === "codefix") {
      evals.push(codefixEvaluator.evaluate(scenario, String(output)));
    } else {
      const result = await exactMatchEvaluator.evaluate(scenario, String(output));
      evals.push(result);
    }
    results.push({ scenarioId: scenario.id, output: String(output), evaluations: evals });
  }

  const passed = results.filter(r => r.evaluations[0].pass).length;
  const finishedAt = new Date().toISOString();
  return {
    runner: runner.name,
    suite: args.suite,
    startedAt,
    finishedAt,
    results,
    totals: { passed, failed: results.length - passed, scored: results.length }
  };
}
