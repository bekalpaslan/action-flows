/**
 * TimelineView - Horizontal timeline visualization component
 * Shows steps positioned by execution time with parallel steps stacked
 */

import { useMemo, useState, useCallback } from 'react';
import type { Chain, ChainStep, StepNumber } from '@afw/shared';
import { ChainBadge } from '../ChainBadge';
import { StepInspector } from '../StepInspector';
import { detectChainType } from '../../utils/chainTypeDetection';
import './TimelineView.css';

interface TimelineViewProps {
  chain: Chain;
  onStepSelected?: (stepNumber: StepNumber) => void;
}

interface TimelinePosition {
  stepNumber: StepNumber;
  left: number; // percentage from left
  width: number; // percentage width
  row: number; // vertical row (0-indexed for stacking)
  startTime: number; // milliseconds from chain start
  endTime: number; // milliseconds from chain start
}

/**
 * Calculate timeline positions for steps
 */
function calculateTimelinePositions(chain: Chain): TimelinePosition[] {
  const baseTime = new Date(chain.compiledAt).getTime();
  const now = Date.now();

  // Find the overall time range
  let minTime = Infinity;
  let maxTime = -Infinity;

  chain.steps.forEach(step => {
    const startTime = step.startedAt ? new Date(step.startedAt).getTime() : now;
    const endTime = step.completedAt
      ? new Date(step.completedAt).getTime()
      : step.startedAt
      ? now
      : startTime;

    minTime = Math.min(minTime, startTime);
    maxTime = Math.max(maxTime, endTime);
  });

  // If no steps have started, use compilation time as baseline
  if (minTime === Infinity) {
    minTime = baseTime;
    maxTime = baseTime + 60000; // 1 minute default range
  }

  // Add 5% padding on each side
  const totalDuration = maxTime - minTime;
  const paddedMin = minTime - totalDuration * 0.05;
  const paddedMax = maxTime + totalDuration * 0.05;
  const paddedDuration = paddedMax - paddedMin;

  // Calculate positions for each step
  const positions: TimelinePosition[] = [];

  chain.steps.forEach(step => {
    const startTime = step.startedAt ? new Date(step.startedAt).getTime() : now;
    const endTime = step.completedAt
      ? new Date(step.completedAt).getTime()
      : step.startedAt
      ? now
      : startTime;

    const left = ((startTime - paddedMin) / paddedDuration) * 100;
    const width = ((endTime - startTime) / paddedDuration) * 100;

    positions.push({
      stepNumber: step.stepNumber,
      left: Math.max(0, left),
      width: Math.max(1, width), // Minimum 1% width for visibility
      row: 0, // Will be assigned in stacking algorithm
      startTime: startTime - paddedMin,
      endTime: endTime - paddedMin,
    });
  });

  // Stack overlapping steps
  positions.sort((a, b) => a.startTime - b.startTime);

  const rows: Array<{ endTime: number }> = [];

  positions.forEach(pos => {
    // Find first available row
    let assignedRow = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].endTime <= pos.startTime) {
        assignedRow = i;
        break;
      }
    }

    if (assignedRow === -1) {
      // Create new row
      assignedRow = rows.length;
      rows.push({ endTime: pos.endTime });
    } else {
      // Update row's end time
      rows[assignedRow].endTime = pos.endTime;
    }

    pos.row = assignedRow;
  });

  return positions;
}

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

/**
 * Get status class for step
 */
function getStatusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'in_progress':
      return 'in-progress';
    case 'pending':
      return 'pending';
    case 'skipped':
      return 'skipped';
    default:
      return 'pending';
  }
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  chain,
  onStepSelected,
}) => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  // Detect chain type for badge display
  const chainMetadata = useMemo(() => detectChainType(chain), [chain]);

  // Calculate timeline positions
  const positions = useMemo(() => calculateTimelinePositions(chain), [chain]);

  // Create step lookup map
  const stepMap = useMemo(() => {
    const map = new Map<number, ChainStep>();
    chain.steps.forEach(step => {
      map.set(Number(step.stepNumber), step);
    });
    return map;
  }, [chain.steps]);

  // Calculate max rows for container height
  const maxRows = useMemo(() => {
    return Math.max(...positions.map(p => p.row), 0) + 1;
  }, [positions]);

  const handleStepClick = useCallback(
    (stepNumber: number) => {
      setSelectedStep(stepNumber);
      if (onStepSelected) {
        onStepSelected(stepNumber as StepNumber);
      }
    },
    [onStepSelected]
  );

  // Compute stats
  const stats = useMemo(() => {
    const total = chain.steps.length;
    const completed = chain.steps.filter(s => s.status === 'completed').length;
    const failed = chain.steps.filter(s => s.status === 'failed').length;
    const inProgress = chain.steps.filter(s => s.status === 'in_progress').length;

    return { total, completed, failed, inProgress };
  }, [chain.steps]);

  const selectedStepData = useMemo(
    () => stepMap.get(selectedStep || -1) || null,
    [stepMap, selectedStep]
  );

  return (
    <div className="timeline-view-container">
      <div className="timeline-view-main">
        {/* Header with title, badge, and stats */}
        <div className="timeline-view-header">
          <div className="timeline-view-header-top">
            <h3 className="timeline-view-title">{chain.title}</h3>
            <ChainBadge metadata={chainMetadata} />
          </div>
          <div className="timeline-view-stats">
            <div className="timeline-view-stat">
              <span className="timeline-view-stat-value">{stats.total}</span>
              <span>total steps</span>
            </div>
            {stats.completed > 0 && (
              <div className="timeline-view-stat" style={{ color: '#4caf50' }}>
                <span className="timeline-view-stat-value">{stats.completed}</span>
                <span>completed</span>
              </div>
            )}
            {stats.inProgress > 0 && (
              <div className="timeline-view-stat" style={{ color: '#fbc02d' }}>
                <span className="timeline-view-stat-value">{stats.inProgress}</span>
                <span>in progress</span>
              </div>
            )}
            {stats.failed > 0 && (
              <div className="timeline-view-stat" style={{ color: '#f44336' }}>
                <span className="timeline-view-stat-value">{stats.failed}</span>
                <span>failed</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline canvas */}
        <div className="timeline-view-canvas">
          <div
            className="timeline-rows"
            style={{ height: `${maxRows * 60 + 40}px` }}
          >
            {positions.map(pos => {
              const step = stepMap.get(Number(pos.stepNumber));
              if (!step) return null;

              const isSelected = selectedStep === Number(pos.stepNumber);
              const statusClass = getStatusClass(step.status);

              return (
                <div
                  key={`step-${pos.stepNumber}`}
                  className={`timeline-step ${statusClass} ${
                    isSelected ? 'selected' : ''
                  }`}
                  style={{
                    left: `${pos.left}%`,
                    width: `${pos.width}%`,
                    top: `${pos.row * 60 + 20}px`,
                  }}
                  onClick={() => handleStepClick(Number(pos.stepNumber))}
                  role="button"
                  tabIndex={0}
                  aria-label={`Step ${pos.stepNumber}: ${step.action} using ${step.model} model. Status: ${step.status}`}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStepClick(Number(pos.stepNumber));
                    }
                  }}
                  title={`Step ${pos.stepNumber}: ${step.action} (${step.model})`}
                >
                  <div className="timeline-step-content">
                    <div className="timeline-step-number">#{pos.stepNumber}</div>
                    <div className="timeline-step-action">{step.action}</div>
                    <div className="timeline-step-model">{step.model}</div>
                    {step.duration && (
                      <div className="timeline-step-duration">
                        {formatDuration(step.duration)}
                      </div>
                    )}
                  </div>
                  <div className="timeline-step-bar"></div>
                </div>
              );
            })}
          </div>

          {/* Time axis (simplified) */}
          <div className="timeline-axis">
            <div className="timeline-axis-label">Start</div>
            <div className="timeline-axis-label">End</div>
          </div>
        </div>

        {/* Legend */}
        <div className="timeline-view-legend">
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
        step={selectedStepData}
        onClose={() => setSelectedStep(null)}
      />
    </div>
  );
};
