import { Evaluation, RunResult, ScenarioResult } from "@diffsense/types";
import { loadScenario } from "@diffsense/scenarios";
import { makeRunner } from "@diffsense/runners";
import { exactMatchEvaluator, codefixEvaluator } from "@diffsense/evaluators";

export async function runScenario(args: { suite: string; runnerName: string }): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const suite = loadScenario(args.suite);
  const runner = makeRunner(args.runnerName);

  const results: ScenarioResult[] = [];
  for (const scenario of suite) {
    const output = await runner.run((scenario as any).prompt ?? scenario.prompt, scenario);
    const evals: Evaluation[] = [];
    if ((scenario as any).kind === "codefix") {
      evals.push(codefixEvaluator.evaluate(scenario, String(output)));
    } else {
      evals.push(exactMatchEvaluator.evaluate(scenario, String(output)));
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
