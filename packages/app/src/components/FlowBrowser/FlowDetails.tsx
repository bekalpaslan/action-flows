import React, { useState, useEffect } from 'react';
import { useFlowBrowser, type FlowMetadata } from '../../hooks/useFlowBrowser';
import './FlowDetails.css';

interface FlowDetailsProps {
  flow: FlowMetadata;
  onExecute?: (flow: FlowMetadata) => Promise<void>;
  onClose?: () => void;
}

/**
 * FlowDetails Component
 * Displays comprehensive flow information including:
 * - Full metadata (description, readme, version, author)
 * - Execution history (last 10 runs)
 * - Usage timeline
 * - Execute flow button
 */
export function FlowDetails({ flow, onExecute, onClose }: FlowDetailsProps): React.ReactElement {
  const { fetchFlowDetails } = useFlowBrowser();
  const [flowDetails, setFlowDetails] = useState<FlowMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const details = await fetchFlowDetails(flow.id);
        setFlowDetails(details);
      } catch (err) {
        console.error('[FlowDetails] Error loading flow details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [flow.id, fetchFlowDetails]);

  const handleExecute = async () => {
    if (!onExecute) return;
    setExecuting(true);
    try {
      await onExecute(flow);
    } finally {
      setExecuting(false);
    }
  };

  const displayFlow = flowDetails || flow;

  return (
    <div className="flow-details">
      <div className="flow-details__header">
        <div className="flow-details__title-section">
          <h2 className="flow-details__title">{displayFlow.name}</h2>
          <span className="flow-details__category-badge">{displayFlow.category}</span>
        </div>
        <button className="flow-details__close" onClick={onClose} title="Close details">
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flow-details__loading">Loading flow details...</div>
      ) : (
        <>
          {/* Description */}
          <div className="flow-details__section">
            <h3 className="flow-details__section-title">Description</h3>
            <p className="flow-details__description">{displayFlow.description}</p>
          </div>

          {/* Metadata */}
          <div className="flow-details__section">
            <h3 className="flow-details__section-title">Metadata</h3>
            <div className="flow-details__metadata">
              {displayFlow.version && (
                <div className="metadata-item">
                  <span className="label">Version</span>
                  <span className="value">{displayFlow.version}</span>
                </div>
              )}
              {displayFlow.author && (
                <div className="metadata-item">
                  <span className="label">Author</span>
                  <span className="value">{displayFlow.author}</span>
                </div>
              )}
              <div className="metadata-item">
                <span className="label">Usage Count</span>
                <span className="value">{displayFlow.usageCount}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Success Rate</span>
                <span className="value">{(displayFlow.successRate * 100).toFixed(1)}%</span>
              </div>
              {displayFlow.lastUsedAt && (
                <div className="metadata-item">
                  <span className="label">Last Used</span>
                  <span className="value">{new Date(displayFlow.lastUsedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {displayFlow.tags.length > 0 && (
            <div className="flow-details__section">
              <h3 className="flow-details__section-title">Tags</h3>
              <div className="flow-details__tags">
                {displayFlow.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* README */}
          {displayFlow.readme && (
            <div className="flow-details__section">
              <h3 className="flow-details__section-title">Documentation</h3>
              <div className="flow-details__readme">{displayFlow.readme}</div>
            </div>
          )}

          {/* Execution History */}
          {displayFlow.executionHistory && displayFlow.executionHistory.length > 0 && (
            <div className="flow-details__section">
              <h3 className="flow-details__section-title">Recent Executions</h3>
              <div className="flow-details__history">
                {displayFlow.executionHistory.slice(0, 10).map((execution, idx) => (
                  <div key={idx} className={`history-item status-${execution.status}`}>
                    <div className="history-timestamp">
                      {new Date(execution.startedAt).toLocaleString()}
                    </div>
                    <div className="history-status">{execution.status}</div>
                    {execution.duration && (
                      <div className="history-duration">{(execution.duration / 1000).toFixed(1)}s</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flow-details__actions">
            <button
              className="flow-details__execute-button"
              onClick={handleExecute}
              disabled={executing}
            >
              {executing ? 'Executing...' : 'Run Flow'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
