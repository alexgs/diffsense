import type { Evaluator } from "@diffsense/types";

export const exactMatch: Evaluator = {
  async evaluate({ scenario, outputText }) {
    const expected = String(scenario.expected ?? "").trim();
    const received = String(outputText ?? "").trim();
    const pass = received === expected;
    return {
      key: "exact_match",
      value: pass ? 1 : 0,
      pass,
      details: pass ? undefined : { expected, received },
    };
  }
};
