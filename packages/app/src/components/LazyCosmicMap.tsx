/**
 * LazyCosmicMap - Code-split wrapper for CosmicMap
 *
 * This component lazy-loads the CosmicMap visualization to improve initial bundle size.
 * The CosmicMap is only loaded when the user navigates to the universe view.
 *
 * Performance improvement: Defers 500KB of ReactFlow visualization code
 */

import React, { Suspense } from 'react';
import type { CosmicMapProps } from './CosmicMap/CosmicMap';
import { LoadingSpinner } from './common/LoadingSpinner';

// Lazy load the CosmicMap component - deferred until accessed
const CosmicMapComponent = React.lazy(() =>
  import('./CosmicMap/CosmicMap').then((module) => ({
    default: module.CosmicMap,
  }))
);

/**
 * LazyCosmicMap wrapper with Suspense boundary
 */
export const LazyCosmicMap: React.FC<CosmicMapProps> = (props) => {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading universe visualization..." />}>
      <CosmicMapComponent {...props} />
    </Suspense>
  );
};

export default LazyCosmicMap;
