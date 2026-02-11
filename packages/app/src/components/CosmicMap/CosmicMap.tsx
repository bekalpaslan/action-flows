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
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { RegionNode, LightBridge } from '@afw/shared';
import { useUniverseContext } from '../../contexts/UniverseContext';
import { CosmicBackground } from './CosmicBackground';
import { RegionStar, type RegionStarData } from './RegionStar';
import { LightBridgeEdge, type LightBridgeData } from './LightBridgeEdge';
import { CommandCenter } from './CommandCenter';
import { BigBangAnimation } from './BigBangAnimation';
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
 * CosmicMapInner - Inner component with ReactFlow hooks
 */
function CosmicMapInner() {
  const { universe, isLoading, error, zoomTargetRegionId, clearZoomTarget } = useUniverseContext();
  const { fitView, setCenter } = useReactFlow();
  const [hasInitialFit, setHasInitialFit] = useState(false);
  const [showBigBang, setShowBigBang] = useState(false);

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

  // Handle zoom to region
  useEffect(() => {
    if (zoomTargetRegionId) {
      const targetNode = nodes.find((n) => n.id === zoomTargetRegionId);
      if (targetNode) {
        setCenter(targetNode.position.x, targetNode.position.y, {
          zoom: 1.5,
          duration: 800,
        });
      }
      clearZoomTarget();
    }
  }, [zoomTargetRegionId, nodes, setCenter, clearZoomTarget]);

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

  // Handle command from CommandCenter
  const handleCommand = useCallback((command: string) => {
    console.log('[CosmicMap] Command received:', command);
    // TODO: Integrate with orchestrator backend
    // For now, just log the command
  }, []);

  if (isLoading) {
    return (
      <div className="cosmic-map cosmic-map--loading">
        <div className="cosmic-map__loading-message">
          <div className="cosmic-map__spinner" />
          <p>Initializing universe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cosmic-map cosmic-map--error">
        <div className="cosmic-map__error-message">
          <p>Failed to load universe</p>
          <p className="cosmic-map__error-detail">{error}</p>
        </div>
      </div>
    );
  }

  if (!universe || nodes.length === 0) {
    return (
      <div className="cosmic-map cosmic-map--empty">
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

  return (
    <div className="cosmic-map">
      {/* Cosmic background */}
      <CosmicBackground
        width={window.innerWidth}
        height={window.innerHeight}
        seed={universe.metadata.createdAt}
        enableAnimation={true}
      />

      {/* ReactFlow visualization */}
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
      >
        <Controls className="cosmic-map__controls" />
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
      </ReactFlow>

      {/* Return to god view button */}
      <button
        className="cosmic-map__god-view-button"
        onClick={handleReturnToGodView}
        title="Return to full universe view (Esc)"
      >
        🌌 God View
      </button>

      {/* Command Center bottom bar */}
      <CommandCenter
        onCommand={handleCommand}
        showHealthStatus={true}
      />
    </div>
  );
}

/**
 * CosmicMap - Main component with ReactFlowProvider
 */
export function CosmicMap() {
  return (
    <ReactFlowProvider>
      <CosmicMapInner />
    </ReactFlowProvider>
  );
}
