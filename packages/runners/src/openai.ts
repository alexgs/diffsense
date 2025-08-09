import type { Scenario, RunConfig } from "@diffsense/core";

// wire real API later; keep interface stable
export async function openaiRunner(s: Scenario, _cfg: RunConfig) {
  return { echo: s.prompt };
}
