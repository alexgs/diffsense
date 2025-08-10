import type { Scenario } from "@diffsense/core";
import { prepareWorkspace } from "./prepare-workspace.js";
import { buildRunnerInput } from "./build-runner-input.js";
import { applyUnifiedDiff } from "./apply-unified-diff.js";
import { evaluate } from "@diffsense/evaluators";

export async function runScenario(
  scenario: Scenario,
  runner: { run(input: any): Promise<{ patchText?: string; diffText?: string; analysis?: string }> }
) {
  const workdir = await prepareWorkspace(scenario.repoFixture);
  const input = await buildRunnerInput(scenario, workdir);

  const out = await runner.run(input);

  if (scenario.evaluationMode === "patch") {
    const patch = out.patchText ?? "";
    if (!patch.trim()) return { id: scenario.id, passed: false, details: { reason: "No patch" } };
    await applyUnifiedDiff(workdir, patch);
  }

  const result = await evaluate({
    mode: scenario.evaluationMode,
    workdir,
    expected: scenario.expected,
    inputs: scenario.inputs,
    runnerOutput: out
  });

  return { id: scenario.id, ...result, workdir };
}
