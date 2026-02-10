/**
 * RespectWorkbench Component
 * Live spatial health monitoring panel for UI components
 *
 * Features:
 * - Real-time boundary checks on all UI components
 * - Categorized results by component type
 * - Violation details with expected vs actual values
 * - Auto-run on mount for instant feedback
 */

import React, { useEffect } from 'react';
import { useRespectCheck } from './useRespectCheck';
import { RespectCheckControls } from './RespectCheckControls';
import { LiveSpatialMonitor } from './LiveSpatialMonitor';
import './RespectWorkbench.css';

export function RespectWorkbench(): React.ReactElement {
  const { result, isRunning, error, runCheck, lastCheckedAt } = useRespectCheck();

  // Auto-run on mount
  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return (
    <div className="respect-workbench">
      <RespectCheckControls
        onRunCheck={runCheck}
        isRunning={isRunning}
        result={result}
      />

      <LiveSpatialMonitor result={result} error={error} />

      {lastCheckedAt && (
        <div className="respect-workbench__status-bar">
          Last check: {new Date(lastCheckedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
