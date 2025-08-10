import fs from "node:fs/promises";
import path from "node:path";
import type { Scenario } from "@diffsense/core";
import { FORMAT_HINTS } from "./format-hints";

export async function filesSummary(workdir: string, maxBytes = 40_000) {
  const files: string[] = [];
  async function walk(dir: string) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else files.push(p);
    }
  }
  await walk(workdir);

  let out = "";
  for (const f of files) {
    if (out.length >= maxBytes) break;
    const rel = path.relative(workdir, f);
    const head = (await fs.readFile(f, "utf8")).split("\n").slice(0, 80).join("\n");
    out += `\n--- ${rel} ---\n${head}\n`;
  }
  return out.trim();
}

export async function buildRunnerInput(s: Scenario, workdir: string) {
  const summary = s.repoFixture ? await filesSummary(workdir) : undefined;
  const addHint = s.includeFormatHint !== false; // default true

  if (s.evaluationMode === "patch") {
    const prompt = addHint
      ? [s.prompt, "", FORMAT_HINTS.patch].join("\n")
      : s.prompt;
    return { prompt, context: s.inputs, filesSummary: summary };
  }

  // diff mode
  const prompt = addHint && FORMAT_HINTS.diff
    ? [s.prompt, "", FORMAT_HINTS.diff].join("\n")
    : s.prompt;

  return { prompt, context: s.inputs, filesSummary: summary };
}
