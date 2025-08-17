import { asScenarioId, Scenario } from '@diffsense/types';
import { describe, it, expect } from "vitest";
import { exactMatch } from "./exact-match";

function makeScenario<E>(expected: E): Scenario<unknown, E> {
  return {
    id: asScenarioId("test-scenario"),
    name: "Test Scenario",
    input: null,
    prompt: "dummy prompt",
    expected,
    metadata: {}
  };
}

describe("exactMatch evaluator", () => {
  it("returns pass when output matches expected", async () => {
    const scenario = makeScenario("hello");
    const result = await exactMatch.evaluate({
      input: "hello",
      outputText: "hello",
      scenario
    });
    const output = Array.isArray(result) ? result[0] : result;

    expect(output.pass).toBe(true);
    expect(output.value).toBe(1);
    expect(output.details).toBeUndefined();
  });

  it("returns fail and details when output does not match expected", async () => {
    const scenario = makeScenario("hello");
    const result = await exactMatch.evaluate({
      input: "hello",
      outputText: "goodbye",
      scenario
    });
    const output = Array.isArray(result) ? result[0] : result;

    expect(output.pass).toBe(false);
    expect(output.value).toBe(0);
    expect(output.details).toEqual({
      expected: "hello",
      received: "goodbye"
    });
  });

  it("trims whitespace before comparing", async () => {
    const scenario = makeScenario("trimmed");
    const result = await exactMatch.evaluate({
      input: "hello",
      outputText: "   trimmed   ",
      scenario
    });
    const output = Array.isArray(result) ? result[0] : result;

    expect(output.pass).toBe(true);
  });
});
