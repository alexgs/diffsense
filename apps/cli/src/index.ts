import { runSuite } from "@diffsense/harness";
import { StubRunner } from "@diffsense/runners";
import { exactMatch } from "@diffsense/evaluators";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs(argv: string[]) {
  const args = { suite: "toy", out: "", json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--suite" && argv[i + 1]) args.suite = argv[++i];
    else if (a === "--out" && argv[i + 1]) args.out = argv[++i];
    else if (a === "--json") args.json = true;
  }
  return args;
}

(async () => {
  const { suite, out, json } = parseArgs(process.argv.slice(2));

  const res = await runSuite({
    suiteIdOrPath: suite,
    runner: StubRunner,
    evaluator: exactMatch
  });

  const outJson = JSON.stringify(res, null, 2);

  if (out) {
    const dir = resolve(process.cwd(), out);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "results.json"), outJson, "utf8");
    console.log(`Wrote ${resolve(dir, "results.json")}`);
  }

  if (!out || json) {
    console.log(outJson);
  }

  // Exit code: nonzero if any scenario failed
  process.exit(res.summary.failed > 0 ? 1 : 0);
})().catch(err => {
  console.error(err);
  process.exit(2);
});
