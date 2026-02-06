import { useCallback, useState } from 'react';
import type { Chain, ChainStep, StepNumber } from '@afw/shared';

/**
 * Return type for useChainState hook
 */
export interface UseChainStateReturn {
  chain: Chain | null;
  updateStep: (stepNumber: number, updates: Partial<ChainStep>) => void;
  setChain: (chain: Chain) => void;
}

/**
 * Hook that maintains chain state and provides methods to update individual steps
 *
 * Features:
 * - Maintains chain state with React state
 * - Updates individual step status when events arrive
 * - Supports partial updates to step data
 * - Immutable updates to maintain React reactivity
 */
export function useChainState(): UseChainStateReturn {
  const [chain, setChainState] = useState<Chain | null>(null);

  /**
   * Update a single step in the chain with partial updates
   * Creates a new chain object to trigger React re-renders
   */
  const updateStep = useCallback(
    (stepNumber: number, updates: Partial<ChainStep>) => {
      setChainState((prevChain) => {
        if (!prevChain) return prevChain;

        // Find the step to update
        const stepIndex = prevChain.steps.findIndex(
          (s) => Number(s.stepNumber) === stepNumber
        );

        if (stepIndex === -1) {
          console.warn(`Step ${stepNumber} not found in chain`);
          return prevChain;
        }

        // Create updated step
        const updatedStep: ChainStep = {
          ...prevChain.steps[stepIndex],
          ...updates,
        };

        // Create new steps array with updated step
        const updatedSteps = [
          ...prevChain.steps.slice(0, stepIndex),
          updatedStep,
          ...prevChain.steps.slice(stepIndex + 1),
        ];

        // Recalculate stats
        const successfulSteps = updatedSteps.filter(
          (s) => s.status === 'completed'
        ).length;
        const failedSteps = updatedSteps.filter(
          (s) => s.status === 'failed'
        ).length;
        const skippedSteps = updatedSteps.filter(
          (s) => s.status === 'skipped'
        ).length;

        // Update chain status based on step statuses
        let chainStatus = prevChain.status;
        const inProgressCount = updatedSteps.filter(
          (s) => s.status === 'in_progress'
        ).length;
        const pendingCount = updatedSteps.filter(
          (s) => s.status === 'pending'
        ).length;

        if (inProgressCount > 0) {
          chainStatus = 'in_progress';
        } else if (pendingCount === 0 && failedSteps === 0) {
          chainStatus = 'completed';
        } else if (failedSteps > 0) {
          chainStatus = 'mixed';
        }

        // Return new chain object
        return {
          ...prevChain,
          steps: updatedSteps,
          status: chainStatus,
          successfulSteps,
          failedSteps,
          skippedSteps,
          currentStep: updatedStep.stepNumber as StepNumber,
        };
      });
    },
    []
  );

  /**
   * Set the entire chain
   */
  const setChain = useCallback((newChain: Chain) => {
    setChainState(newChain);
  }, []);

  return {
    chain,
    updateStep,
    setChain,
  };
}
