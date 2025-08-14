// ---------- Harness (Orchestrator) ----------
export async function runSuite(args: {
  suite: string;
  runnerName: string;
}): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const suite = loadSuite(args.suite);
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

  const passed = results.filter((r) => r.evaluations[0].pass).length;
  const finishedAt = new Date().toISOString();
  return {
    runner: runner.name,
    suite: args.suite,
    startedAt,
    finishedAt,
    results,
    totals: { passed, failed: results.length - passed, scored: results.length },
  };
}

// ---------- CLI (no deps) ----------
function parseArg(flag: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return fallback;
}

async function main() {
  const suite = parseArg("--suite", "toy");
  const runner = parseArg("--runner", "mock:echo");
  const out = parseArg("--out");

  if (!suite || !runner) {
    console.error("Usage: tsx minibench.ts --suite toy --runner mock:echo [--out results.json]");
    process.exit(2);
  }

  try {
    const result = await runSuite({ suite, runnerName: runner });
    const json = JSON.stringify(result, null, 2);
    if (out) {
      const fs = await import("node:fs/promises");
      await fs.writeFile(out, json, "utf8");
      console.log(`Wrote ${out}`);
    } else {
      console.log(json);
    }
  } catch (err: any) {
    console.error("Error:", err?.message ?? err);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
