/**
 * ChainDemo - Interactive demo component for testing chain status updates
 * Simulates real-time status changes without needing a backend
 */

import { useState, useCallback, useMemo } from 'react';
import type { Chain } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { ChainDAG } from './ChainDAG';
import { sampleChain } from '../data/sampleChain';
import '../styles/ChainDemo.css';

interface DemoStep {
  stepNumber: number;
  action: string;
  duration?: number;
}

export const ChainDemo: React.FC = () => {
  const [chain, setChain] = useState<Chain>(sampleChain);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Predefined simulation scenarios
   */
  const scenarios = useMemo<DemoStep[]>(() => [
    { stepNumber: 1, action: 'spawn', duration: 0 },
    { stepNumber: 1, action: 'complete', duration: 270000 },
    { stepNumber: 2, action: 'spawn', duration: 500 },
    { stepNumber: 2, action: 'complete', duration: 165000 },
    { stepNumber: 3, action: 'spawn', duration: 1000 },
    { stepNumber: 3, action: 'complete', duration: 180000 },
    { stepNumber: 4, action: 'spawn', duration: 1500 },
    { stepNumber: 4, action: 'complete', duration: 90000 },
    { stepNumber: 5, action: 'spawn', duration: 2500 },
    { stepNumber: 5, action: 'complete', duration: 120000 },
  ], []);

  /**
   * Update step status
   */
  const updateStepStatus = useCallback(
    (stepNumber: number, status: 'in_progress' | 'completed' | 'failed', duration?: number, error?: string) => {
      setChain((prevChain) => {
        const stepIndex = prevChain.steps.findIndex(
          (s) => Number(s.stepNumber) === stepNumber
        );

        if (stepIndex === -1) return prevChain;

        const updatedStep = {
          ...prevChain.steps[stepIndex],
          status,
          ...(duration && { duration }),
          ...(error && { error }),
          ...(status === 'in_progress' && !prevChain.steps[stepIndex].startedAt && {
            startedAt: brandedTypes.timestamp(new Date().toISOString()),
          }),
          ...(status === 'completed' && {
            completedAt: brandedTypes.timestamp(new Date().toISOString()),
          }),
        };

        const updatedSteps = [
          ...prevChain.steps.slice(0, stepIndex),
          updatedStep,
          ...prevChain.steps.slice(stepIndex + 1),
        ];

        // Recalculate stats
        const successfulSteps = updatedSteps.filter((s) => s.status === 'completed').length;
        const failedSteps = updatedSteps.filter((s) => s.status === 'failed').length;
        const skippedSteps = updatedSteps.filter((s) => s.status === 'skipped').length;

        // Update chain status
        let chainStatus = prevChain.status;
        const inProgressCount = updatedSteps.filter((s) => s.status === 'in_progress').length;
        const pendingCount = updatedSteps.filter((s) => s.status === 'pending').length;

        if (inProgressCount > 0) {
          chainStatus = 'in_progress';
        } else if (pendingCount === 0 && failedSteps === 0) {
          chainStatus = 'completed';
        } else if (failedSteps > 0) {
          chainStatus = 'mixed';
        }

        return {
          ...prevChain,
          steps: updatedSteps,
          status: chainStatus as any,
          successfulSteps,
          failedSteps,
          skippedSteps,
        };
      });
    },
    []
  );

  /**
   * Run automated scenario
   */
  const runScenario = useCallback(async () => {
    setIsRunning(true);
    setChain(sampleChain);
    setCurrentStep(0);

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];

      // Delay before executing step
      await new Promise((resolve) => setTimeout(resolve, scenario.duration || 500));

      if (scenario.action === 'spawn') {
        updateStepStatus(scenario.stepNumber, 'in_progress');
      } else if (scenario.action === 'complete') {
        updateStepStatus(scenario.stepNumber, 'completed', 270000);
      } else if (scenario.action === 'fail') {
        updateStepStatus(scenario.stepNumber, 'failed', undefined, 'Simulated failure');
      }

      setCurrentStep(i + 1);
    }

    setIsRunning(false);
  }, [scenarios, updateStepStatus]);

  /**
   * Manual step update buttons
   */
  const handleSpawnStep = (stepNumber: number) => {
    updateStepStatus(stepNumber, 'in_progress');
  };

  const handleCompleteStep = (stepNumber: number) => {
    const duration = Math.floor(Math.random() * 300000) + 30000; // Random 30s-300s
    updateStepStatus(stepNumber, 'completed', duration);
  };

  const handleFailStep = (stepNumber: number) => {
    updateStepStatus(stepNumber, 'failed', undefined, 'Simulated error: Unknown failure');
  };

  const handleSkipStep = (stepNumber: number) => {
    setChain((prevChain) => {
      const stepIndex = prevChain.steps.findIndex((s) => Number(s.stepNumber) === stepNumber);
      if (stepIndex === -1) return prevChain;

      const updatedStep = {
        ...prevChain.steps[stepIndex],
        status: 'skipped' as const,
      };

      const updatedSteps = [
        ...prevChain.steps.slice(0, stepIndex),
        updatedStep,
        ...prevChain.steps.slice(stepIndex + 1),
      ];

      const successfulSteps = updatedSteps.filter((s) => s.status === 'completed').length;
      const failedSteps = updatedSteps.filter((s) => s.status === 'failed').length;
      const skippedSteps = updatedSteps.filter((s) => s.status === 'skipped').length;

      return {
        ...prevChain,
        steps: updatedSteps,
        successfulSteps,
        failedSteps,
        skippedSteps,
      };
    });
  };

  const handleReset = () => {
    setChain(sampleChain);
    setIsRunning(false);
    setCurrentStep(0);
  };

  return (
    <div className="chain-demo-container">
      <div className="chain-demo-header">
        <h2>Chain Status Updates Demo</h2>
        <p>Test real-time step status updates without needing a backend</p>
      </div>

      <div className="chain-demo-controls">
        <div className="control-section">
          <h3>Automated Scenario</h3>
          <button
            className="demo-button primary"
            onClick={runScenario}
            disabled={isRunning}
          >
            {isRunning ? `Running... (${currentStep}/${scenarios.length})` : 'Run Full Scenario'}
          </button>
          <button className="demo-button" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div className="control-section">
          <h3>Manual Step Controls</h3>
          <div className="step-controls">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="step-control-group">
                <span className="step-label">Step {stepNum}</span>
                <div className="step-buttons">
                  <button
                    className="demo-button small"
                    onClick={() => handleSpawnStep(stepNum)}
                    title="Spawn step (set to in_progress)"
                  >
                    Spawn
                  </button>
                  <button
                    className="demo-button small success"
                    onClick={() => handleCompleteStep(stepNum)}
                    title="Complete step"
                  >
                    Complete
                  </button>
                  <button
                    className="demo-button small danger"
                    onClick={() => handleFailStep(stepNum)}
                    title="Fail step"
                  >
                    Fail
                  </button>
                  <button
                    className="demo-button small"
                    onClick={() => handleSkipStep(stepNum)}
                    title="Skip step"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="control-section">
          <h3>Status Legend</h3>
          <div className="legend">
            <div className="legend-item">
              <div className="status-dot pending"></div>
              <span>Pending (awaiting execution)</span>
            </div>
            <div className="legend-item">
              <div className="status-dot in-progress"></div>
              <span>In Progress (currently running)</span>
            </div>
            <div className="legend-item">
              <div className="status-dot completed"></div>
              <span>Completed (finished successfully)</span>
            </div>
            <div className="legend-item">
              <div className="status-dot failed"></div>
              <span>Failed (encountered error)</span>
            </div>
            <div className="legend-item">
              <div className="status-dot skipped"></div>
              <span>Skipped (not executed)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chain-demo-visualization">
        <ChainDAG chain={chain} />
      </div>
    </div>
  );
};
