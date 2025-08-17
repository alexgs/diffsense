import { Command } from 'commander';
import { runSuite } from '@diffsense/harness';
import type { Runner, Evaluator, RunSuiteOptions } from '@diffsense/types';
import { StubRunner } from '@diffsense/runners';
import { exactMatch } from '@diffsense/evaluators';

// ---- Typed CLI options ----
type RunnerKey = 'stub';
type EvaluatorKey = 'exact';

type CliOptions = {
  suite: string;
  scenario?: string[];
  runner: string;
  evaluator: string;
  out: string;
};

// ---- Simple resolvers (switch/case) ----
function resolveRunner(name: string): Runner {
  switch (name) {
    case 'stub':
      return StubRunner;
    default: {
      const available: RunnerKey[] = ['stub'];
      throw new Error(`Unknown runner "${name}". Available: ${available.join(', ')}`);
    }
  }
}

function resolveEvaluator(name: string): Evaluator {
  switch (name) {
    case 'exact':
      return exactMatch;
    default: {
      const available: EvaluatorKey[] = ['exact'];
      throw new Error(`Unknown evaluator "${name}". Available: ${available.join(', ')}`);
    }
  }
}

// ---- Commander program ----
const program = new Command();

program
  .name('diffsense')
  .description('Run DiffSense suites')
  .option('-s, --suite <idOrPath>', 'Suite ID or filesystem path', 'toy')
  .option('--scenario <filters...>', 'Scenario filters (IDs, substrings, or /regex/).')
  .option('-r, --runner <name>', 'Runner to use', 'stub')
  .option('-e, --evaluator <name>', 'Evaluator to use', 'exact')
  .option('--out <dir>', 'Output directory for artifacts', 'dist-run');

program.action(async (opts: CliOptions) => {
  const runner: Runner = resolveRunner(opts.runner);
  const evaluator: Evaluator = resolveEvaluator(opts.evaluator);

  const runOpts: RunSuiteOptions = {
    suiteIdOrPath: opts.suite,
    runner,
    evaluator,
    scenarioFilters: opts.scenario,
  };

  const result = await runSuite(runOpts);

  console.log(JSON.stringify(result, null, 2));
});

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
