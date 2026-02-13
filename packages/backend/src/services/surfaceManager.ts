/**
 * Surface Manager Service
 * Manages connected surfaces and routes input to orchestrator
 * Part of Phase 2A — Multi-Surface Orchestration (Thread 1)
 */

import type { SurfaceId, ConnectedSurface, SurfaceConfig, SurfaceInput } from '@afw/shared';

/**
 * SurfaceManager coordinates all connected surfaces
 * Handles registration, session subscriptions, and input routing
 */
class SurfaceManager {
  private surfaces: Map<string, ConnectedSurface> = new Map(); // keyed by instanceId

  /**
   * Register a new surface connection
   */
  connect(surfaceId: SurfaceId, instanceId: string, config: SurfaceConfig): ConnectedSurface {
    const now = new Date().toISOString();
    const surface: ConnectedSurface = {
      surfaceId,
      instanceId,
      config,
      connectedAt: now,
      lastActivityAt: now,
      sessionIds: [],
    };

    this.surfaces.set(instanceId, surface);
    console.log(`[SurfaceManager] Surface connected: ${surfaceId}/${instanceId}`);

    return surface;
  }

  /**
   * Disconnect a surface
   */
  disconnect(instanceId: string): void {
    const surface = this.surfaces.get(instanceId);
    if (surface) {
      console.log(`[SurfaceManager] Surface disconnected: ${surface.surfaceId}/${instanceId}`);
      this.surfaces.delete(instanceId);
    }
  }

  /**
   * Get all connected surfaces
   */
  list(): ConnectedSurface[] {
    return Array.from(this.surfaces.values());
  }

  /**
   * Get surfaces for a specific session
   */
  getForSession(sessionId: string): ConnectedSurface[] {
    return this.list().filter((surface) => surface.sessionIds.includes(sessionId));
  }

  /**
   * Subscribe a surface to a session
   */
  subscribeToSession(instanceId: string, sessionId: string): void {
    const surface = this.surfaces.get(instanceId);
    if (surface && !surface.sessionIds.includes(sessionId)) {
      surface.sessionIds.push(sessionId);
      surface.lastActivityAt = new Date().toISOString();
      console.log(`[SurfaceManager] Surface ${surface.surfaceId}/${instanceId} subscribed to session ${sessionId}`);
    }
  }

  /**
   * Unsubscribe from a session
   */
  unsubscribeFromSession(instanceId: string, sessionId: string): void {
    const surface = this.surfaces.get(instanceId);
    if (surface) {
      const index = surface.sessionIds.indexOf(sessionId);
      if (index !== -1) {
        surface.sessionIds.splice(index, 1);
        surface.lastActivityAt = new Date().toISOString();
        console.log(`[SurfaceManager] Surface ${surface.surfaceId}/${instanceId} unsubscribed from session ${sessionId}`);
      }
    }
  }

  /**
   * Route input from a surface to the orchestrator
   * This method queues the input for orchestrator processing
   * The actual orchestration happens elsewhere (ws/handler.ts or similar)
   */
  async handleInput(input: SurfaceInput): Promise<void> {
    const surface = this.surfaces.get(input.instanceId);
    if (!surface) {
      console.warn(`[SurfaceManager] Input received from unknown surface: ${input.instanceId}`);
      return;
    }

    // Update last activity timestamp
    surface.lastActivityAt = new Date().toISOString();

    // Log the input with surface metadata
    console.log(`[SurfaceManager] Input received from ${surface.surfaceId}/${input.instanceId} for session ${input.sessionId}`);
    if (input.metadata) {
      console.log(`[SurfaceManager] Metadata:`, input.metadata);
    }

    // TODO: Queue the input to orchestrator
    // For now, this is a stub. Full implementation would:
    // 1. Find the session's storage
    // 2. Queue the input (similar to how ws/handler.ts handles 'input' messages)
    // 3. Let orchestrator process it
    console.log(`[SurfaceManager] Input queued for processing (stub): "${input.content.substring(0, 50)}..."`);
  }

  /**
   * Get a specific surface by instanceId
   */
  get(instanceId: string): ConnectedSurface | undefined {
    return this.surfaces.get(instanceId);
  }

  /**
   * Update last activity timestamp for a surface
   */
  updateActivity(instanceId: string): void {
    const surface = this.surfaces.get(instanceId);
    if (surface) {
      surface.lastActivityAt = new Date().toISOString();
    }
  }
}

// Singleton instance
export const surfaceManager = new SurfaceManager();
