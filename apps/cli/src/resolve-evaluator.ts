import { Evaluator } from '@diffsense/types';
import { exactMatch } from '@diffsense/evaluators';

type EvaluatorKey = 'exact';

export function resolveEvaluator(name: string): Evaluator {
  switch (name) {
    case 'exact':
      return exactMatch;
    default: {
      const available: EvaluatorKey[] = ['exact'];
      throw new Error(`Unknown evaluator "${name}". Available: ${available.join(', ')}`);
    }
  }
}
