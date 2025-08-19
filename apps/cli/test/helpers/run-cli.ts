import { execFile } from 'node:child_process';
import path from 'node:path';
import { promises as fs } from 'node:fs';

export async function runCli(args: string[], cwd: string) {
  // Prefer tsx (no build). Fallback to built dist if not present.
  const tsxPath = path.join(cwd, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  const useTsx = await fs
    .access(tsxPath)
    .then(() => true)
    .catch(() => false);

  const cmd = useTsx ? tsxPath : process.execPath;
  const cliArgs = useTsx ? ['src/index.ts', ...args] : ['dist/index.js', ...args];

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(cmd, cliArgs, { cwd }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout, stderr });
    });
  });
}
