import type { FlowHubFlowId, FlowHubEntry, FlowManifest } from '@afw/shared';
import { toFlowHubFlowId } from '@afw/shared';

/**
 * FlowHub API Client
 * Handles communication with remote FlowHub registry
 */

interface CachedEntry<T> {
  data: T;
  timestamp: number;
}

class FlowHubClient {
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly flowsCache = new Map<string, CachedEntry<FlowHubEntry[]>>();
  private readonly manifestCache = new Map<FlowHubFlowId, CachedEntry<FlowManifest>>();

  // Stub configuration for Phase 3 - will connect to real API in future phases
  private readonly API_BASE_URL = 'https://flowhub.actionflows.io/api'; // Placeholder
  private readonly API_TIMEOUT_MS = 10000; // 10 seconds

  /**
   * Fetch flows from remote FlowHub registry
   * Stubbed for Phase 3 - returns empty array
   */
  async fetchFlows(filters?: { category?: string; tag?: string }): Promise<FlowHubEntry[]> {
    console.log(`[FlowHubClient] Fetching flows with filters:`, filters);

    try {
      // Check cache first
      const cacheKey = JSON.stringify(filters || {});
      const cached = this.flowsCache.get(cacheKey);

      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log(`[FlowHubClient] Returning cached flows (${cached.data.length} entries)`);
        return cached.data;
      }

      // Phase 3 stub: Return empty array
      // In future phases, this will make HTTP request to API_BASE_URL
      console.log(`[FlowHubClient] API integration not yet implemented - returning empty array`);
      const flows: FlowHubEntry[] = [];

      // Cache the result
      this.flowsCache.set(cacheKey, {
        data: flows,
        timestamp: Date.now(),
      });

      return flows;
    } catch (error) {
      console.error(`[FlowHubClient] Failed to fetch flows:`, error);
      this.handleError(error);
      return []; // Return empty array on error (graceful degradation)
    }
  }

  /**
   * Fetch full manifest for a specific flow
   * Stubbed for Phase 3
   */
  async fetchFlowManifest(flowId: FlowHubFlowId): Promise<FlowManifest> {
    console.log(`[FlowHubClient] Fetching manifest for flow: ${flowId}`);

    try {
      // Check cache first
      const cached = this.manifestCache.get(flowId);

      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log(`[FlowHubClient] Returning cached manifest: ${flowId}`);
        return cached.data;
      }

      // Phase 3 stub: Throw error indicating API not implemented
      throw new Error(`FlowHub API not yet implemented. Cannot fetch manifest for: ${flowId}`);

      // Future implementation would look like:
      // const response = await fetch(`${this.API_BASE_URL}/flows/${flowId}/manifest`, {
      //   method: 'GET',
      //   headers: { 'Accept': 'application/json' },
      //   signal: AbortSignal.timeout(this.API_TIMEOUT_MS),
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      // }
      //
      // const manifest = await response.json() as FlowManifest;
      //
      // // Cache the manifest
      // this.manifestCache.set(flowId, {
      //   data: manifest,
      //   timestamp: Date.now(),
      // });
      //
      // return manifest;
    } catch (error) {
      console.error(`[FlowHubClient] Failed to fetch manifest for ${flowId}:`, error);
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Publish a flow to the remote FlowHub
   * Stubbed for Phase 3
   */
  async publishToHub(
    manifest: FlowManifest,
    apiKey?: string
  ): Promise<{ success: boolean; flowId: FlowHubFlowId }> {
    console.log(`[FlowHubClient] Publishing flow to hub: ${manifest.flowId}`);

    try {
      // Phase 3 stub: Simulate successful publish
      console.log(`[FlowHubClient] API integration not yet implemented - simulating success`);

      // In future phases, this will make HTTP POST to API_BASE_URL
      // const response = await fetch(`${this.API_BASE_URL}/flows`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': apiKey ? `Bearer ${apiKey}` : '',
      //   },
      //   body: JSON.stringify(manifest),
      //   signal: AbortSignal.timeout(this.API_TIMEOUT_MS),
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      // }
      //
      // const result = await response.json();
      // return result;

      return {
        success: true,
        flowId: manifest.flowId,
      };
    } catch (error) {
      console.error(`[FlowHubClient] Failed to publish flow:`, error);
      this.handleError(error);
      return {
        success: false,
        flowId: manifest.flowId,
      };
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    console.log(`[FlowHubClient] Clearing all caches`);
    this.flowsCache.clear();
    this.manifestCache.clear();
  }

  /**
   * Clear cache for specific flow
   */
  clearFlowCache(flowId: FlowHubFlowId): void {
    console.log(`[FlowHubClient] Clearing cache for flow: ${flowId}`);
    this.manifestCache.delete(flowId);
    // Also clear flows cache since it might contain this flow
    this.flowsCache.clear();
  }

  /**
   * Check if cached data is still valid (within TTL)
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL_MS;
  }

  /**
   * Handle errors with rate limiting awareness
   */
  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for rate limiting
    if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
      console.warn(`[FlowHubClient] Rate limit detected. Request throttled.`);
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      console.warn(`[FlowHubClient] Request timeout. Network may be slow.`);
    } else {
      console.error(`[FlowHubClient] Unexpected error:`, errorMessage);
    }
  }

  /**
   * Get cache statistics (for debugging/monitoring)
   */
  getCacheStats(): {
    flowsCacheSize: number;
    manifestCacheSize: number;
    oldestFlowsCacheEntry: number | null;
    oldestManifestCacheEntry: number | null;
  } {
    const flowsTimestamps = Array.from(this.flowsCache.values()).map(c => c.timestamp);
    const manifestTimestamps = Array.from(this.manifestCache.values()).map(c => c.timestamp);

    return {
      flowsCacheSize: this.flowsCache.size,
      manifestCacheSize: this.manifestCache.size,
      oldestFlowsCacheEntry: flowsTimestamps.length > 0 ? Math.min(...flowsTimestamps) : null,
      oldestManifestCacheEntry: manifestTimestamps.length > 0 ? Math.min(...manifestTimestamps) : null,
    };
  }
}

// Export singleton instance
export const flowHubClient = new FlowHubClient();
