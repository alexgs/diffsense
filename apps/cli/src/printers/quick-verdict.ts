import type { SuiteRunResult, ScenarioRunResult } from '@diffsense/types';
import { green, red, dim, bold, symbols } from '../tty.js';

function padRight(s: string, len: number) {
  return s + ' '.repeat(Math.max(0, len - s.length));
}

export function printQuickVerdict(result: SuiteRunResult) {
  const { suiteId, results, summary } = result;

  // Header
  console.log(bold(`${suiteId}`));

  // Compute width for nice alignment
  const nameWidth = Math.min(
    60,
    results.reduce((m, r) => Math.max(m, r.scenarioId.length), 0)
  );

  // Body lines
  for (const r of results) {
    printScenarioLine(r, nameWidth);
  }

  // Footer summary
  const parts: string[] = [];
  if (summary.passed) parts.push(green(`${summary.passed} passed`));
  if (summary.failed) parts.push(red(`${summary.failed} failed`));
  if (summary.total) parts.push(dim(`${summary.total} total`));

  console.log('');
  console.log(parts.join(dim('  |  ')));
}

function printScenarioLine(r: ScenarioRunResult, nameWidth: number) {
  const left = padRight(`  • ${r.scenarioId}`, nameWidth + 4);

  const verdict = r.pass
    ? green(`${symbols.pass} pass`)
    : red(`${symbols.fail} fail`);

  console.log(`${left}  ${verdict}`);
}
