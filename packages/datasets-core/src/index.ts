import type { Scenario } from '@diffsense/core';

export const core: Scenario[] = [
  {
    id: 'hello-world',
    evaluationMode: 'diff',
    prompt: 'Return \'hello world\'',
    expected: { output: 'hello world' },
    tags: [ 'smoke' ],
  },
];
