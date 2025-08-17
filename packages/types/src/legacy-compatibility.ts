import type {
  EvaluationContext,
  Evaluator as NewEvaluator,
  Runner as NewRunner,
  RunnerResult as NewRunnerResult,
  Scenario as NewScenario,
  Score as NewScore,
} from "./contracts.js";
import type { ScenarioId } from "./ids.js";

/* ============================================================
   Legacy type names — now prefixed to avoid export collisions.
   ============================================================ */

export type LegacyCodefixConstraints = {
  allowedFinds?: string[]; // if present, patch.find MUST be one of these
};

/** @deprecated Prefer Scenario<I,E> and domain-specific inputs (e.g., CodefixInput). */
export type LegacyCodefixScenario = LegacyScenario & {
  kind: "codefix";
  source: string;           // the buggy code
  entry: "add";             // exported function name to test
  tests: LegacyCodefixTest[];     // tiny truth table
  constraints?: LegacyCodefixConstraints;
};

export type LegacyCodefixTest = { args: [number, number]; expect: number };


/** @deprecated Prefer Evaluator with evaluate(ctx). */
export interface LegacyEvaluator {
  key: string;
  // Allow sync or async legacy evaluators
  evaluate(s: LegacyScenario, output: unknown): Promise<LegacyEvaluation> | LegacyEvaluation;
}

/** @deprecated Prefer Score. */
export type LegacyEvaluation = {
  evaluator: string;
  pass: boolean;
  score: number; // usually 0/1
  details?: Record<string, any>;
};

/** @deprecated Prefer a harness-level result shape later. */
export type LegacyRunResult = {
  runner: string;
  suite: string;
  startedAt: string;
  finishedAt: string;
  results: LegacyScenarioResult[];
  totals: { passed: number; failed: number; scored: number };
};

/** @deprecated Prefer Runner returning RunnerResult. */
export type LegacyRunner = {
  name: string;
  run: (prompt: string, scenario: LegacyScenario) => Promise<string> | string;
};

/** @deprecated Prefer Scenario<I,E> and domain-specific inputs (e.g., CodefixInput). */
export type LegacyScenario = {
  id: string;
  expected: string;
  kind?: string;
  meta?: Record<string, any>;
  prompt: string;
};

/** @deprecated Prefer a harness-level result shape later. */
export type LegacyScenarioResult = {
  scenarioId: string;
  output: string;
  evaluations: LegacyEvaluation[];
};

/* ===========================
   Adapters between old and new
   =========================== */

/** Map old Evaluation -> new Score */
export const evaluationToScore = (ev: LegacyEvaluation): NewScore => ({
  key: ev.evaluator,
  value: ev.score,
  pass: ev.pass,
  details: ev.details,
});

/** Map new Score -> old Evaluation (supply evaluator key). */
export const scoreToEvaluation = (score: NewScore, evaluatorKey?: string): LegacyEvaluation => ({
  evaluator: evaluatorKey ?? score.key,
  pass: score.pass,
  score: typeof score.value === "number" ? score.value : Number(score.value),
  details: score.details as Record<string, any> | undefined,
});

/** Wrap an old Evaluator into the new Evaluator interface. */
export const adaptOldEvaluatorToNew = (oldEval: LegacyEvaluator): NewEvaluator => ({
  async evaluate(ctx) {
    const resMaybe = oldEval.evaluate(
      {
        id: (ctx.scenario.id as unknown as string) ?? "",
        expected: String(ctx.scenario.expected ?? ""),
        kind: (ctx.scenario as any).input?.kind ?? (ctx.scenario as any).kind,
        meta: (ctx.scenario as any).metadata ?? (ctx.scenario as any).meta,
        prompt: ctx.scenario.prompt,
      },
      ctx.outputText
    );

    // <-- The important change: normalize sync/async to a concrete Evaluation
    const res = await resMaybe;

    return evaluationToScore(res);
  },
});

/** Wrap a new Evaluator so old call-sites can keep using (scenario, output). */
export const adaptNewEvaluatorToOld = (newEval: NewEvaluator): LegacyEvaluator => ({
  key: "composed",
  evaluate(scn, output) {
    // Construct a minimal new-style Scenario and ctx
    const newScenario: NewScenario = {
      id: (scn.id as unknown as ScenarioId) ?? ("" as unknown as ScenarioId),
      name: scn.kind ?? "legacy",
      input: { kind: scn.kind, meta: scn.meta },
      prompt: scn.prompt,
      expected: scn.expected,
      metadata: scn.meta,
    };
    // Run new evaluator and map back
    return Promise.resolve(
      newEval.evaluate({ scenario: newScenario, input: (newScenario as any).input, outputText: String(output) })
    ).then((scoreOrScores) => {
      const first = Array.isArray(scoreOrScores) ? scoreOrScores[0] : scoreOrScores;
      return scoreToEvaluation(first, (first as any).key);
    });
  },
});

/** Wrap an old Runner into the new Runner interface. */
export const adaptOldRunnerToNew = (oldRunner: LegacyRunner, modelName = "legacy-model"): NewRunner => ({
  async run(prompt) {
    const out = await oldRunner.run(prompt, {
      id: "",
      expected: "",
      prompt,
    });
    const text = typeof out === "string" ? out : String(out);
    const res: NewRunnerResult = {
      outputText: text,
      model: modelName as any,
    };
    return res;
  },
});

/** Wrap a new Runner so old call-sites can keep using run(prompt, scenario). */
export const adaptNewRunnerToOld = (newRunner: NewRunner, name = "adapted"): LegacyRunner => ({
  name,
  async run(prompt) {
    const res = await newRunner.run(prompt);
    return res.outputText;
  },
});
