// ---------- Types ----------
export interface Evaluator {
  key: string;
  evaluate(s: Scenario, output: unknown): Evaluation;
}

export type Evaluation = {
  evaluator: string;
  pass: boolean;
  score: number; // 1 or 0 for exact-match
  details?: Record<string, any>;
};

export type RunResult = {
  runner: string;
  suite: string;
  startedAt: string;
  finishedAt: string;
  results: ScenarioResult[];
  totals: { passed: number; failed: number; scored: number };
};

export type Runner = {
  name: string;
  run: (prompt: string, scenario: Scenario) => Promise<string> | string;
};

export type Scenario = {
  id: string;
  prompt: string;
  expected: string;
  meta?: Record<string, any>;
};

export type ScenarioResult = {
  scenarioId: string;
  output: string;
  evaluations: Evaluation[];
};

// ---------- Toy suite ----------
const toySuite: Scenario[] = [
  {
    id: "toy-1",
    prompt: "Return exactly: hello world",
    expected: "hello world",
  },
  {
    id: "toy-2",
    prompt: "Return exactly: 42",
    expected: "0042", // Intentionally wrong to demonstrate failure
  },
];

export function loadSuite(name: string): Scenario[] {
  if (name === "toy") {
    return toySuite;
  }
  throw new Error(`Unknown suite: ${name}`);
}

// ---------- Evaluator(s) ----------
const exactMatchEvaluator: Evaluator = {
  key: "exact-match",
  evaluate(scenario: Scenario, output: string): Evaluation {
    const actual = (output ?? "").trim();
    const expected = (scenario.expected ?? "").trim();
    const pass = actual === expected;
    return {
      evaluator: this.key,
      pass,
      score: pass ? 1 : 0,
      details: pass ? undefined : { expected, got: actual },
    };
  },
};

// ---------- Runners (purely deterministic mocks) ----------
export function makeRunner(kind: string): Runner {
  if (kind === "mock:pass") {
    return {
      name: kind,
      run: (_prompt, scenario) => scenario.expected, // Always returns the expected value
    };
  }
  if (kind === "mock:fail") {
    return {
      name: kind,
      run: (_prompt, _scenario) => "<wrong>",
    };
  }
  if (kind === "mock:echo") {
    return {
      name: kind,
      run: (prompt) => prompt.replace(/^Return exactly:\s*/i, ""),
    };
  }
  throw new Error(`Unknown runner: ${kind}`);
}

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
    const output = await runner.run(scenario.prompt, scenario);
    const evaluation = exactMatchEvaluator.evaluate(scenario, String(output));
    results.push({ scenarioId: scenario.id, output: String(output), evaluations: [evaluation] });
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
