import { LegacyEvaluation, LegacyEvaluator, LegacyScenario } from '@diffsense/types';

export const exactMatchEvaluator: LegacyEvaluator = {
  key: "exact-match",
  evaluate(scenario: LegacyScenario, output: string): LegacyEvaluation {
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
