import path from "node:path";
import { pathToFileURL } from "node:url";

type Case = { a: number; b: number; out: number };

export async function evalCasesPass(workdir: string, inputs?: Record<string, unknown>) {
  const cases = (inputs?.cases as Case[]) ?? [];
  const modUrl = pathToFileURL(path.join(workdir, "src/add.ts")).href;
  const mod = await import(modUrl);
  const add = mod.add as (a: number, b: number) => number;

  const results = cases.map(c => {
    const got = add(c.a, c.b);
    return { ...c, got, ok: got === c.out };
  });

  return { passed: results.every(r => r.ok), details: { results } };
}
