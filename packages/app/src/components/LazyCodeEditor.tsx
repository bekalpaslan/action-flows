/**
 * LazyCodeEditor - Code-split wrapper for EditorTool
 *
 * This component lazy-loads the EditorTool (Monaco Editor) to optimize initial load.
 * The code editor is only loaded when the user opens the editor workbench.
 *
 * Performance improvement: Defers 962KB of Monaco Editor core and language workers
 */

import React, { Suspense } from 'react';
import type { EditorToolProps } from './Tools/EditorTool/EditorTool';
import { LoadingSpinner } from './common/LoadingSpinner';

// Lazy load the EditorTool component
const EditorToolComponent = React.lazy(() =>
  import('./Tools/EditorTool/EditorTool').then((module) => ({
    default: module.EditorTool,
  }))
);

/**
 * LazyCodeEditor wrapper with Suspense boundary
 */
export const LazyCodeEditor: React.FC<EditorToolProps> = (props) => {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading code editor..." />}>
      <EditorToolComponent {...props} />
    </Suspense>
  );
};

export default LazyCodeEditor;
