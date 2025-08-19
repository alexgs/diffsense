import { loadSuite } from '@diffsense/test-suites';

export async function resolveSuiteForSnapshot(suiteId: string) {
  return await loadSuite(suiteId);
}
