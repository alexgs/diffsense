import path from 'node:path';
import { mkdirp } from './file-system-utils.js';
import { utcStamp } from './time.js';

export function resolveRunsRoot(outFromCli?: string) {
  // default to repo-level 'runs' if not provided
  return outFromCli ? path.resolve(outFromCli) : path.resolve(process.cwd(), 'runs');
}

export async function createRunDir(runsRoot: string, suiteName: string, stamp = utcStamp()) {
  const dirName = `${stamp}_${slugify(suiteName)}`;
  const runDir = path.join(runsRoot, dirName);
  await mkdirp(runDir);
  return { runDir, dirName };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
