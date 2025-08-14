// ---------- CLI (no deps) ----------
function parseArg(flag: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return fallback;
}

async function main() {
  const suite = parseArg("--suite", "toy");
  const runner = parseArg("--runner", "mock:echo");
  const out = parseArg("--out");

  if (!suite || !runner) {
    console.error("Usage: tsx minibench.ts --suite toy --runner mock:echo [--out results.json]");
    process.exit(2);
  }

  try {
    const result = await runSuite({ suite, runnerName: runner });
    const json = JSON.stringify(result, null, 2);
    if (out) {
      const fs = await import("node:fs/promises");
      await fs.writeFile(out, json, "utf8");
      console.log(`Wrote ${out}`);
    } else {
      console.log(json);
    }
  } catch (err: any) {
    console.error("Error:", err?.message ?? err);
    process.exit(1);
  }
}

if (require.main === module) {
  void main();
}
