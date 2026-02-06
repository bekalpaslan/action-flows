/**
 * Monaco Editor Configuration
 * Ensures web workers load correctly for IntelliSense and syntax checking
 */

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure Monaco environment for Electron/Vite
export function configureMonaco() {
  // Set the Monaco Editor loader
  loader.config({ monaco });

  // Configure worker paths for web workers
  // This is necessary for features like IntelliSense, syntax checking, and code formatting
  (self as any).MonacoEnvironment = {
    getWorker(_: string, label: string) {
      // Use dynamic imports to load workers
      switch (label) {
        case 'json':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
            { type: 'module' }
          );
        case 'css':
        case 'scss':
        case 'less':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url),
            { type: 'module' }
          );
        case 'html':
        case 'handlebars':
        case 'razor':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url),
            { type: 'module' }
          );
        case 'typescript':
        case 'javascript':
          return new Worker(
            new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url),
            { type: 'module' }
          );
        default:
          return new Worker(
            new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url),
            { type: 'module' }
          );
      }
    },
  };
}
