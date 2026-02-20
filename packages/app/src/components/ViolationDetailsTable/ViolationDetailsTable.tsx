/**
 * ViolationDetailsTable Component
 * Expandable table showing contract violation details with row drill-down.
 *
 * Features:
 * - Compact list view using div-based rows
 * - Click row to expand showing full violation messages, orchestrator output, harmony score
 * - Color-coded rows based on harmony score (red < 50, yellow < 80, subtle >= 80)
 * - Sort by timestamp (newest first)
 * - Max 10 items visible with "Show all X violations" link if more
 * - Smooth height transition on expand
 */

import React, { useState, useMemo } from 'react';
import './ViolationDetailsTable.css';

export interface ViolationDetail {
  gateId: string;
  gateName: string;
  timestamp: string;
  chainId?: string;
  orchestratorOutput?: string;
  parsedFormat?: string | null;
  validationResult?: {
    passed: boolean;
    violations: string[];
    harmonyScore: number;
  };
}

export interface ViolationDetailsTableProps {
  violations: ViolationDetail[];
  className?: string;
}

/**
 * Format timestamp as relative time (e.g., "5m ago", "2h ago")
 */
function timeAgo(timestamp: string): string {
  try {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  } catch {
    return 'unknown';
  }
}

/**
 * Truncate text with "Show more" toggle
 */
function TruncatedText({
  text,
  limit = 200,
  expanded = false,
  onToggle,
}: {
  text: string;
  limit?: number;
  expanded?: boolean;
  onToggle?: () => void;
}): React.ReactElement {
  if (text.length <= limit) {
    return <span>{text}</span>;
  }

  return (
    <>
      <span className={expanded ? '' : 'violation-details-table__output--truncated'}>
        {expanded ? text : `${text.substring(0, limit)}...`}
      </span>
      {onToggle && (
        <button className="violation-details-table__show-more" onClick={onToggle}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </>
  );
}

export function ViolationDetailsTable({
  violations,
  className = '',
}: ViolationDetailsTableProps): React.ReactElement {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState<Set<string>>(new Set());

  // Sort by timestamp (newest first)
  const sortedViolations = useMemo(() => {
    return [...violations].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Newest first
    });
  }, [violations]);

  // Show only first 10 unless showAll is true
  const displayedViolations = showAll ? sortedViolations : sortedViolations.slice(0, 10);
  const hasMore = sortedViolations.length > 10;

  /**
   * Toggle row expansion
   */
  const handleRowClick = (gateId: string) => {
    setExpandedId(expandedId === gateId ? null : gateId);
  };

  /**
   * Toggle orchestrator output expansion
   */
  const handleOutputToggle = (gateId: string) => {
    setExpandedOutput((prev) => {
      const next = new Set(prev);
      if (next.has(gateId)) {
        next.delete(gateId);
      } else {
        next.add(gateId);
      }
      return next;
    });
  };

  /**
   * Get severity class based on harmony score
   */
  const getSeverityClass = (harmonyScore: number): string => {
    if (harmonyScore < 50) return 'violation-details-table__row--critical';
    if (harmonyScore < 80) return 'violation-details-table__row--warning';
    return '';
  };

  return (
    <div className={`violation-details-table ${className}`.trim()}>
      {displayedViolations.map((violation) => {
        const isExpanded = expandedId === violation.gateId;
        const harmonyScore = violation.validationResult?.harmonyScore ?? 0;
        const severityClass = getSeverityClass(harmonyScore);

        return (
          <div
            key={violation.gateId}
            className={`violation-details-table__row ${severityClass} ${
              isExpanded ? 'violation-details-table__row--expanded' : ''
            }`.trim()}
          >
            {/* Compact header row */}
            <button
              className="violation-details-table__header"
              onClick={() => handleRowClick(violation.gateId)}
              aria-expanded={isExpanded}
              aria-controls={`violation-details-${violation.gateId}`}
            >
              <span className="violation-details-table__chevron">
                {isExpanded ? '▼' : '▶'}
              </span>
              <span className="violation-details-table__gate-name">{violation.gateName}</span>
              <span className="violation-details-table__format">
                {violation.parsedFormat || 'Unknown'}
              </span>
              <span className="violation-details-table__time">{timeAgo(violation.timestamp)}</span>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div
                className="violation-details-table__details"
                id={`violation-details-${violation.gateId}`}
              >
                {/* Harmony score */}
                <div className="violation-details-table__detail-row">
                  <span className="violation-details-table__detail-label">Harmony Score:</span>
                  <span className="violation-details-table__detail-value">{harmonyScore}%</span>
                </div>

                {/* Chain ID */}
                {violation.chainId && (
                  <div className="violation-details-table__detail-row">
                    <span className="violation-details-table__detail-label">Chain ID:</span>
                    <span className="violation-details-table__detail-value">
                      {violation.chainId}
                    </span>
                  </div>
                )}

                {/* Violation messages */}
                {violation.validationResult?.violations &&
                  violation.validationResult.violations.length > 0 && (
                    <div className="violation-details-table__detail-row">
                      <span className="violation-details-table__detail-label">Violations:</span>
                      <ul className="violation-details-table__violations-list">
                        {violation.validationResult.violations.map((msg, idx) => (
                          <li key={idx}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Orchestrator output */}
                {violation.orchestratorOutput && (
                  <div className="violation-details-table__detail-row">
                    <span className="violation-details-table__detail-label">
                      Orchestrator Output:
                    </span>
                    <div className="violation-details-table__output">
                      <TruncatedText
                        text={violation.orchestratorOutput}
                        limit={200}
                        expanded={expandedOutput.has(violation.gateId)}
                        onToggle={() => handleOutputToggle(violation.gateId)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Show all link */}
      {hasMore && !showAll && (
        <button
          className="violation-details-table__show-all"
          onClick={() => setShowAll(true)}
        >
          Show all {sortedViolations.length} violations
        </button>
      )}
    </div>
  );
}
