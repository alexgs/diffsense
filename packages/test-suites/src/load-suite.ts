import { CodefixInput, CodefixScenario, Suite, asScenarioId } from "@diffsense/types";

export async function loadSuite(idOrPath: string): Promise<Suite> {
  if (idOrPath === "toy") {
    return makeToySuite();
  }
  throw new Error(`Unknown suite "${idOrPath}". For now, only "toy" is supported.`);
}

function makeToySuite(): Suite {
  const scenario: CodefixScenario = {
    id: asScenarioId("toy-1"),
    name: "Codefix: add two numbers (toy)",
    prompt:
      "Given this buggy function, provide the corrected return statement only.\n" +
      "Buggy code: `export function add(a,b){ return 3; }`\n" +
      "Return exactly: `return a + b;`",
    expected: "return a + b;",
    input: {
      kind: "codefix",
      source: "export function add(a,b){ return 3; }",
      entry: "add",
      tests: [{ args: [1, 2], expect: 3 }],
      constraints: { allowedFinds: ["return 3;"] }
    } satisfies CodefixInput,
    metadata: { difficulty: "toy", tags: ["codefix", "arith"] }
  };

  const suite: Suite = {
    id: "toy",
    name: "Toy Suite",
    scenarios: [scenario]
  };

  return suite;
}
