import fs from "node:fs/promises";
import path from "node:path";
import { execFile as _execFile } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(_execFile);

export async function applyUnifiedDiff(workdir: string, patchText: string) {
  // Init a repo if needed and commit the base state
  await execFile("git", ["init"], { cwd: workdir });
  await execFile("git", ["add", "."], { cwd: workdir });
  await execFile("git", ["commit", "-m", "base"], { cwd: workdir });

  const patchPath = path.join(workdir, "__model.patch");

  try {
    // Write the model's patch to a temp file
    await fs.writeFile(patchPath, patchText, "utf8");

    // Apply it and stage changes
    await execFile("git", ["apply", "--index", "--whitespace=nowarn", patchPath], { cwd: workdir });

    // Commit the applied patch
    await execFile("git", ["commit", "-m", "model"], { cwd: workdir });
  } finally {
    // Clean up the temp patch file (comment this out if you want to keep it for debugging)
    await fs.rm(patchPath, { force: true }).catch(() => {});
  }
}
