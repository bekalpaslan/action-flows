/**
 * Monaco Worker Mock for Tests
 * Provides minimal mock for Monaco web workers
 *
 * This mock is used for all Monaco worker imports with the ?worker suffix:
 * - monaco-editor/esm/vs/editor/editor.worker?worker
 * - monaco-editor/esm/vs/language/json/json.worker?worker
 * - monaco-editor/esm/vs/language/css/css.worker?worker
 * - monaco-editor/esm/vs/language/html/html.worker?worker
 * - monaco-editor/esm/vs/language/typescript/ts.worker?worker
 */

class MockWorker {
  constructor() {}

  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

// Export as default to match Vite's ?worker import format
export default MockWorker;
