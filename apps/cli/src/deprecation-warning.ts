const seen = new Set<string>();

export function warnOnce(key: string, msg: string) {
  if (process.env.DIFFSENSE_NO_DEPRECATION_WARNINGS) return;
  if (seen.has(key)) return;
  seen.add(key);
  process.stderr.write(`[diffsense][deprecated] ${msg}\\n`);
}
