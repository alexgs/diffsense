// Minimal color helper that respects NO_COLOR and supports basic ANSI colors.
const noColor = !!process.env.NO_COLOR;

const wrap = (code: number) => (s: string) =>
  noColor ? s : `\x1b[${code}m${s}\x1b[0m`;

export const green = wrap(32);
export const red = wrap(31);
export const dim = wrap(2);
export const bold = wrap(1);

// Optional symbols; fall back if terminal can't display them
export const symbols = {
  pass: process.platform === 'win32' ? '√' : '✓',
  fail: process.platform === 'win32' ? '×' : '✗',
};
