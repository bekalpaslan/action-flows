import React from 'react';

export function ShikiHighlighter({ code }: { code: string; language?: string; theme?: string }) {
  return React.createElement('pre', null, React.createElement('code', null, code));
}
export function isInlineCode() { return false; }
export function useShikiHighlighter() { return null; }
