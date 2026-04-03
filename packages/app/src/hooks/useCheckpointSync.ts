import { useEffect } from 'react';
import { wsClient } from '@/lib/ws-client';
import { usePipelineStore } from '@/stores/pipelineStore';
import type { WorkbenchId } from '@/lib/types';
import type { WSEnvelope, CheckpointData } from '@afw/shared';

interface CheckpointCreatedPayload {
  nodeId: string;
  checkpoint: CheckpointData;
}

/**
 * Syncs git commit checkpoints to pipeline step nodes.
 *
 * Listens for checkpoint:created and checkpoint:reverted WebSocket events
 * and populates pipeline step nodes with checkpoint data via pipelineStore.setCheckpoint.
 *
 * On mount, fetches existing checkpoints from GET /api/checkpoints and maps them
 * to completed pipeline step nodes using timestamp-based heuristics.
 */
export function useCheckpointSync(workbenchId: WorkbenchId): void {
  useEffect(() => {
    const handler = (envelope: WSEnvelope) => {
      if (envelope.type === 'checkpoint:created') {
        const payload = envelope.payload as CheckpointCreatedPayload;
        usePipelineStore
          .getState()
          .setCheckpoint(workbenchId, payload.nodeId, payload.checkpoint);
      }

      if (envelope.type === 'checkpoint:reverted') {
        // On revert, re-fetch checkpoints to update pipeline state
        fetchAndMapCheckpoints();
      }
    };

    const unsubWorkbench = wsClient.subscribe(workbenchId, handler);
    const unsubSystem = wsClient.subscribe('_system', handler);

    // Initial fetch of checkpoints for the current pipeline
    fetchAndMapCheckpoints();

    return () => {
      unsubWorkbench();
      unsubSystem();
    };

    async function fetchAndMapCheckpoints(): Promise<void> {
      const pipeline = usePipelineStore.getState().pipelines.get(workbenchId);
      if (!pipeline || pipeline.nodes.length === 0) return;

      try {
        const res = await fetch('/api/checkpoints?limit=50');
        if (!res.ok) return;

        const checkpoints = (await res.json()) as CheckpointData[];
        if (!checkpoints || checkpoints.length === 0) return;

        // Get completed step nodes sorted by stepNumber
        const completedSteps = pipeline.nodes
          .filter((n) => n.data.type === 'step' && n.data.status === 'complete')
          .sort((a, b) => {
            if (a.data.type === 'step' && b.data.type === 'step') {
              return a.data.stepNumber - b.data.stepNumber;
            }
            return 0;
          });

        if (completedSteps.length === 0) return;

        // Sort checkpoints by timestamp ascending
        const sortedCheckpoints = [...checkpoints].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Timestamp-based matching: pair checkpoints to steps by execution window
        for (const step of completedSteps) {
          if (step.data.type !== 'step' || !step.data.startedAt) continue;

          const stepStart = new Date(step.data.startedAt).getTime();

          // Find the next step's startedAt to define the execution window
          const stepIndex = completedSteps.indexOf(step);
          const nextStep = completedSteps[stepIndex + 1];
          const windowEnd = nextStep?.data.type === 'step' && nextStep.data.startedAt
            ? new Date(nextStep.data.startedAt).getTime()
            : Infinity;

          // Find checkpoint within this step's execution window
          const matchingCheckpoint = sortedCheckpoints.find((cp) => {
            const cpTime = new Date(cp.timestamp).getTime();
            return cpTime >= stepStart && cpTime < windowEnd;
          });

          if (matchingCheckpoint) {
            usePipelineStore
              .getState()
              .setCheckpoint(workbenchId, step.id, matchingCheckpoint);
            // Remove from pool to avoid double-matching
            const idx = sortedCheckpoints.indexOf(matchingCheckpoint);
            if (idx >= 0) sortedCheckpoints.splice(idx, 1);
          }
        }

        // Fallback: pair remaining checkpoints with remaining completed steps (1:1 sequential)
        if (sortedCheckpoints.length > 0) {
          const unmatchedSteps = completedSteps.filter((s) => {
            if (s.data.type !== 'step') return false;
            return !s.data.checkpoint;
          });

          const pairCount = Math.min(sortedCheckpoints.length, unmatchedSteps.length);
          for (let i = 0; i < pairCount; i++) {
            const step = unmatchedSteps[i]!;
            const cp = sortedCheckpoints[i]!;
            usePipelineStore.getState().setCheckpoint(workbenchId, step.id, cp);
          }
        }
      } catch {
        // Silent failure -- checkpoints are non-critical data
      }
    }
  }, [workbenchId]);
}
