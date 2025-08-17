import { describe, it, expect } from "vitest";
import { asModelId } from "@diffsense/types";

describe("asModelId", () => {
  it("returns the same string at runtime (branding is type-only)", () => {
    const raw = "stub-model";
    const branded = asModelId(raw);
    expect(branded).toBe(raw); // runtime identity, type is branded
  });
});
