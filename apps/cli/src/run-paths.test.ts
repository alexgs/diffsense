import { describe, it, expect } from 'vitest';
import { createRunDir, resolveRunsRoot } from './run-paths';
import { utcStamp } from './time';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function tmpRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ds-cli-runs-'));
}

describe('runPaths', () => {
  it('creates a timestamped run directory with slug', async () => {
    const root = await tmpRoot();
    const { runDir } = await createRunDir(root, 'Toy Suite', '20990101T000000Z');
    const stat = await fs.stat(runDir);
    expect(stat.isDirectory()).toBe(true);
    expect(runDir.endsWith('20990101T000000Z_toy-suite')).toBe(true);
  });

  it('utcStamp is lexicographically sortable & well-formed', () => {
    const s = utcStamp();
    expect(s).toMatch(/^\d{8}T\d{6}Z$/);
    expect('20250101T000000Z' < '20250101T000001Z').toBe(true);
  });
});
