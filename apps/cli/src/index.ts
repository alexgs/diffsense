import { Command } from "commander";
import { runScenario, summarize } from "@diffsense/harness";
import { exactMatch } from "@diffsense/evaluators";
import { openaiRunner } from "@diffsense/runners";
import { toy } from "@diffsense/datasets-toy";
import { core } from "@diffsense/datasets-core";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";
import type { RunManifest, ScenarioMetric } from "@diffsense/core";

const program = new Command();
program
  .name("diffsense")
  .description("Run DiffSense scenarios")
  .option("--suite <name>", "suite id", "toy")
  .option("--runner <id>", "runner id", "openai:gpt-4o-mini")
  .option("--out <dir>", "output dir", "dist-run")
  .action(async (opts) => {
    const runId = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 12);
    const scenarios = opts.suite === "core" ? core : toy;
    const results: ScenarioMetric[] = [];
    for (const s of scenarios) {
      const r = await runScenario(s, { runner: opts.runner }, openaiRunner, [exactMatch]);
      results.push(r);
      console.log(`${s.id}: ${r.ok ? "PASS" : "FAIL"}`);
    }
    const agg = summarize(runId, results);

    const outDir = join(process.cwd(), opts.out, runId);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "metrics.json"), JSON.stringify(agg, null, 2));
    const per = results.map(r => ({ ...r }));
    await writeFile(join(outDir, "scenarios.json"), JSON.stringify(per, null, 2));

    const manifest: RunManifest = {
      schemaVersion: "1.0",
      runId,
      createdAt: new Date().toISOString(),
      suite: opts.suite,
      publicGitRef: process.env.GIT_SHA || "unknown",
      runners: [{ id: opts.runner }],
      artifacts: await hashList([
        join(outDir, "metrics.json"),
        join(outDir, "scenarios.json")
      ])
    };
    await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`\nDone: ${outDir}`);
  });

program.parseAsync();

async function hashList(paths: string[]) {
  const { readFile } = await import("node:fs/promises");
  const entries = [];
  for (const p of paths) {
    const buf = await readFile(p);
    const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
    entries.push({ path: p.split("/").slice(-2).join("/"), sha256, bytes: buf.length });
  }
  return entries;
}
