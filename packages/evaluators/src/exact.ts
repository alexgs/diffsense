import type { Evaluator, Scenario } from "@diffsense/core";

export const exactMatch: Evaluator = {
  key: "exact",
  async evaluate(s: Scenario, out: unknown) {
    const pass = JSON.stringify(out) === JSON.stringify(s.expected);
    return { pass, exact: pass ? 1 : 0 };
  }
};
