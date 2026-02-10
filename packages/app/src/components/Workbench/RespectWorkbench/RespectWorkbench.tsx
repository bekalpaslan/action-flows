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
import { DiscussButton, DiscussDialog } from '../../DiscussButton';
import { useDiscussButton } from '../../../hooks/useDiscussButton';
import { OrchestratorButton } from '../../OrchestratorButton';
import './RespectWorkbench.css';

export function RespectWorkbench(): React.ReactElement {
  const { result, isRunning, error, runCheck, lastCheckedAt } = useRespectCheck();

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'RespectWorkbench',
    getContext: () => ({
      spatialChecks: result?.categories ? Object.keys(result.categories).length : 0,
      boundaryViolations: result?.summary.violations || 0,
    }),
  });

  // Auto-run on mount
  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return (
    <div className="respect-workbench">
      <div className="respect-workbench__header">
        <h1 className="respect-workbench__title">Respect Workbench</h1>
        <DiscussButton componentName="RespectWorkbench" onClick={openDialog} size="small" />
        <OrchestratorButton source="respect-rescore" context={{ action: 'rescore-respect' }}>
          <button className="respect-workbench__action-btn">Re-score Respect</button>
        </OrchestratorButton>
      </div>

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

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="RespectWorkbench"
        componentContext={{
          spatialChecks: result?.categories ? Object.keys(result.categories).length : 0,
          boundaryViolations: result?.summary.violations || 0,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
