import { Scenario } from '@diffsense/types';

export const scenarioToySum: Scenario = {
  id: "toy/sum-001",
  kind: "codefix",
  meta: { title: "Fix add(a,b) returns a+b" },
  prompt: `Fix this function so it returns the sum of a and b: \`function add(a, b) { return 3; }\``,
  expected: `function add(a, b) { return a + b; }`,
};
