#!/usr/bin/env node
import { Command } from 'commander';
import { runSuite } from '@diffsense/harness';
import type { RunSuiteOptions, SuiteRunResult } from '@diffsense/types';
import { resolveRunner } from './resolve-runner.js';
import { resolveEvaluator } from './resolve-evaluator.js';
import { resolveSuiteForSnapshot } from './resolve-suite.js';
import { resolveRunsRoot, createRunDir } from './run-paths.js';
import { writeJson, writeText, symlinkLatest } from './file-system-utils.js';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';

type CliOptions = {
  suite: string;
  scenario?: string[];
  runner: string;
  evaluator: string;
  out?: string;
};

function sha256(data: string | Buffer) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function main() {
  const program = new Command();
  program
    .name('diffsense')
    .description('Run DiffSense suites')
    .option('-s, --suite <idOrPath>', 'Suite ID or filesystem path', 'toy')
    .option('--scenario <filters...>', 'Scenario filters (IDs, substrings, or /regex/).')
    .option('-r, --runner <name>', 'Runner to use', 'stub')
    .option('-e, --evaluator <name>', 'Evaluator to use', 'exact')
    .option('--out <dir>', 'Output directory for artifacts', 'runs');

  program.parse();
  const opts = program.opts<CliOptions>();

  // Resolve components (your existing logic)
  const evaluator = resolveEvaluator(opts.evaluator);
  const runner = resolveRunner(opts.runner);
  const suiteForSnapshot = await resolveSuiteForSnapshot(opts.suite);

  // Prepare the time capsule directory
  const runsRoot = resolveRunsRoot(opts.out);
  const { runDir, dirName } = await createRunDir(runsRoot, opts.suite);

  // Persist inputs (args + resolved configs)
  await writeJson(path.join(runDir, 'args.json'), opts);
  await writeJson(path.join(runDir, 'suite.json'), suiteForSnapshot);
  await writeJson(path.join(runDir, 'config.json'), {
    runner: opts.runner,
    evaluator: opts.evaluator,
  });

  // Optionally capture stdout in a parallel log file. For now, we’ll just mirror key milestones.
  await writeText(path.join(runDir, 'stdout.log'), 'Run started\n');

  // Execute
  const runOptions: RunSuiteOptions = {
    suiteIdOrPath: opts.suite,
    runner,
    evaluator,
    scenarioFilters: opts.scenario,
  };
  const result: SuiteRunResult = await runSuite(runOptions);

  // Persist outputs aligned to SuiteRunResult
  await writeJson(path.join(runDir, 'results.json'), result);
  await writeJson(path.join(runDir, 'summary.json'), result.summary);

  // Optionally also emit line-delimited JSON for streaming-friendly tooling later
  if (Array.isArray(result.results)) {
    const nd = result.results.map((r) => JSON.stringify(r)).join('\n') + '\n';
    await writeText(path.join(runDir, 'results.ndjson'), nd);
  }

  if (result.metadata && Object.keys(result.metadata).length > 0) {
    await writeJson(path.join(runDir, 'metadata.json'), result.metadata);
  }

  // Manifest for quick scanning / reproducibility
  const manifest = {
    id: dirName,
    createdAt: new Date().toISOString(),
    suite: {
      requestedId: opts.suite,
      actualId: result.suiteId,            // in case the loader normalized/aliased
    },
    counts: {
      scenarios: result.results?.length ?? 0,
    },
    runner: opts.runner,
    evaluator: opts.evaluator,
    versions: await collectVersions(),
    integrity: {
      suiteJsonSha256: sha256(JSON.stringify(suiteForSnapshot)),  // from earlier snapshot
      resultsJsonSha256: sha256(JSON.stringify(result)),
      summaryJsonSha256: sha256(JSON.stringify(result.summary)),
      resultsNdjsonSha256: (Array.isArray(result.results)
        ? sha256(result.results.map((r) => JSON.stringify(r)).join('\n') + '\n')
        : null),
    },
  };
  await writeJson(path.join(runDir, 'manifest.json'), manifest);

  // Update 'latest'
  const latestPath = path.join(runsRoot, 'latest');
  await symlinkLatest(latestPath, dirName);

  // Mirror a simple completion line to stdout and log
  const doneLine = `Saved time capsule: ${path.relative(process.cwd(), runDir)}\n`;
  process.stdout.write(doneLine);
  await writeText(path.join(runDir, 'stdout.log'), 'Run finished\n' + doneLine);
}

const req = typeof require === 'function' ? require : createRequire(import.meta.url);

async function readNearestPackageJson(startFile: string) {
  let dir = path.dirname(startFile);
  for (let i = 0; i < 10; i++) {
    const pj = path.join(dir, 'package.json');
    try {
      const txt = await fs.readFile(pj, 'utf8');
      return { json: JSON.parse(txt), path: pj };
    } catch { /* keep walking */ }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

async function getPackageVersion(pkgName: string): Promise<string | null> {
  try {
    // Resolve the package’s entrypoint (respects exports)
    const entry = req.resolve(pkgName);
    const pkg = await readNearestPackageJson(entry);
    if (pkg?.json?.name === pkgName && typeof pkg.json.version === 'string') {
      return pkg.json.version;
    }
  } catch { /* fall through */ }
  return null;
}

export async function collectVersions() {
  const names = [
    '@diffsense/cli',
    '@diffsense/harness',
    '@diffsense/runners',
    '@diffsense/evaluators',
    '@diffsense/types',
  ] as const;

  const entries = await Promise.all(names.map(async (n) => [n, await getPackageVersion(n)] as const));
  return Object.fromEntries([
    ['node', process.version],
    ...entries,
  ]) as Record<string, string | null>;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
