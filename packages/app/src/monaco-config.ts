/**
 * Monaco Editor Configuration
 * Ensures web workers load correctly for IntelliSense and syntax checking
 */

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Import workers using Vite's ?worker syntax for proper bundling
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco environment for Electron/Vite
export function configureMonaco() {
  // Set the Monaco Editor loader
  loader.config({ monaco });

  // Configure worker paths for web workers
  // This is necessary for features like IntelliSense, syntax checking, and code formatting
  (self as any).MonacoEnvironment = {
    getWorker(_: string, label: string) {
      switch (label) {
        case 'json':
          return new jsonWorker();
        case 'css':
        case 'scss':
        case 'less':
          return new cssWorker();
        case 'html':
        case 'handlebars':
        case 'razor':
          return new htmlWorker();
        case 'typescript':
        case 'javascript':
          return new tsWorker();
        default:
          return new editorWorker();
      }
    },
  };
}
