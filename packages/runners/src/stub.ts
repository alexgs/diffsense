import { Runner, asModelId } from "@diffsense/types";

/**
 * Deterministic StubRunner:
 * - If the prompt contains the expected codefix answer, echo it; else "???".
 * - This keeps First Pulse fully offline.
 */
export const StubRunner: Runner = {
  async run(prompt: string) {
    const m = /return a \+ b;/.test(prompt) ? "return a + b;" : "???";
    return {
      outputText: m,
      model: asModelId("stub-model"),
      tokens: m.length,
      latencyMs: 1
    };
  }
};
