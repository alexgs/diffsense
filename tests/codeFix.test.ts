import test from "node:test";
import assert from "node:assert/strict";
import { runSuite } from "../minibench";

test("codefix: mock applies patch and all tests pass", async () => {
  const r = await runSuite({ suite: "codefix-toy", runnerName: "mock:codefix" });
  assert.equal(r.totals.scored, 1);
  assert.equal(r.totals.passed, 1);
  assert.equal(r.results[0].evaluations[0].evaluator, "codefix-patch-applies-and-tests");
});
