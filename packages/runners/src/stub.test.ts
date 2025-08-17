// src/StubRunner.test.ts
// Adjust the import path to wherever your file lives.
import { describe, it, expect } from "vitest";
import { StubRunner } from "./stub";
import { asModelId } from "@diffsense/types";

describe("StubRunner", () => {
  it("echoes the codefix when the prompt contains 'return a + b;'", async () => {
    const prompt = "Please fix:\nreturn a + b;\nThanks!";
    const res = await StubRunner.run(prompt);

    expect(res.outputText).toBe("return a + b;");
    expect(res.tokens).toBe("return a + b;".length); // 13
    expect(res.model).toBe(asModelId("stub-model"));
    expect(res.latencyMs).toBe(1);
  });

  it("returns '???' when the prompt does not contain the exact snippet", async () => {
    const prompt = "try this instead: return a+b; // no spaces";
    const res = await StubRunner.run(prompt);

    expect(res.outputText).toBe("???");
    expect(res.tokens).toBe("???".length); // 3
    expect(res.model).toBe(asModelId("stub-model"));
    expect(res.latencyMs).toBe(1);
  });

  it("is deterministic for the same prompt", async () => {
    const prompt = "random text without the snippet";
    const r1 = await StubRunner.run(prompt);
    const r2 = await StubRunner.run(prompt);

    expect(r1).toEqual(r2);
  });
});
