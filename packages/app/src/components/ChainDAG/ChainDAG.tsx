/**
 * ChainDAG - Directed Acyclic Graph visualization component
 * Renders a chain as an interactive DAG with React Flow
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  MarkerType,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Chain, StepNumber } from '@afw/shared';
import { StepNode } from './StepNode';
import { layoutNodes, layoutEdges, detectParallelGroups } from './layout';
import { ChainBadge } from '../ChainBadge';
import { StepInspector } from '../StepInspector';
import { detectChainType } from '../../utils/chainTypeDetection';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './ChainDAG.css';

interface ChainDAGProps {
  chain: Chain;
  onStepSelected?: (stepNumber: StepNumber) => void;
  onStepUpdate?: (stepNumber: number, updates: any) => void;
}

const nodeTypes = {
  stepNode: StepNode,
};

export const ChainDAG: React.FC<ChainDAGProps> = ({
  chain,
  onStepSelected,
  onStepUpdate,
}) => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  // Detect chain type for badge display
  const chainMetadata = useMemo(
    () => detectChainType(chain),
    [chain]
  );

  // Compute stats
  const stats = useMemo(() => {
    const total = chain.steps.length;
    const completed = chain.steps.filter(s => s.status === 'completed').length;
    const failed = chain.steps.filter(s => s.status === 'failed').length;
    const inProgress = chain.steps.filter(s => s.status === 'in_progress').length;
    const pending = chain.steps.filter(s => s.status === 'pending').length;
    const skipped = chain.steps.filter(s => s.status === 'skipped').length;

    return { total, completed, failed, inProgress, pending, skipped };
  }, [chain.steps]);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'ChainDAG',
    getContext: () => ({
      chainId: chain.id,
      chainTitle: chain.title,
      stepCount: stats.total,
      status: chain.status,
      parallelGroups: parallelGroups.length,
    }),
  });

  // Compute parallel groups for visual grouping
  const parallelGroups = useMemo(
    () => detectParallelGroups(chain.steps),
    [chain.steps]
  );

  // Create a map for fast parallel group lookup
  const parallelGroupMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const group of parallelGroups) {
      for (const stepNum of group) {
        map.set(Number(stepNum), group.length);
      }
    }
    return map;
  }, [parallelGroups]);

  // Build nodes from chain steps
  const nodes = useMemo<Node[]>(() => {
    const positions = layoutNodes(chain.steps);
    const nodeMap = new Map(positions.map(p => [p.id, p]));

    return chain.steps.map(step => {
      const position = nodeMap.get(`step-${step.stepNumber}`)!;
      const parallelGroupSize = parallelGroupMap.get(Number(step.stepNumber)) || 1;
      const isSelected = selectedStep === Number(step.stepNumber);

      return {
        id: `step-${step.stepNumber}`,
        type: 'stepNode',
        position: { x: position.x, y: position.y },
        data: {
          step,
          isSelected,
          onSelect: (stepNumber: number) => handleStepSelect(stepNumber),
          parallelGroupSize,
        },
      };
    });
  }, [chain.steps, selectedStep, parallelGroupMap]);

  // Build edges from dependencies
  const edges = useMemo<Edge[]>(() => {
    return layoutEdges(chain.steps).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#bdbdbd' },
      style: {
        strokeWidth: 2,
      },
    }));
  }, [chain.steps]);

  // React Flow state
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Update Flow state when computed nodes/edges change
  useEffect(() => {
    setFlowNodes(nodes);
  }, [nodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(edges);
  }, [edges, setFlowEdges]);

  const handleStepSelect = useCallback(
    (stepNumber: number) => {
      setSelectedStep(stepNumber);
      onStepSelected?.(stepNumber as StepNumber);
    },
    [onStepSelected]
  );

  const selectedStepData = useMemo(
    () => chain.steps.find(s => Number(s.stepNumber) === selectedStep),
    [chain.steps, selectedStep]
  );

  return (
    <div className="chain-dag-container">
      <div className="chain-dag-main">
        {/* Header with title, badge, and stats */}
        <div className="chain-dag-header">
          <div className="chain-dag-header-top">
            <h3 className="chain-dag-title">{chain.title}</h3>
            <ChainBadge metadata={chainMetadata} />
            <DiscussButton componentName="ChainDAG" onClick={openDialog} size="small" />
          </div>
          <div className="chain-dag-stats">
            <div className="chain-dag-stat">
              <span className="chain-dag-stat-value">{stats.total}</span>
              <span>total steps</span>
            </div>
            {stats.completed > 0 && (
              <div className="chain-dag-stat" style={{ color: '#4caf50' }}>
                <span className="chain-dag-stat-value">{stats.completed}</span>
                <span>completed</span>
              </div>
            )}
            {stats.inProgress > 0 && (
              <div className="chain-dag-stat" style={{ color: '#fbc02d' }}>
                <span className="chain-dag-stat-value">{stats.inProgress}</span>
                <span>in progress</span>
              </div>
            )}
            {stats.failed > 0 && (
              <div className="chain-dag-stat" style={{ color: '#f44336' }}>
                <span className="chain-dag-stat-value">{stats.failed}</span>
                <span>failed</span>
              </div>
            )}
            <div className="chain-dag-stat" style={{ color: '#666' }}>
              <span className="chain-dag-stat-value">{parallelGroups.length}</span>
              <span>parallel groups</span>
            </div>
          </div>
        </div>

        {/* React Flow canvas */}
        <div className="chain-dag-canvas">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap nodeColor={(node) => {
              const step = (node.data as any).step;
              if (!step) return '#ccc';
              switch (step.status) {
                case 'completed': return '#4caf50';
                case 'failed': return '#f44336';
                case 'in_progress': return '#fbc02d';
                case 'pending': return '#ccc';
                case 'skipped': return '#999';
                default: return '#ccc';
              }
            }} />
          </ReactFlow>
        </div>

        {/* Legend */}
        <div className="chain-dag-legend">
          <div className="legend-item">
            <div className="legend-indicator pending"></div>
            <span>Pending</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator in-progress"></div>
            <span>In Progress</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator completed"></div>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator failed"></div>
            <span>Failed</span>
          </div>
          <div className="legend-item">
            <div className="legend-indicator skipped"></div>
            <span>Skipped</span>
          </div>
        </div>
      </div>

      {/* Step Inspector panel on the right */}
      <StepInspector
        step={selectedStepData || null}
        onClose={() => setSelectedStep(null)}
      />

      {/* DiscussDialog */}
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="ChainDAG"
        componentContext={{
          chainId: chain.id,
          chainTitle: chain.title,
          stepCount: stats.total,
          status: chain.status,
          parallelGroups: parallelGroups.length,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
};

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)}ms`;
  }
  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.round((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
