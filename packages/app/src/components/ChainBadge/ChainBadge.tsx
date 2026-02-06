/**
 * ChainBadge Component
 * Displays a badge showing the chain type with optional inferred indicator
 */

import React from 'react';
import type { ChainMetadata } from '../../utils/chainTypeDetection';
import { getChainTypeClass } from '../../utils/chainTypeDetection';
import './ChainBadge.css';

interface ChainBadgeProps {
  /** Chain metadata with type and detection info */
  metadata: ChainMetadata;

  /** Optional click handler */
  onClick?: () => void;

  /** Optional className for additional styling */
  className?: string;
}

export const ChainBadge: React.FC<ChainBadgeProps> = ({
  metadata,
  onClick,
  className = '',
}) => {
  // Don't render for generic chains (no badge)
  if (metadata.type === 'generic') {
    return null;
  }

  const typeClass = getChainTypeClass(metadata.type);
  const classes = `chain-badge ${typeClass} ${className}`.trim();

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`Chain Type: ${metadata.type}${metadata.isExplicit ? ' (explicit)' : ' (inferred)'}${
        metadata.changeId ? ` - Change ID: ${metadata.changeId}` : ''
      }`}
    >
      <span className="badge-label">{metadata.badge}</span>

      {!metadata.isExplicit && (
        <span className="badge-inferred" title="Type was inferred from actions, not explicitly set">
          inferred
        </span>
      )}

      {metadata.changeId && metadata.type === 'openspec' && (
        <span className="badge-change-id" title={`Change ID: ${metadata.changeId}`}>
          #{metadata.changeId}
        </span>
      )}
    </div>
  );
};
