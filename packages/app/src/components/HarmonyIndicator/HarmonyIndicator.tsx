/**
 * HarmonyIndicator Component
 * Small inline indicator for session headers, step nodes
 */

import React from 'react';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './HarmonyIndicator.css';

interface HarmonyIndicatorProps {
  /** Status of harmony check */
  status: 'valid' | 'degraded' | 'violation';

  /** Optional tooltip text */
  tooltip?: string;

  /** Optional className */
  className?: string;
}

export const HarmonyIndicator: React.FC<HarmonyIndicatorProps> = ({
  status,
  tooltip,
  className = '',
}) => {
  const classes = `harmony-indicator harmony-indicator--${status} ${className}`.trim();

  const defaultTooltips = {
    valid: 'Valid harmony - output parsed successfully',
    degraded: 'Degraded harmony - partial parse',
    violation: 'Harmony violation - output failed to parse',
  };

  const title = tooltip || defaultTooltips[status];

  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'HarmonyIndicator',
    getContext: () => ({
      status,
      tooltip: title,
    }),
  });

  const statusLabels = {
    valid: 'Valid harmony - output parsed successfully',
    degraded: 'Degraded harmony - partial parse',
    violation: 'Harmony violation - output failed to parse',
  };

  return (
    <>
      <div
        className={classes}
        title={title}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {status === 'valid' && <span className="harmony-indicator__icon" aria-hidden="true">✓</span>}
        {status === 'degraded' && <span className="harmony-indicator__icon" aria-hidden="true">⚠</span>}
        {status === 'violation' && <span className="harmony-indicator__icon" aria-hidden="true">✗</span>}
        <span className="sr-only">
          Harmony status: {statusLabels[status]}
        </span>
        <DiscussButton componentName="HarmonyIndicator" onClick={openDialog} size="small" />
      </div>

      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="HarmonyIndicator"
        componentContext={{ status, tooltip: title }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </>
  );
};
