/**
 * LazyTerminal - Code-split wrapper for TerminalPanel
 *
 * This component lazy-loads the TerminalPanel (xterm.js) to optimize bundle.
 * The terminal is only loaded when the user opens the terminal workbench.
 *
 * Performance improvement: Defers 150KB of xterm and addons
 */

import React, { Suspense } from 'react';
import type { TerminalPanelProps } from './Terminal/TerminalPanel';
import { LoadingSpinner } from './common/LoadingSpinner';

// Lazy load the TerminalPanel component
const TerminalPanelComponent = React.lazy(() =>
  import('./Terminal/TerminalPanel').then((module) => ({
    default: module.TerminalPanel,
  }))
);

/**
 * LazyTerminal wrapper with Suspense boundary
 */
export const LazyTerminal: React.FC<TerminalPanelProps> = (props) => {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading terminal..." />}>
      <TerminalPanelComponent {...props} />
    </Suspense>
  );
};

export default LazyTerminal;
