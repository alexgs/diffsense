export type CodefixConstraints = {
  allowedFinds?: string[]; // if present, patch.find MUST be one of these
};

export type CodefixScenario = Scenario & {
  kind: "codefix";
  source: string;           // the buggy code
  entry: "add";             // exported function name to test
  tests: CodefixTest[];     // tiny truth table
  constraints?: CodefixConstraints;
};

export type CodefixTest = { args: [number, number]; expect: number };

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
  expected: string;
  kind?: string; // TODO Eventually this should be a required field, I think
  meta?: Record<string, any>;
  prompt: string;
};

export type ScenarioResult = {
  scenarioId: string;
  output: string;
  evaluations: Evaluation[];
};
