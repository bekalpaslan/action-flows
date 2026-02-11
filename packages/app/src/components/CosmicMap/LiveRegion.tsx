/**
 * LiveRegion - Screen reader announcements for region discoveries
 *
 * Announces newly discovered regions to screen readers using ARIA live regions.
 * Provides accessibility support for fog of war revelation events.
 */

import { useState, useEffect } from 'react';
import { useDiscoveryContext } from '../../contexts/DiscoveryContext';
import './LiveRegion.css';

export function LiveRegion() {
  const { readyToReveal } = useDiscoveryContext();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (readyToReveal && readyToReveal.length > 0) {
      const latest = readyToReveal[readyToReveal.length - 1];
      setAnnouncement(`New region discovered: ${latest}`);

      // Clear announcement after 3 seconds
      const timeout = setTimeout(() => {
        setAnnouncement('');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [readyToReveal]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
