/**
 * CosmicMap - Living Universe visualization
 *
 * Main ReactFlow container that transforms UniverseGraph into a navigable
 * cosmic map with region stars and light bridges.
 */

import { useEffect, useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  ReactFlowProvider,
  getSmoothStepPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { RegionNode, LightBridge, ChainId, SparkTravelingEvent } from '@afw/shared';
import { eventGuards } from '@afw/shared';
import { useUniverseContext } from '../../contexts/UniverseContext';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useFeatureFlagSimple } from '../../hooks/useFeatureFlag';
import { CosmicBackground } from './CosmicBackground';
import { RegionStar, type RegionStarData } from './RegionStar';
import { LightBridgeEdge, type LightBridgeData } from './LightBridgeEdge';

import { BigBangAnimation } from './BigBangAnimation';
import { SparkAnimation } from './SparkAnimation';
import { LiveRegion } from './LiveRegion';
import { UniverseOnboarding } from '../Onboarding/UniverseOnboarding';
import { useWebVitals } from '../../hooks/useWebVitals';
import { useRenderTiming } from '../../utils/performance';
import '../../styles/cosmic-tokens.css';
import './CosmicMap.css';

// Register custom node and edge types
const nodeTypes: NodeTypes = {
  regionStar: RegionStar,
};

const edgeTypes: EdgeTypes = {
  lightBridge: LightBridgeEdge,
};

/**
 * Spark state for tracking active sparks
 */
interface SparkState {
  fromRegion: string;
  toRegion: string;
  progress: number;
  edgePath: string;
}

export interface CosmicMapProps {
  /** Whether cosmic map should be visible (opacity 1) */
  visible?: boolean;
  /** Whether cosmic map is in zooming transition (triggers fade-out) */
  zooming?: boolean;
}

/**
 * CosmicMapInner - Inner component with ReactFlow hooks
 */
