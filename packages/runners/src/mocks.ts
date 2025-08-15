import { LegacyRunner } from '@diffsense/types';

export const mockPass: LegacyRunner = { name: 'mock:pass', run: (_p, s) => s.expected };
export const mockFail: LegacyRunner = { name: 'mock:fail', run: () => '<wrong>' };
export const mockEcho: LegacyRunner = { name: 'mock:echo', run: (p) => String(p).replace(/^Return exactly:\s*/i, '') };
export const mockCodefix: LegacyRunner = {
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
