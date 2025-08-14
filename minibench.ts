import 'dotenv/config';

import OpenAI from 'openai';

// ---------- Types ----------
type CodefixConstraints = {
  allowedFinds?: string[]; // if present, patch.find MUST be one of these
};

type CodefixScenario = Scenario & {
  kind: "codefix";
  source: string;           // the buggy code
  entry: "add";             // exported function name to test
  tests: CodefixTest[];     // tiny truth table
  constraints?: CodefixConstraints;
};

type CodefixTest = { args: [number, number]; expect: number };

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

// ---------- Suites ----------

export function loadSuite(name: string): Scenario[] {
  if (name === "toy") {
    return toySuite;
  }
  if (name === "codefix-toy") {
    return codefixSuite;
  }

  throw new Error(`Unknown suite: ${name}`);
}

// Toy Suite
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

// Codefix Suite
const codefixSuite: CodefixScenario[] = [
  // Variant A: Unconstrained (real-world)
  {
    id: "codefix-add-unconstrained",
    kind: "codefix",
    prompt:
      "Given a small JS function and a test table, return strict JSON ONLY:\n" +
      '{ "explanation": string, "patch": { "find": string, "replace": string } }',
    expected: "",
    source: `function add(a, b) { return 3; }`,
    entry: "add",
    tests: [
      { args: [1, 1], expect: 2 },
      { args: [2, 1], expect: 3 },
      { args: [2, 2], expect: 4 },
    ],
    // no constraints: model must locate target itself
  },

  // Variant B: Constrained (controlled)
  {
    id: "codefix-add-constrained",
    kind: "codefix",
    prompt:
      "Given a small JS function and a test table, return strict JSON ONLY:\n" +
      '{ "explanation": string, "patch": { "find": string, "replace": string } }\n' +
      "IMPORTANT: patch.find MUST be one of the following EXACT strings (copy verbatim):\n" +
      "1) `return 3;`",
    expected: "",
    source: `function add(a, b) { return 3; }`,
    entry: "add",
    tests: [
      { args: [1, 1], expect: 2 },
      { args: [2, 1], expect: 3 },
      { args: [2, 2], expect: 4 },
    ],
    constraints: { allowedFinds: ["return 3;"] }, // ← enforceable by evaluator
  },
];

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

const codefixEvaluator = {
  name: "codefix-patch-applies-and-tests",
  evaluate(scenario: Scenario, output: string): Evaluation {
    try {
      const scn = scenario as CodefixScenario;
      if (scn.kind !== "codefix") {
        return { evaluator: this.name, pass: false, score: 0, details: { error: "not-codefix" } };
      }

      const parsed = JSON.parse(output);
      const find = String(parsed?.patch?.find ?? "");
      const replace = String(parsed?.patch?.replace ?? "");

      if (!find || !replace) {
        return { evaluator: this.name, pass: false, score: 0, details: { error: "bad-patch-shape", parsed } };
      }

      // NEW: constraint check (controlled variant)
      const allowed = scn.constraints?.allowedFinds;
      if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(find)) {
        return {
          evaluator: this.name,
          pass: false,
          score: 0,
          details: { error: "find-not-allowed", find, allowed },
        };
      }

      const patched = scn.source.replace(find, replace);
      if (patched === scn.source) {
        return { evaluator: this.name, pass: false, score: 0, details: { error: "find-not-found", find } };
      }

      const getFn = new Function(
        `"use strict"; ${patched}; return typeof ${scn.entry}==='function' ? ${scn.entry} : null;`
      );
      const fn = getFn();
      if (typeof fn !== "function") {
        return { evaluator: this.name, pass: false, score: 0, details: { error: "entry-not-found" } };
      }

      const failures: Array<{ args: any[]; expect: any; got: any }> = [];
      for (const t of scn.tests) {
        const got = fn(...t.args);
        if (got !== t.expect) failures.push({ args: t.args, expect: t.expect, got });
      }

      const pass = failures.length === 0;
      return { evaluator: this.name, pass, score: pass ? 1 : 0, details: pass ? undefined : { failures, patched } };
    } catch (err: any) {
      return { evaluator: this.name, pass: false, score: 0, details: { error: String(err?.message ?? err) } };
    }
  },
};

// ---------- Runners (purely deterministic mocks) ----------
export function makeRunner(kind: string): Runner {
  if (kind === "openai:chat") {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    return {
      name: kind,
      run: async (prompt, scenario) => {
        // Deterministic, “dumb” instruction so exact-match can pass.
        // We’re intentionally NOT templating or adding options yet.
        const instructions =
          "You are a tool that extracts the exact text following 'Return exactly:' from the user input. " +
          "Return ONLY that text with no quotes, punctuation, or explanation. " +
          "If the user input does not contain that phrase, return an empty string.";
          // "Return only strict JSON with keys explanation and patch { find, replace }. No markdown.";

        const resp = await client.responses.create({
          model: "gpt-4o-mini",        // fast/cheap is fine for this; change later if you want
          input: prompt,               // the same prompt your mocks see
          instructions,                // “system” style guidance for determinism
          temperature: 0,              // reduce variance for exact-match checks
          // max_output_tokens: 64,    // optional: keep responses tiny
        });

        // Simple text—keeps our harness contract unchanged
        return resp.output_text ?? "";
      },
    };
  }
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
  if (kind === "mock:codefix") {
    return {
      name: kind,
      run: (_prompt, scenario) => {
        if ((scenario as any).kind === "codefix") {
          return JSON.stringify({
            explanation: "Replace constant with sum.",
            patch: { find: "return 3;", replace: "return a + b;" }
          });
        }
        return String(_prompt).replace(/^Return exactly:\s*/i, "");
      },
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
