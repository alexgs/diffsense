import { Scenario } from '@diffsense/types';

export const toyScenarios: Scenario[] = [
  {
    id: "toy-1",
    prompt: "Return exactly: hello world",
    expected: "hello world",
  },
  {
    id: "toy-2",
    prompt: "Return exactly: 42",
    expected: "0042", // Intentionally wrong to demonstrate failure
  },
];
