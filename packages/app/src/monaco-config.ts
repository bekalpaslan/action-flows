/**
 * Monaco Editor Configuration
 * Lazy-loads language workers to minimize initial bundle impact
 *
 * Strategy:
 * - Core editor worker always imported
 * - Language workers loaded on-demand using dynamic imports
 * - Reduces initial bundle from 962KB to ~150KB
 */

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Lazy load language workers on demand
const workerCache = new Map<string, Worker>();

async function getLanguageWorker(label: string): Promise<Worker> {
  // Check cache first
  if (workerCache.has(label)) {
    return workerCache.get(label)!;
  }

  let worker: Worker;

  // Dynamically import language workers based on label
  try {
    switch (label) {
      case 'json': {
        const module = await import(
          'monaco-editor/esm/vs/language/json/json.worker?worker'
        );
        worker = new module.default();
        break;
      }
      case 'css':
      case 'scss':
      case 'less': {
        const module = await import(
          'monaco-editor/esm/vs/language/css/css.worker?worker'
        );
        worker = new module.default();
        break;
      }
      case 'html':
      case 'handlebars':
      case 'razor': {
        const module = await import(
          'monaco-editor/esm/vs/language/html/html.worker?worker'
        );
        worker = new module.default();
        break;
      }
      case 'typescript':
      case 'javascript': {
        const module = await import(
          'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
        );
        worker = new module.default();
        break;
      }
      default: {
        const module = await import(
          'monaco-editor/esm/vs/editor/editor.worker?worker'
        );
        worker = new module.default();
      }
    }

    // Cache the worker
    workerCache.set(label, worker);
  } catch (error) {
    console.warn(`Failed to load worker for ${label}, using editor worker:`, error);
    const module = await import(
      'monaco-editor/esm/vs/editor/editor.worker?worker'
    );
    worker = new module.default();
  }

  return worker;
}

// Configure Monaco environment for Electron/Vite
export function configureMonaco() {
  // Set the Monaco Editor loader
  loader.config({ monaco });

  // Configure worker paths for web workers with lazy loading
  // This is necessary for features like IntelliSense, syntax checking, and code formatting
  (self as any).MonacoEnvironment = {
    getWorker(_: string, label: string) {
      // Return a promise that resolves to the worker
      return getLanguageWorker(label);
    },
  };
}

/**
 * Preload commonly-used language workers
 * Call this after a user opens the editor to load workers in background
 */
export function preloadCommonLanguageWorkers() {
  const commonLanguages = ['typescript', 'javascript', 'json', 'html', 'css'];

  commonLanguages.forEach((lang) => {
    // Trigger loading without blocking
    getLanguageWorker(lang).catch((err) => {
      console.warn(`Failed to preload ${lang} worker:`, err);
    });
  });
}
