import { useEffect, useRef, useCallback } from 'react';
import { wsClient } from '@/lib/ws-client';
import { usePipelineStore } from '@/stores/pipelineStore';
import { layoutPipeline } from '@/lib/pipeline-layout';
import type { WSEnvelope } from '@afw/shared';
import type {
  ChainCompiledEvent,
  StepSpawnedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  StepSkippedEvent,
} from '@afw/shared';
import type { WorkbenchId } from '@/lib/types';

/**
 * WebSocket subscription hook that maps chain/step events to pipeline store updates.
 * Uses requestAnimationFrame batching per RESEARCH.md Pitfall 3 to prevent render cascades.
 *
 * @param workbenchId - The workbench channel to subscribe to for pipeline events.
 */
export function usePipelineEvents(workbenchId: WorkbenchId): void {
  // Narrow selectors to avoid unnecessary re-renders
  const initChain = usePipelineStore((s) => s.initChain);
  const updateNodeStatus = usePipelineStore((s) => s.updateNodeStatus);
  const updateEdgeStatus = usePipelineStore((s) => s.updateEdgeStatus);
  const clearPipeline = usePipelineStore((s) => s.clearPipeline);

  // Buffers for RAF batching
  const bufferRef = useRef<WSEnvelope[]>([]);
  const rafRef = useRef<number | null>(null);

  // Track chain:completed clear timeout so it can be cancelled on new chain:compiled
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Find the edge ID targeting a given step node.
   * Uses direct store access (.getState()) to avoid selector re-render dependency.
   */
  const findIncomingEdgeId = useCallback(
    (stepNumber: number): string | null => {
      const pipeline = usePipelineStore.getState().pipelines.get(workbenchId);
      if (!pipeline) return null;
      const edge = pipeline.edges.find((e) => e.target === String(stepNumber));
      return edge?.id ?? null;
    },
    [workbenchId]
  );

  const processBuffer = useCallback(() => {
    const envelopes = bufferRef.current.splice(0);

    for (const envelope of envelopes) {
      switch (envelope.type) {
        case 'chain:compiled': {
          const payload = envelope.payload as ChainCompiledEvent;
          // Cancel any pending clearPipeline timeout from previous chain:completed
          if (clearTimeoutRef.current) {
            clearTimeout(clearTimeoutRef.current);
            clearTimeoutRef.current = null;
          }
          if (payload.steps && payload.steps.length > 0) {
            const { nodes, edges } = layoutPipeline(payload.steps);
            initChain(
              workbenchId,
              (payload.chainId as string) ?? 'unknown',
              nodes,
              edges
            );
          }
          break;
        }

        case 'step:spawned': {
          const payload = envelope.payload as StepSpawnedEvent;
          updateNodeStatus(workbenchId, String(payload.stepNumber), {
            name: (payload.action as string) ?? 'Unknown',
            agentModel: (payload.model as string) ?? null,
            description: (payload.description as string) ?? null,
            inputs: payload.inputs ?? null,
          });
          break;
        }

        case 'step:started': {
          const payload = envelope.payload as StepStartedEvent;
          updateNodeStatus(workbenchId, String(payload.stepNumber), {
            status: 'running',
            startedAt: payload.startedAt as string,
          });
          // Update incoming edge to active
          const edgeId = findIncomingEdgeId(payload.stepNumber as number);
          if (edgeId) {
            updateEdgeStatus(workbenchId, edgeId, {
              data: { status: 'active' },
            });
          }
          break;
        }

        case 'step:completed': {
          const payload = envelope.payload as StepCompletedEvent;
          updateNodeStatus(workbenchId, String(payload.stepNumber), {
            status: 'complete',
            elapsedMs: payload.duration as number,
            result: payload.result ?? null,
            fileChanges: (payload.fileChanges as StepCompletedEvent['fileChanges']) ?? null,
          });
          // Update incoming edge to completed
          const edgeId = findIncomingEdgeId(payload.stepNumber as number);
          if (edgeId) {
            updateEdgeStatus(workbenchId, edgeId, {
              data: { status: 'completed' },
            });
          }
          break;
        }

        case 'step:failed': {
          const payload = envelope.payload as StepFailedEvent;
          updateNodeStatus(workbenchId, String(payload.stepNumber), {
            status: 'failed',
            error: (payload.error as string) ?? null,
            suggestion: (payload.suggestion as string) ?? null,
          });
          // Update incoming edge to failed
          const edgeId = findIncomingEdgeId(payload.stepNumber as number);
          if (edgeId) {
            updateEdgeStatus(workbenchId, edgeId, {
              data: { status: 'failed' },
            });
          }
          break;
        }

        case 'step:skipped': {
          const payload = envelope.payload as StepSkippedEvent;
          updateNodeStatus(workbenchId, String(payload.stepNumber), {
            status: 'skipped',
          });
          break;
        }

        case 'chain:completed': {
          // Clear pipeline after 5-second delay per UI-SPEC chain completion transition
          clearTimeoutRef.current = setTimeout(() => {
            clearPipeline(workbenchId);
            clearTimeoutRef.current = null;
          }, 5000);
          break;
        }
      }
    }
  }, [workbenchId, initChain, updateNodeStatus, updateEdgeStatus, clearPipeline, findIncomingEdgeId]);

  useEffect(() => {
    const unsub = wsClient.subscribe(workbenchId, (envelope: WSEnvelope) => {
      bufferRef.current.push(envelope);
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          processBuffer();
          rafRef.current = null;
        });
      }
    });

    return () => {
      unsub();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = null;
      }
    };
  }, [workbenchId, processBuffer]);
}
