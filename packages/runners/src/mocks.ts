import { Runner, Scenario } from '@diffsense/types';

export const mockPass: Runner = { name: 'mock:pass', run: (_p, s) => s.expected };
export const mockFail: Runner = { name: 'mock:fail', run: () => '<wrong>' };
export const mockEcho: Runner = { name: 'mock:echo', run: (p) => String(p).replace(/^Return exactly:\s*/i, '') };
export const mockCodefix: Runner = {
  name: 'mock:codefix',
  run: (prompt, scenario) => {
    if ((scenario as any).kind === 'codefix') {
      return JSON.stringify({
        explanation: 'Replace constant with sum.',
        patch: { find: 'return 3;', replace: 'return a + b;' },
      });
    }
    return String(prompt).replace(/^Return exactly:\s*/i, '');
  },
};
