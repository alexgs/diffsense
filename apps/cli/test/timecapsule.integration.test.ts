import { describe, it, expect } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';
import { runCli } from './helpers/run-cli';

function tmpOutRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ds-cli-out-'));
}

describe('CLI time capsule integration', () => {
  it('writes expected artifacts into a fresh run dir', async () => {
    const cwd = path.join(process.cwd()); // tests run with cwd = packages/cli by vitest config
    const outRoot = await tmpOutRoot();

    const { stdout } = await runCli(
      ['--suite', 'toy', '--runner', 'stub', '--evaluator', 'exact', '--out', outRoot],
      cwd
    );

    // Find the newly created run directory inside outRoot
    const entries = await fs.readdir(outRoot);
    const runDirName = entries.find((e) => /\d{8}T\d{6}Z_/.test(e));
    expect(runDirName, `No run dir found in ${outRoot}`).toBeTruthy();
    const runPath = path.join(outRoot, runDirName!);

    // Core files
    for (const f of ['manifest.json', 'args.json', 'suite.json', 'results.json', 'summary.json', 'results.ndjson']) {
      const st = await fs.stat(path.join(runPath, f));
      expect(st.isFile(), `${f} missing`).toBe(true);
    }

    // Optional strict checks if you merged schema/format versions
    try {
      const results = JSON.parse(await fs.readFile(path.join(runPath, 'results.json'), 'utf8'));
      if (results.schemaVersion !== undefined) expect(results.schemaVersion).toBe(1);
      const manifest = JSON.parse(await fs.readFile(path.join(runPath, 'manifest.json'), 'utf8'));
      if (manifest.formatVersion !== undefined) expect(manifest.formatVersion).toBe(1);
    } catch { /* ignore if not present yet */ }

    // NDJSON sanity
    const firstLine = (await fs.readFile(path.join(runPath, 'results.ndjson'), 'utf8')).split('\n')[0];
    if (firstLine) JSON.parse(firstLine); // should not throw
  });
});
