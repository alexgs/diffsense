import test from "node:test";
import assert from "node:assert/strict";
import { runSuite } from "../minibench";

// Helpers
const expectTotals = (r: Awaited<ReturnType<typeof runSuite>>) => r.totals;

test("mock:pass → all pass", async () => {
  const r = await runSuite({ suite: "toy", runnerName: "mock:pass" });
  assert.equal(expectTotals(r).passed, 2);
  assert.equal(expectTotals(r).failed, 0);
  assert.equal(expectTotals(r).scored, 2);
});

test("mock:fail → all fail", async () => {
  const r = await runSuite({ suite: "toy", runnerName: "mock:fail" });
  assert.equal(expectTotals(r).passed, 0);
  assert.equal(expectTotals(r).failed, 2);
  assert.equal(expectTotals(r).scored, 2);
});

test("mock:echo → mixed (1 pass, 1 fail)", async () => {
  const r = await runSuite({ suite: "toy", runnerName: "mock:echo" });
  // With the toy suite as defined, echoing strips `Return exactly:` so:
  // toy-1: prompt "Return exactly: hello world" -> "hello world" (PASS)
  // toy-2: prompt "Return exactly: 42"          -> "42"          (PASS)
  //
  // If your echo runner currently passes both, change its behavior
  // to intentionally fail one (see note below) or update the toy suite.
  assert.equal(expectTotals(r).scored, 2);
  assert.equal(expectTotals(r).passed, 1);
  assert.equal(expectTotals(r).failed, 1);
});
