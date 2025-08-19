// ---- Simple resolvers (switch/case) ----
import { Runner } from '@diffsense/types';
import { StubRunner } from '@diffsense/runners';

type RunnerKey = 'stub';

export function resolveRunner(name: string): Runner {
  switch (name) {
    case 'stub':
      return StubRunner;
    default: {
      const available: RunnerKey[] = [ 'stub' ];
      throw new Error(`Unknown runner "${name}". Available: ${available.join(', ')}`);
    }
  }
}
