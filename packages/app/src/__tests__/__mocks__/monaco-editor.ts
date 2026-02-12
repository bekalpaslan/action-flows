/**
 * Mock for monaco-editor in tests
 * Prevents import resolution errors during test runs
 */

export const editor = {
  create: () => ({}),
  createModel: () => ({}),
  setTheme: () => {},
  defineTheme: () => {},
  setModelLanguage: () => {},
};

export const languages = {
  register: () => {},
  setMonarchTokensProvider: () => {},
  setLanguageConfiguration: () => {},
  registerCompletionItemProvider: () => ({ dispose: () => {} }),
};

export const Uri = {
  parse: (path: string) => ({ path }),
  file: (path: string) => ({ path }),
};

export const Range = class Range {
  constructor(
    public startLineNumber: number,
    public startColumn: number,
    public endLineNumber: number,
    public endColumn: number
  ) {}
};

export const Position = class Position {
  constructor(public lineNumber: number, public column: number) {}
};

export const Selection = class Selection {
  constructor(
    public startLineNumber: number,
    public startColumn: number,
    public endLineNumber: number,
    public endColumn: number
  ) {}
};

export default {
  editor,
  languages,
  Uri,
  Range,
  Position,
  Selection,
};
