import { useCallback } from 'react';
import { ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Maximize2 } from 'lucide-react';
import { nodeTypes, edgeTypes } from '@/components/pipeline';
import { usePipelineStore } from '@/stores/pipelineStore';
import { Button } from '@/components/ui';
import type { WorkbenchId } from '@/lib/types';
import { PipelineEmptyState } from './PipelineEmptyState';

interface PipelineViewProps {
  workbenchId: WorkbenchId;
}

/**
 * Inner canvas component that uses useReactFlow for fitView.
 * Must be rendered inside ReactFlowProvider.
 */
function PipelineCanvas({ workbenchId }: PipelineViewProps) {
  const pipeline = usePipelineStore((s) => s.pipelines.get(workbenchId));
  const selectNode = usePipelineStore((s) => s.selectNode);
  const { fitView } = useReactFlow();

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      selectNode(workbenchId, node.id);
    },
    [selectNode, workbenchId]
  );

  const onPaneClick = useCallback(() => {
    selectNode(workbenchId, null);
  }, [selectNode, workbenchId]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  if (!pipeline || pipeline.nodes.length === 0) {
    return <PipelineEmptyState />;
  }

  return (
    <>
      <ReactFlow
        nodes={pipeline.nodes}
        edges={pipeline.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        minZoom={0.25}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
      />
      {/* Fit View button - top right corner per UI-SPEC */}
      <div className="absolute top-2 right-2 z-[10]">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFitView}
          aria-label="Fit pipeline to view"
        >
          <Maximize2 size={16} />
        </Button>
      </div>
    </>
  );
}

/**
 * Main pipeline container that replaces PipelinePlaceholder.
 * Renders horizontal pipeline from store state with zoom/pan/fitView.
 * Per PIPE-01 (horizontal pipeline) and PIPE-05 (horizontally scrollable).
 */
export function PipelineView({ workbenchId }: PipelineViewProps) {
  return (
    <div
      className="relative h-full w-full bg-surface p-2"
      role="region"
      aria-label="Pipeline visualization"
      tabIndex={0}
    >
      <ReactFlowProvider>
        <PipelineCanvas workbenchId={workbenchId} />
      </ReactFlowProvider>
    </div>
  );
}
