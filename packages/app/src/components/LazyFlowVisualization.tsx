/**
 * LazyFlowVisualization - Code-split wrapper for FlowVisualization
 *
 * This component lazy-loads the FlowVisualization component to reduce initial bundle.
 * The flow visualization is only loaded when rendering a session chain DAG.
 *
 * Performance improvement: Defers 300KB of ReactFlow and layout calculation code
 */

import React, { Suspense } from 'react';
import type { FlowVisualizationProps } from './FlowVisualization/FlowVisualization';
import { LoadingSpinner } from './common/LoadingSpinner';

// Lazy load the FlowVisualization component
const FlowVisualizationComponent = React.lazy(() =>
  import('./FlowVisualization/FlowVisualization').then((module) => ({
    default: module.FlowVisualization,
  }))
);

/**
 * LazyFlowVisualization wrapper with Suspense boundary
 */
export const LazyFlowVisualization: React.FC<FlowVisualizationProps> = (props) => {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading flow visualization..." />}>
      <FlowVisualizationComponent {...props} />
    </Suspense>
  );
};

export default LazyFlowVisualization;
