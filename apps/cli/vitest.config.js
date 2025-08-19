import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    dir: path.resolve(__dirname),
    threads: false,            // friendlier with child_process
    testTimeout: 30000,
    passWithNoTests: false,
  },
});
