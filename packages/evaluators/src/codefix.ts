import { CodefixScenario, Evaluation, Scenario } from '@diffsense/types';

export const codefixEvaluator = {
  name: "codefix-patch-applies-and-tests",
  evaluate(scenario: Scenario, output: string): Evaluation {
    try {
      const scn = scenario as CodefixScenario;
      if (scn.kind !== "codefix") {
        return { evaluator: this.name, pass: false, score: 0, details: { error: "not-codefix" } };
      }

      const parsed = JSON.parse(output);
      const find = String(parsed?.patch?.find ?? "");
      const replace = String(parsed?.patch?.replace ?? "");

      if (!find || !replace) {
        return { evaluator: this.name, pass: false, score: 0, details: { error: "bad-patch-shape", parsed } };
      }

      // NEW: constraint check (controlled variant)
      const allowed = scn.constraints?.allowedFinds;
      if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(find)) {
        return {
          evaluator: this.name,
          pass: false,
          score: 0,
          details: { error: "find-not-allowed", find, allowed },
        };
      }

      const patched = scn.source.replace(find, replace);
      if (patched === scn.source) {
        return { evaluator: this.name, pass: false, score: 0, details: { error: "find-not-found", find } };
      }

      const getFn = new Function(
        `"use strict"; ${patched}; return typeof ${scn.entry}==='function' ? ${scn.entry} : null;`
      );
      const fn = getFn();
      if (typeof fn !== "function") {
        return { evaluator: this.name, pass: false, score: 0, details: { error: "entry-not-found" } };
      }

      const failures: Array<{ args: any[]; expect: any; got: any }> = [];
      for (const t of scn.tests) {
        const got = fn(...t.args);
        if (got !== t.expect) failures.push({ args: t.args, expect: t.expect, got });
      }

      const pass = failures.length === 0;
      return { evaluator: this.name, pass, score: pass ? 1 : 0, details: pass ? undefined : { failures, patched } };
    } catch (err: any) {
      return { evaluator: this.name, pass: false, score: 0, details: { error: String(err?.message ?? err) } };
    }
  },
};
