import type { Scenario, RunConfig } from "@diffsense/core";

/**
 * Modes:
 *  - pass   -> returns s.expected (so exactMatch passes)
 *  - fail   -> returns a clearly wrong shape
 *  - echo   -> echoes the prompt (useful with non-exact evaluators)
 *  - random -> 50/50 pass/fail (still returns deterministic shapes)
 */
export type MockMode = "pass" | "fail" | "echo" | "random";

export function mockRunner(mode: MockMode = "pass") {
  return async (s: Scenario, _cfg: RunConfig) => {
    switch (mode) {
      case "pass":
        return s.expected ?? { ok: true };
      case "fail":
        return { mock: "nope", reason: "intentional-fail" };
      case "echo":
        return { output: s.prompt };
      case "random":
        return Math.random() < 0.5
          ? (s.expected ?? { ok: true })
          : { mock: "nope", reason: "randomized-fail" };
    }
  };
}
