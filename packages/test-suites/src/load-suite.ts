import { Scenario } from '@diffsense/types';
import { toySuite } from './toy-suite';
import { codefixSuite } from './codefix-suite';

export function loadSuite(name: string): Scenario[] {
  if (name === "toy") {
    return toySuite;
  }
  if (name === "codefix-toy") {
    return codefixSuite;
  }

  throw new Error(`Unknown suite: ${name}`);
}
