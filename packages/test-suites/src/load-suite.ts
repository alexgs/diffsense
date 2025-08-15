import { LegacyScenario } from '@diffsense/types';
import { toySuite1 } from './toy-suite-1';
import { codefixSuite } from './codefix-suite';

export function loadSuite(name: string): LegacyScenario[] {
  if (name === "toy") {
    return toySuite1;
  }
  if (name === "codefix-toy") {
    return codefixSuite;
  }

  throw new Error(`Unknown suite: ${name}`);
}
