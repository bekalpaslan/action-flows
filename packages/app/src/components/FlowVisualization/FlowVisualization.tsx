/**
 * FlowVisualization - ReactFlow container with swimlane layout
 * Main visualization component for session window flow graphs
 */

import { useEffect, useMemo, useState } from 'react';
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
  Panel,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Chain } from '@afw/shared';
import { AnimatedStepNode } from './AnimatedStepNode';
import { AnimatedFlowEdge } from './AnimatedFlowEdge';
import { FlowchartNode } from './FlowchartNode';
import { FlowchartEdge } from './FlowchartEdge';
import { SwimlaneBackground } from './SwimlaneBackground';
import type { FlowchartShape } from './FlowchartNode';
import {
  assignSwimlanes,
  calculateNodePositions,
  calculateSwimlaneEdges,
  getSwimlaneNames,
} from '../../utils/swimlaneLayout';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './FlowVisualization.css';

export interface FlowVisualizationProps {
  chain: Chain;
  onStepClick?: (stepNumber: number) => void;
  enableAnimations?: boolean;
}

const nodeTypes = {
  animatedStep: AnimatedStepNode,
  flowchartNode: FlowchartNode,
};

const edgeTypes = {
  animatedEdge: AnimatedFlowEdge,
  flowchartEdge: FlowchartEdge,
};

/** Infer flowchart shape from action string and step position */
function inferShape(action: string, stepIndex: number, totalSteps: number, isGate: boolean): FlowchartShape {
  // First/last steps → start/end pill
  if (stepIndex === 0 || stepIndex === totalSteps - 1) return 'start-end';
  // Human gates / awaiting input → decision diamond
  if (isGate || action.startsWith('gate/')) return 'decision';
  // Analysis and planning → input parallelogram
  if (action.startsWith('analyze/') || action.startsWith('plan/')) return 'input';
  // Commits, docs, registry → data cylinder
  if (action.startsWith('commit/') || action.startsWith('docs/') || action === 'registry-update') return 'data';
  // Code, review, test → process rectangle (default)
  return 'process';
}

export const FlowVisualization: React.FC<FlowVisualizationProps> = ({
  chain,
  onStepClick,
  enableAnimations = true,
}) => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const { fitView } = useReactFlow();

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'FlowVisualization',
    getContext: () => ({
      chainId: chain.id,
      chainTitle: chain.title,
      stepCount: chain.steps.length,
      selectedStep,
    }),
  });

  // Compute swimlane assignments
  const swimlaneAssignments = useMemo(
    () => assignSwimlanes(chain),
    [chain]
  );

  // Get unique swimlane names for background
  const swimlaneNames = useMemo(
    () => getSwimlaneNames(chain),
    [chain]
  );

  // Build nodes from chain steps
  const nodes = useMemo<Node[]>(() => {
    const positions = calculateNodePositions(chain.steps, swimlaneAssignments);
    const positionMap = new Map(positions.map(p => [p.id, p]));

    return chain.steps.map((step, index) => {
      const position = positionMap.get(`step-${step.stepNumber}`)!;
      const isGate = step.action.includes('gate');
      const shape = inferShape(step.action, index, chain.steps.length, isGate);

      return {
        id: `step-${step.stepNumber}`,
        type: 'flowchartNode',
        position: { x: position.x, y: position.y },
        data: {
          label: step.action,
          shape,
          status: step.status as 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped',
          stepNumber: step.stepNumber,
          model: step.model,
          duration: step.duration ? `${(step.duration / 1000).toFixed(1)}s` : undefined,
          error: step.error,
          onSelect: (stepNumber: number) => {
            setSelectedStep(stepNumber);
            onStepClick?.(stepNumber);
          },
        },
      };
    });
  }, [chain.steps, swimlaneAssignments, onStepClick, enableAnimations]);

  // Build edges from dependencies
  const edges = useMemo<Edge[]>(() => {
    const edgeDefinitions = calculateSwimlaneEdges(chain.steps);

    return edgeDefinitions.map(edge => {
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'flowchartEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: edge.animated ? '#fbc02d' : '#6e7a8a' },
        data: {
          label: edge.dataLabel,
          active: edge.animated,
          variant: 'default' as const,
        },
      };
    });
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

  // Auto-fit view when chain changes
  useEffect(() => {
    // Small delay to allow layout to settle
    const timer = setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);

    return () => clearTimeout(timer);
  }, [chain.id, fitView]);

  return (
    <div className="flow-visualization" data-testid="flow-visualization">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        {/* Swimlane background */}
        <Panel position="top-left" className="swimlane-panel">
          <SwimlaneBackground swimlaneNames={swimlaneNames} />
        </Panel>

        {/* DiscussButton in top-right panel */}
        <Panel position="top-right" className="flow-discuss-panel">
          <DiscussButton componentName="FlowVisualization" onClick={openDialog} size="small" />
        </Panel>

        <Background color="#e0e0e0" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data?.status;
            switch (status) {
              case 'completed': return '#3fb950';
              case 'failed': return '#ff453a';
              case 'in_progress': return '#ffd60a';
              case 'pending': return '#6e7a8a';
              case 'skipped': return '#484f58';
              default: return '#6e7a8a';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
        />
      </ReactFlow>

      {/* DiscussDialog */}
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="FlowVisualization"
        componentContext={{
          chainId: chain.id,
          chainTitle: chain.title,
          stepCount: chain.steps.length,
          selectedStep,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
};
