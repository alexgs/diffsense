import type { Scenario } from "./contracts.js";
import type { ScenarioId } from "./ids.js";

/** Your original pieces, now grouped as the Scenario.input payload. */
/** @stability experimental */
export type CodefixConstraints = {
  /** If present, patch.find MUST be one of these. */
  allowedFinds?: string[];
};

/** Input payload for a Codefix scenario. */
/** @stability experimental */
export interface CodefixInput {
  kind: "codefix";        // keeps your discriminator
  source: string;         // buggy code
  entry: "add";           // function name to test (feel free to widen later)
  tests: CodefixTest[];   // tiny truth table
  constraints?: CodefixConstraints;
}

/** The canonical Codefix scenario in the new contract. */
/** @stability experimental */
export type CodefixScenario = Scenario<CodefixInput, string>;

/** @stability experimental */
export type CodefixTest = { args: [number, number]; expect: number };

/** Helper to brand IDs when you make scenarios. */
/** @stability experimental */
export const makeCodefixScenario = (s: {
  id: ScenarioId;
  name: string;
  prompt: string;
  input: CodefixInput;
  expected?: string;
  metadata?: Record<string, unknown>;
}): CodefixScenario => s;
