import type { Scenario } from '@diffsense/core';

const core: Scenario[] = [
  {
    id: 'hello-world',
    track: 'diff',
    prompt: 'Return \'hello world\'',
    expected: { output: 'hello world' },
    tags: [ 'smoke' ],
  },
];
