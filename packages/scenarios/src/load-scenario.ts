import { Scenario } from '@diffsense/types';
import { toyScenarios } from './toy-scenarios';
import { codefixScenarios } from './codefix-scenarios';

export function loadScenario(name: string): Scenario[] {
  if (name === "toy") {
    return toyScenarios;
  }
  if (name === "codefix-toy") {
    return codefixScenarios;
  }

  throw new Error(`Unknown suite: ${name}`);
}

