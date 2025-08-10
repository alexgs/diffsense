import type { Scenario } from "@diffsense/core";

// Convention: each dataset package exports named arrays of Scenario[]
export async function loadSuite(name: string): Promise<Scenario[]> {
  // Example: suiteName = "datasets-toy/toy-add-bug"
  const mod = await import(`@diffsense/${name}`);
  return (mod.default ?? Object.values(mod).flat()) as Scenario[];
}
