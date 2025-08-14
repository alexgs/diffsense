import { Evaluation, Evaluator, Scenario } from '@diffsense/types';

export const exactMatchEvaluator: Evaluator = {
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
