/**
 * FigmaLinkPanel Component
 * Displays linked Figma designs for the current session/chain
 */

import React, { useEffect, useState } from 'react';
import type { FigmaLink } from '@afw/shared';
import styles from './FigmaLinkPanel.module.css';

export interface FigmaLinkPanelProps {
  /** Optional chain ID to filter links */
  chainId?: string;
  /** Optional session ID to filter links */
  sessionId?: string;
  /** Callback when a link is clicked */
  onLinkClick?: (link: FigmaLink) => void;
}

/**
 * FigmaLinkPanel displays a list of Figma design links
 * associated with the current chain or session.
 */
export const FigmaLinkPanel: React.FC<FigmaLinkPanelProps> = ({
  chainId,
  sessionId,
  onLinkClick,
}) => {
  const [links, setLinks] = useState<FigmaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams();
        if (chainId) params.append('chainId', chainId);
        if (sessionId) params.append('sessionId', sessionId);

        const response = await fetch(`/api/figma/links?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch Figma links');
        }

        const data = await response.json();
        setLinks(data.links || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [chainId, sessionId]);

  const handleLinkClick = (link: FigmaLink) => {
    if (onLinkClick) {
      onLinkClick(link);
    } else {
      // Default behavior: open in new tab
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>Loading Figma links...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>No Figma links found</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Linked Figma Designs</h3>
      <ul className={styles.linkList}>
        {links.map((link) => (
          <li key={link.id} className={styles.linkItem}>
            <button
              className={styles.linkButton}
              onClick={() => handleLinkClick(link)}
              type="button"
            >
              <div className={styles.linkTitle}>{link.title}</div>
              <div className={styles.linkMeta}>
                <span className={styles.fileKey}>{link.fileKey}</span>
                {link.nodeId && (
                  <span className={styles.nodeId}>Node: {link.nodeId}</span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FigmaLinkPanel;
