import { CodefixScenario } from '@diffsense/types';

export const codefixSuite: CodefixScenario[] = [
  // Variant A: Unconstrained (real-world)
  {
    id: "codefix-add-unconstrained",
    kind: "codefix",
    prompt:
      "Given a small JS function and a test table, return strict JSON ONLY:\n" +
      '{ "explanation": string, "patch": { "find": string, "replace": string } }',
    expected: "",
    source: `function add(a, b) { return 3; }`,
    entry: "add",
    tests: [
      { args: [1, 1], expect: 2 },
      { args: [2, 1], expect: 3 },
      { args: [2, 2], expect: 4 },
    ],
    // no constraints: model must locate target itself
  },

  // Variant B: Constrained (controlled)
  {
    id: "codefix-add-constrained",
    kind: "codefix",
    prompt:
      "Given a small JS function and a test table, return strict JSON ONLY:\n" +
      '{ "explanation": string, "patch": { "find": string, "replace": string } }\n' +
      "IMPORTANT: patch.find MUST be one of the following EXACT strings (copy verbatim):\n" +
      "1) `return 3;`",
    expected: "",
    source: `function add(a, b) { return 3; }`,
    entry: "add",
    tests: [
      { args: [1, 1], expect: 2 },
      { args: [2, 1], expect: 3 },
      { args: [2, 2], expect: 4 },
    ],
    constraints: { allowedFinds: ["return 3;"] }, // ← enforceable by evaluator
  },
];
