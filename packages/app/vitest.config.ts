import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-electron/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'dist-electron/',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock monaco-editor and workers for tests to avoid import resolution errors
      'monaco-editor': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-editor.ts'),
      'monaco-editor/esm/vs/editor/editor.worker?worker': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-worker.ts'),
      'monaco-editor/esm/vs/language/json/json.worker?worker': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-worker.ts'),
      'monaco-editor/esm/vs/language/css/css.worker?worker': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-worker.ts'),
      'monaco-editor/esm/vs/language/html/html.worker?worker': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-worker.ts'),
      'monaco-editor/esm/vs/language/typescript/ts.worker?worker': path.resolve(__dirname, './src/__tests__/__mocks__/monaco-worker.ts'),
    },
  },
});
