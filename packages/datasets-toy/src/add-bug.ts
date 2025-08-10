import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { Scenario } from "@diffsense/core";

const here = dirname(fileURLToPath(import.meta.url));
const repoFixture = `${here}/fixtures/add-bug`;

export const toyAddBug: Scenario[] = [
  {
    id: "toy-add-bug",
    evaluationMode: "patch",
    prompt:
      "Some add() tests pass and some fail. Briefly explain why (1,2)->3 passed before the fix, " +
      "then return a unified diff that fixes src/add.ts so these cases pass: (1,1)=2, (1,2)=3, (2,2)=4.",
    inputs: {
      cases: [
        { a: 1, b: 1, out: 2 },
        { a: 1, b: 2, out: 3 },
        { a: 2, b: 2, out: 4 }
      ]
    },
    expected: { type: "cases-pass" },
    repoFixture,
    tags: ["toy", "buggy-code"]
  }
];