function CosmicMapInner({ visible = true, zooming = false }: CosmicMapProps) {
  const { universe, isLoading, error, zoomTargetRegionId, clearZoomTarget } = useUniverseContext();
  const { fitView, setCenter } = useReactFlow();
  const wsContext = useWebSocketContext();
  const [hasInitialFit, setHasInitialFit] = useState(false);
  const [showBigBang, setShowBigBang] = useState(false);
  const [activeSparks, setActiveSparks] = useState<Map<ChainId, SparkState>>(new Map());

  // Feature flags
  const sparkAnimationEnabled = useFeatureFlagSimple('SPARK_ANIMATION_ENABLED');

  // Performance monitoring
  useWebVitals(); // Captured globally for Settings → Performance
  useRenderTiming('CosmicMap');

  // Transform RegionNode[] → ReactFlow Node[]
  const initialNodes = useMemo(() => {
    if (!universe) return [];

    return universe.regions.map((region: RegionNode): Node<RegionStarData> => ({
      id: region.id,
      type: 'regionStar',
      position: region.position,
      data: {
        regionId: region.id,
        workbenchId: region.workbenchId,
        label: region.label,
        layer: region.layer,
        fogState: region.fogState,
        glowIntensity: region.glowIntensity,
        status: region.status,
        colorShift: region.colorShift,
        health: region.health,
      },
    }));
  }, [universe]);

  // Transform LightBridge[] → ReactFlow Edge[]
  const initialEdges = useMemo(() => {
    if (!universe) return [];

    return universe.bridges.map((bridge: LightBridge): Edge<LightBridgeData> => ({
      id: bridge.id,
      source: bridge.source,
      target: bridge.target,
      type: 'lightBridge',
      data: {
        edgeId: bridge.id,
        gates: bridge.gates,
        strength: bridge.strength,
        activeSparkChainId: bridge.activeSparkChainId,
        traversalCount: bridge.traversalCount,
        bridge: bridge, // Pass full bridge data for trace rendering
      },
    }));
  }, [universe]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Check localStorage for Big Bang animation on mount
  useEffect(() => {
    try {
      const bigBangSeen = localStorage.getItem('afw-big-bang-seen');
      if (!bigBangSeen || bigBangSeen !== 'true') {
        setShowBigBang(true);
      }
    } catch (e) {
      // localStorage unavailable (private mode, Electron), skip Big Bang
      console.warn('[CosmicMap] localStorage unavailable, skipping Big Bang check');
    }
  }, []);

  // Update nodes/edges when universe changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Initial fit view on mount
  useEffect(() => {
    if (!hasInitialFit && nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
        setHasInitialFit(true);
      }, 100);
    }
  }, [hasInitialFit, nodes.length, fitView]);

  // Handle zoom to region animation
  useEffect(() => {
    if (zoomTargetRegionId) {
      const targetNode = nodes.find((n) => n.id === zoomTargetRegionId);
      if (targetNode) {
        // Start zoom animation (0-300ms)
        setCenter(targetNode.position.x, targetNode.position.y, {
          zoom: 1.5,
          duration: 300,
        });

        // Complete animation at 400ms (fade handled by CSS via `zooming` prop)
        const timerId = setTimeout(() => {
          clearZoomTarget();
        }, 400);

        // Cleanup: prevent clearZoomTarget on unmounted component
        return () => clearTimeout(timerId);
      }
    }
  }, [zoomTargetRegionId, nodes, setCenter, clearZoomTarget]);

  // Subscribe to spark traveling events
  useEffect(() => {
    if (!wsContext.onEvent || !sparkAnimationEnabled) return;

    const unsubscribe = wsContext.onEvent((event) => {
      if (eventGuards.isSparkTraveling(event)) {
        const sparkEvent = event as SparkTravelingEvent;

        // Find the edge between fromRegion and toRegion
        const edge = edges.find(
          (e) => e.source === sparkEvent.fromRegion && e.target === sparkEvent.toRegion
        );

        if (!edge) {
          console.warn(
            `[CosmicMap] No edge found for spark: ${sparkEvent.fromRegion} → ${sparkEvent.toRegion}`
          );
          return;
        }

        // Find source and target node positions
        const sourceNode = nodes.find((n) => n.id === sparkEvent.fromRegion);
        const targetNode = nodes.find((n) => n.id === sparkEvent.toRegion);

        if (!sourceNode || !targetNode) {
          console.warn(
            `[CosmicMap] Source or target node not found for spark: ${sparkEvent.fromRegion} → ${sparkEvent.toRegion}`
          );
          return;
        }

        // Compute edge path using ReactFlow's getSmoothStepPath
        const [edgePath] = getSmoothStepPath({
          sourceX: sourceNode.position.x,
          sourceY: sourceNode.position.y,
          sourcePosition: 'right',
          targetX: targetNode.position.x,
          targetY: targetNode.position.y,
          targetPosition: 'left',
        });

        // Update active sparks state
        setActiveSparks((prev) => {
          const next = new Map(prev);

          // Enforce max 5 concurrent sparks
          if (next.size >= 5 && !next.has(sparkEvent.chainId)) {
            // Remove oldest spark (first entry)
            const firstKey = next.keys().next().value;
            if (firstKey) {
              next.delete(firstKey);
            }
          }

          next.set(sparkEvent.chainId, {
            fromRegion: sparkEvent.fromRegion,
            toRegion: sparkEvent.toRegion,
            progress: sparkEvent.progress,
            edgePath,
          });

          return next;
        });
      }
    });

    return unsubscribe;
  }, [wsContext, edges, nodes, sparkAnimationEnabled]);

  // Cleanup completed sparks
  const handleSparkComplete = useCallback((chainId: ChainId) => {
    setActiveSparks((prev) => {
      const next = new Map(prev);
      next.delete(chainId);
      return next;
    });
  }, []);

  // Handle escape key to return to god view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fitView({ padding: 0.2, duration: 800 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fitView]);

  // Return to god view button handler
  const handleReturnToGodView = useCallback(() => {
    fitView({ padding: 0.2, duration: 800 });
  }, [fitView]);

  if (isLoading) {
    return (
      <div className="cosmic-map cosmic-map--loading" data-testid="cosmic-map-loading">
        <div className="cosmic-map__loading-message">
          <div className="cosmic-map__spinner" />
          <p>Initializing universe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cosmic-map cosmic-map--error" data-testid="cosmic-map-error">
        <div className="cosmic-map__error-message">
          <p>Failed to load universe</p>
          <p className="cosmic-map__error-detail">{error}</p>
        </div>
      </div>
    );
  }

  if (!universe || nodes.length === 0) {
    return (
      <div className="cosmic-map cosmic-map--empty" data-testid="cosmic-map-empty">
        <div className="cosmic-map__empty-message">
          <p>No universe data available</p>
        </div>
      </div>
    );
  }

  // Show Big Bang animation on first load
  if (showBigBang) {
    return (
      <>
        <CosmicBackground
          width={window.innerWidth}
          height={window.innerHeight}
          seed={universe.metadata.createdAt}
          enableAnimation={true}
        />
        <BigBangAnimation
          onComplete={() => {
            try {
              localStorage.setItem('afw-big-bang-seen', 'true');
            } catch (e) {
              console.warn('[CosmicMap] localStorage unavailable, cannot persist Big Bang state');
            }
            setShowBigBang(false);
          }}
        />
      </>
    );
  }

  // Compute CSS classes for fade states
  const cosmicMapClass = [
    'cosmic-map',
    !visible && 'cosmic-map--hidden',
    zooming && 'cosmic-map--zooming',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cosmicMapClass}
      data-testid="cosmic-map"
      role="region"
      aria-label="Living universe map"
    >
      {/* Cosmic background */}
      <CosmicBackground
        width={window.innerWidth}
        height={window.innerHeight}
        seed={universe.metadata.createdAt}
        enableAnimation={true}
      />

      {/* Screen reader announcements for region discoveries */}
      <LiveRegion />

      {/* ReactFlow visualization */}
      <div className="universe-canvas" data-testid="universe-canvas">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={false}
        minZoom={0.3}
        maxZoom={2.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        className="cosmic-map__flow"
        proOptions={{ hideAttribution: true }}
        aria-label="Living Universe cosmic map - navigable visualization of workbench regions"
        role="application"
      >
        <Controls
          className="cosmic-map__controls"
          data-testid="zoom-controls"
          aria-label="Map zoom controls"
          title="Zoom in, zoom out, and fit view controls"
        />
        <MiniMap
          className="cosmic-map__minimap"
          nodeColor={(node) => {
            const data = node.data as RegionStarData;
            switch (data.layer) {
              case 'platform':
                return '#ff6b6b';
              case 'template':
                return '#ffd93d';
              case 'philosophy':
                return '#6bcb77';
              case 'physics':
                return '#4d96ff';
              case 'experience':
                return '#9b59b6';
              default:
                return '#98989d';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />

        {/* Spark animations layer (rendered as SVG overlay) */}
        {sparkAnimationEnabled && (
          <svg
            className="cosmic-map__spark-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          >
            {Array.from(activeSparks.entries()).map(([chainId, spark]) => (
              <SparkAnimation
                key={chainId}
                chainId={chainId}
                fromRegion={spark.fromRegion}
                toRegion={spark.toRegion}
                progress={spark.progress}
                edgePath={spark.edgePath}
                onComplete={() => handleSparkComplete(chainId)}
              />
            ))}
          </svg>
        )}
      </ReactFlow>
      </div>

      {/* Return to god view button */}
      <div className="navigation-overlay" data-testid="navigation-overlay">
      <button
        className="cosmic-map__god-view-button"
        data-testid="god-view-button"
        onClick={handleReturnToGodView}
        title="Return to full universe view (Esc)"
      >
        🌌 God View
      </button>

      </div>

      {/* Onboarding tooltip sequence */}
      <UniverseOnboarding />
    </div>
  );
}

/**
 * CosmicMap - Main component with ReactFlowProvider
 */
export function CosmicMap({ visible, zooming }: CosmicMapProps = {}) {
  return (
    <ReactFlowProvider>
      <CosmicMapInner visible={visible} zooming={zooming} />
    </ReactFlowProvider>
  );
}
