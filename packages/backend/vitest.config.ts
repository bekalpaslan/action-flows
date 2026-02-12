import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [
      '**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  benchmark: {
    include: [
      '**/*.bench.?(c|m)[jt]s?(x)',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
