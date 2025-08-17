import { describe, it, expect } from "vitest";
import { loadSuite } from "./load-suite";
import type { Suite } from "@diffsense/types";

describe("loadSuite", () => {
  it('returns the "toy" suite when idOrPath is "toy"', async () => {
    const suite: Suite = await loadSuite("toy");

    expect(suite).toBeTruthy();
    expect(suite.id).toBe("toy");
    expect(typeof suite.name).toBe("string");

    // scenarios should be an array; sanity-check a couple of fields if present
    expect(Array.isArray(suite.scenarios)).toBe(true);
    if (suite.scenarios.length > 0) {
      const first = suite.scenarios[0] as any;
      expect(typeof first.id).toBe("string");
      expect(typeof first.prompt).toBe("string");
    }
  });

  it("throws a helpful error for unknown suite ids", async () => {
    await expect(loadSuite("nope")).rejects.toThrow(/Unknown suite "nope"/);
  });
});
