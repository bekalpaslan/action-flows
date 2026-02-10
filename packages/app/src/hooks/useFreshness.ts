import { useEffect, useState } from 'react';
import type { FreshnessMetadata, FreshnessGrade } from '@afw/shared';

/**
 * Hook to query freshness metadata for a resource
 *
 * Polls the freshness API every 30 seconds to check if the resource is stale.
 * Returns freshness metadata including the age and grade (fresh, recent, aging, stale).
 *
 * @param resourceType - Type of resource: 'session', 'chain', or 'events'
 * @param resourceId - ID of the resource to check
 * @returns Freshness metadata, loading state, and computed properties
 */
export function useFreshness(
  resourceType: 'session' | 'chain' | 'events',
  resourceId: string
): {
  freshness: FreshnessMetadata | null;
  isStale: boolean;
  grade: FreshnessGrade | null;
  isLoading: boolean;
  error: string | null;
} {
  const [freshness, setFreshness] = useState<FreshnessMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchFreshness = async () => {
      try {
        // Construct API URL based on resource type
        let url: string;
        if (resourceType === 'session') {
          url = `/api/sessions/${resourceId}/freshness`;
        } else if (resourceType === 'chain') {
          // For chains, we'd need a separate endpoint - for now, return null
          console.warn('[useFreshness] Chain freshness endpoint not yet implemented');
          if (isMounted) {
            setFreshness(null);
            setIsLoading(false);
          }
          return;
        } else if (resourceType === 'events') {
          // For events, we'd need a separate endpoint - for now, return null
          console.warn('[useFreshness] Events freshness endpoint not yet implemented');
          if (isMounted) {
            setFreshness(null);
            setIsLoading(false);
          }
          return;
        } else {
          throw new Error(`Unknown resource type: ${resourceType}`);
        }

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            // Resource not found or no freshness data
            if (isMounted) {
              setFreshness(null);
              setError(null);
            }
            return;
          }
          throw new Error(`Failed to fetch freshness: ${response.statusText}`);
        }

        const data = await response.json() as FreshnessMetadata;

        if (isMounted) {
          setFreshness(data);
          setError(null);
        }
      } catch (err) {
        console.error('[useFreshness] Error fetching freshness:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchFreshness();

    // Poll every 30 seconds
    pollInterval = setInterval(() => {
      fetchFreshness();
    }, 30_000);

    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [resourceType, resourceId]);

  return {
    freshness,
    isStale: freshness?.freshnessGrade === 'stale',
    grade: freshness?.freshnessGrade || null,
    isLoading,
    error,
  };
}
