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
import type { FlowNodeData } from '@afw/shared';
import { AnimatedStepNode, type AnimatedStepNodeData } from './AnimatedStepNode';
import { AnimatedFlowEdge } from './AnimatedFlowEdge';
import { SwimlaneBackground } from './SwimlaneBackground';
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
};

const edgeTypes = {
  animatedEdge: AnimatedFlowEdge,
};

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
  const nodes = useMemo<Node<AnimatedStepNodeData>[]>(() => {
    const positions = calculateNodePositions(chain.steps, swimlaneAssignments);
    const positionMap = new Map(positions.map(p => [p.id, p]));

    return chain.steps.map(step => {
      const position = positionMap.get(`step-${step.stepNumber}`)!;

      // Determine animation state based on status
      let animationState: FlowNodeData['animationState'] = 'idle';
      if (enableAnimations) {
        if (step.status === 'pending') {
          animationState = 'slide-in';
        } else if (step.status === 'in_progress') {
          animationState = 'pulse';
        } else if (step.status === 'completed') {
          animationState = 'shrink';
        } else if (step.status === 'failed') {
          animationState = 'shake';
        }
      }

      return {
        id: `step-${step.stepNumber}`,
        type: 'animatedStep',
        position: { x: position.x, y: position.y },
        data: {
          step,
          stepNumber: step.stepNumber,
          action: step.action,
          status: step.status,
          description: step.description,
          model: step.model,
          animationState,
          onInspect: (stepNumber: number) => {
            setSelectedStep(stepNumber);
            onStepClick?.(stepNumber);
          },
        } as AnimatedStepNodeData,
      };
    });
  }, [chain.steps, swimlaneAssignments, onStepClick, enableAnimations]);

  // Build edges from dependencies
  const edges = useMemo<Edge[]>(() => {
    const edgeDefinitions = calculateSwimlaneEdges(chain.steps);

    return edgeDefinitions.map(edge => {
      // Extract step numbers from edge IDs (format: edge-{sourceNum}-{targetNum})
      const idParts = edge.id.split('-');
      const sourceStepNum = idParts[1] ? Number(idParts[1]) : 0;
      const targetStepNum = idParts[2] ? Number(idParts[2]) : 0;

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'animatedEdge',
        animated: edge.animated,
        markerEnd: { type: MarkerType.ArrowClosed, color: edge.animated ? '#fbc02d' : '#bdbdbd' },
        data: {
          dataLabel: edge.dataLabel,
          active: edge.animated,
          sourceStep: sourceStepNum as import('@afw/shared').StepNumber,
          targetStep: targetStepNum as import('@afw/shared').StepNumber,
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
            const step = (node.data as AnimatedStepNodeData).step;
            if (!step) return '#ccc';
            switch (step.status) {
              case 'completed': return '#4caf50';
              case 'failed': return '#f44336';
              case 'in_progress': return '#fbc02d';
              case 'pending': return '#ccc';
              case 'skipped': return '#999';
              default: return '#ccc';
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
