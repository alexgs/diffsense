export * from './exact';

export type EvalResult = { passed: boolean; details?: unknown };

export async function evaluate(opts: {
  mode: "patch" | "diff";
  workdir: string;
  expected?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  runnerOutput: { patchText?: string; diffText?: string; analysis?: string };
}): Promise<EvalResult> {
  const { mode, workdir, expected, inputs, runnerOutput } = opts;

  if (expected?.type === "cases-pass") {
    const { evalCasesPass } = await import("./cases-pass.js");
    return evalCasesPass(workdir, inputs);
  }

  if (mode === "diff" && typeof expected?.output !== "undefined") {
    const { evalOutputEquals } = await import("./output-equals.js");
    return evalOutputEquals(runnerOutput.diffText ?? "", expected.output);
  }

  return { passed: false, details: { reason: "No matching evaluator" } };
}
