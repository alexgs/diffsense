import { describe, it, expect, beforeEach, vi } from "vitest";
import { runSuite } from "./run-suite";

// --- Types the test cares about (lightweight stubs) ---
type Scenario = {
  id: string;
  name: string;
  input: unknown;
  prompt: string;
  expected?: unknown;
  metadata?: Record<string, unknown>;
};

type Suite = {
  id: string;
  name: string;
  scenarios: Scenario[];
};

type Runner = {
  run: (prompt: string) => Promise<{
    outputText: string;
    model?: string;
    latencyMs?: number;
    tokens?: unknown;
  }>;
};

type Score = {
  key: string;
  value: number | string | boolean;
  pass: boolean;
  details?: unknown;
};

type Evaluator = {
  evaluate: (args: {
    scenario: Scenario;
    input: unknown;
    outputText: string;
  }) => Promise<Score | Score[]>;
};

// --- Mock @diffsense/test-suites::loadSuite ---
let suiteMock: Suite;

vi.mock("@diffsense/test-suites", () => ({
  loadSuite: vi.fn(async () => suiteMock),
}));

// --- Test Suite ---
describe("runSuite", () => {
  beforeEach(() => {
    suiteMock = {
      id: "toy",
      name: "Toy Suite",
      scenarios: [
        { id: "a-1", name: "A1", input: null, prompt: "P1" },
        { id: "b-2", name: "B2", input: null, prompt: "P2" },
      ],
    };
    vi.clearAllMocks();
  });

  it("runs all scenarios and aggregates pass summary (single Score)", async () => {
    const runner: Runner = {
      run: vi.fn(async (prompt) => ({
        outputText: prompt === "P1" ? "ok-1" : "ok-2",
        model: "test-model",
        latencyMs: 5,
      })),
    };

    const evaluator: Evaluator = {
      evaluate: vi.fn(async ({ outputText }) => ({
        key: "exact",
        value: 1,
        pass: outputText.startsWith("ok"),
      })),
    };

    const out = await runSuite({
      suiteIdOrPath: "toy",
      runner,
      evaluator,
    } as any);

    // two scenarios run
    expect(out.results).toHaveLength(2);
    // all passed
    expect(out.summary).toEqual({ total: 2, passed: 2, failed: 0 });
    // score shape normalized
    for (const r of out.results) {
      expect(r.pass).toBe(true);
      expect(r.scores).toEqual([
        expect.objectContaining({ key: "exact", value: 1, pass: true }),
      ]);
      expect(r.model).toBe("test-model");
      expect(typeof r.latencyMs).toBe("number");
    }
  });

  it("treats any failing score in an array as a scenario failure", async () => {
    const runner: Runner = {
      run: vi.fn(async ({}) => ({ outputText: "anything" })),
    };

    const evaluator: Evaluator = {
      // return multiple scores, one failing
      evaluate: vi.fn(async () => [
        { key: "exact", value: 1, pass: true },
        { key: "style", value: 0, pass: false, details: { reason: "nope" } },
      ]),
    };

    const out = await runSuite({
      suiteIdOrPath: "toy",
      runner,
      evaluator,
    } as any);

    expect(out.summary.total).toBe(2);
    // both scenarios evaluate the same and thus both fail
    expect(out.summary.failed).toBe(2);
    expect(out.summary.passed).toBe(0);
    for (const r of out.results) {
      expect(r.pass).toBe(false);
      expect(r.scores).toHaveLength(2);
      expect(r.scores.some((s) => !s.pass)).toBe(true);
    }
  });

  it("filters scenarios by substring/regex filter", async () => {
    const runner: Runner = {
      run: vi.fn(async ({}) => ({ outputText: "x" })),
    };
    const evaluator: Evaluator = {
      evaluate: vi.fn(async () => ({ key: "k", value: 1, pass: true })),
    };

    // Expect only id 'b-2' to run when filter is '/^b-/' or 'b-'
    // (We’ll use regex form to exercise that code path)
    const call = () =>
      runSuite({
        suiteIdOrPath: "toy",
        runner,
        evaluator,
        scenarioFilters: ["/^b-/"],
      } as any);

    const out = await call();

    expect(out.results).toHaveLength(1);
    expect(out.results[0].scenarioId).toBe("b-2");
  });

  it("throws a helpful error when filters match no scenarios", async () => {
    const runner: Runner = {
      run: vi.fn(async ({}) => ({ outputText: "x" })),
    };
    const evaluator: Evaluator = {
      evaluate: vi.fn(async () => ({ key: "k", value: 1, pass: true })),
    };

    await expect(
      runSuite({
        suiteIdOrPath: "toy",
        runner,
        evaluator,
        scenarioFilters: ["nope"],
      } as any)
    ).rejects.toThrow(/No scenarios matched filters: nope/);
  });
});
