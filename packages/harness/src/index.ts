import type { Scenario, RunConfig, Evaluator, ScenarioMetric, AggregateMetrics } from "@diffsense/core";

// export async function runScenario(
//   s: Scenario,
//   cfg: RunConfig,
//   runner: (s: Scenario, c: RunConfig) => Promise<unknown>,
//   evaluators: Evaluator[]
// ): Promise<ScenarioMetric> {
//   const raw = await runner(s, cfg);
//   const metrics = Object.assign({}, ...(await Promise.all(evaluators.map(e => e.evaluate(s, raw)))));
//   const ok = typeof metrics["pass"] === "boolean" ? Boolean(metrics["pass"]) : false;
//   return { scenarioId: s.id, ok, metrics, runner: cfg.runner };
// }

export function summarize(runId: string, rows: ScenarioMetric[]): AggregateMetrics {
  const total = rows.length;
  const passed = rows.filter(r => r.ok).length;
  const failed = total - passed;
  return { runId, totals: { total, passed, failed } };
}
