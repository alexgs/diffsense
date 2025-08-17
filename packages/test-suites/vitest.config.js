import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage'
    }
  }
});
