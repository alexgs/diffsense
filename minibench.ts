import 'dotenv/config';

import OpenAI from 'openai';

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
