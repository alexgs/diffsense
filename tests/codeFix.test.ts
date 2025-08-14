import test from "node:test";
import assert from "node:assert/strict";
import { runSuite } from "../minibench";

test("codefix-toy (mock) – unconstrained + constrained both pass", async () => {
  const r = await runSuite({ suite: "codefix-toy", runnerName: "mock:codefix" });
  assert.equal(r.totals.scored, 2);
  assert.equal(r.totals.passed, 2);

  const [uncon, constr] = r.results; // by order in suite
  assert.equal(uncon.scenarioId, "codefix-add-unconstrained");
  assert.equal(constr.scenarioId, "codefix-add-constrained");
  assert.equal(uncon.evaluations[0].pass, true);
  assert.equal(constr.evaluations[0].pass, true);
});

// Optional: real model (skipped when no key)
const hasKey = !!process.env.OPENAI_API_KEY;
void test.skip("codefix-toy (openai) – constrained should be reliable", { skip: !hasKey }, async () => {
  const r = await runSuite({ suite: "codefix-toy", runnerName: "openai:chat" });
  const [uncon, constr] = r.results;
  // Unconstrained may fail due to wrong 'find'; constrained should pass.
  assert.equal(constr.evaluations[0].pass, true);
});
