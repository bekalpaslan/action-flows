export function createHighlighter() {
  return Promise.resolve({
    codeToHtml: (code: string) => `<pre><code>${code}</code></pre>`,
    getLoadedLanguages: () => [],
    loadLanguage: () => Promise.resolve(),
  });
}
export default { createHighlighter };
