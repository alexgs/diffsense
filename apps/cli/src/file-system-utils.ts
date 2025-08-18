import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function mkdirp(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function symlinkLatest(latestPath: string, targetRelative: string) {
  try {
    // Remove existing link/file if present
    await fs.rm(latestPath, { force: true, recursive: true });
  } catch { /* ignore */ }
  try {
    await fs.symlink(targetRelative, latestPath, 'dir');
  } catch {
    // Fallback for environments where symlinks are restricted:
    await writeText(latestPath, targetRelative + '\n');
  }
}

export async function writeJson(file: string, data: unknown) {
  await mkdirp(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function writeText(file: string, text: string) {
  await mkdirp(path.dirname(file));
  await fs.writeFile(file, text, 'utf8');
}
