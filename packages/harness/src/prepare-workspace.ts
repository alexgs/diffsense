import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export async function prepareWorkspace(repoFixture?: string) {
  const root = path.join(os.tmpdir(), "diffsense");
  await fs.mkdir(root, { recursive: true });

  const workdir = path.join(root, crypto.randomUUID());
  await fs.mkdir(workdir, { recursive: true });

  if (repoFixture) {
    // Node >=18: fs.cp supports recursive
    // @ts-ignore
    await fs.cp(repoFixture, workdir, { recursive: true });
  }
  return workdir;
}
