import type { Scenario } from '@diffsense/core';

export const toy: Scenario[] = [
  {
    id: 'toy-1',
    track: 'diff',
    prompt: 'Return 42',
    expected: { output: 42 },
    tags: [ 'toy' ],
  },
];
