/**
 * Capability Registry Service
 * Manages capability registration, invocation, and lifecycle for Phase 1 Node Architecture
 */

import type {
  Capability,
  CapabilityId,
  CapabilityStatus,
  RegisteredCapability,
  CapabilityInvocation,
  CapabilityResult,
  CapabilityInvokeMessage,
} from '@afw/shared';
import { clientRegistry } from '../ws/clientRegistry.js';

/**
 * Pending invocation state
 */
interface PendingInvocation {
  resolve: (result: CapabilityResult) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  invocation: CapabilityInvocation;
}

/**
 * Capability Registry Service
 * Central registry for capabilities exposed by dashboard panels and backend services
 */
export class CapabilityRegistry {
  private capabilities = new Map<string, RegisteredCapability>();
  private pendingInvocations = new Map<string, PendingInvocation>();
  private clientCapabilities = new Map<string, Set<CapabilityId>>(); // clientId -> capability IDs
  private readonly DEFAULT_TIMEOUT_MS = 30000;

  /**
   * Register capabilities from a client
   */
  register(capabilities: Capability[], clientId: string): void {
    const now = new Date().toISOString();

    // Track capabilities for this client
    if (!this.clientCapabilities.has(clientId)) {
      this.clientCapabilities.set(clientId, new Set());
    }
    const clientCapSet = this.clientCapabilities.get(clientId)!;

    for (const cap of capabilities) {
      const registered: RegisteredCapability = {
        ...cap,
        status: 'online',
        registeredAt: now,
        clientId,
      };

      this.capabilities.set(cap.id, registered);
      clientCapSet.add(cap.id);

      console.log(`[CapabilityRegistry] Registered: ${cap.name} (${cap.id}) from client ${clientId}`);
    }
  }

  /**
   * Unregister capabilities by client ID (called when client disconnects)
   */
  unregisterByClient(clientId: string): void {
    const capIds = this.clientCapabilities.get(clientId);
    if (!capIds) {
      return;
    }

    // Mark all capabilities as offline (don't remove immediately for recovery)
    for (const capId of capIds) {
      const cap = this.capabilities.get(capId);
      if (cap) {
        cap.status = 'offline';
        console.log(`[CapabilityRegistry] Marked offline: ${cap.name} (${capId}) - client ${clientId} disconnected`);
      }
    }

    // Clean up client tracking
    this.clientCapabilities.delete(clientId);
  }

  /**
   * Unregister specific capabilities by ID
   */
  unregister(capabilityIds: CapabilityId[]): void {
    for (const capId of capabilityIds) {
      const cap = this.capabilities.get(capId);
      if (cap) {
        // Remove from client tracking
        if (cap.clientId) {
          const clientCapSet = this.clientCapabilities.get(cap.clientId);
          if (clientCapSet) {
            clientCapSet.delete(capId);
          }
        }

        // Remove from registry
        this.capabilities.delete(capId);
        console.log(`[CapabilityRegistry] Unregistered: ${cap.name} (${capId})`);
      }
    }
  }

  /**
   * List all registered capabilities with optional filtering
   */
  list(filter?: { status?: CapabilityStatus; provider?: string }): RegisteredCapability[] {
    let caps = Array.from(this.capabilities.values());

    if (filter?.status) {
      caps = caps.filter((c) => c.status === filter.status);
    }

    if (filter?.provider) {
      caps = caps.filter((c) => c.provider === filter.provider);
    }

    return caps;
  }

  /**
   * Get a specific capability by ID
   */
  get(capabilityId: CapabilityId): RegisteredCapability | undefined {
    return this.capabilities.get(capabilityId);
  }

  /**
   * Invoke a capability and wait for response
   * Returns a promise that resolves when the client responds
   */
  async invoke(invocation: CapabilityInvocation): Promise<CapabilityResult> {
    const cap = this.capabilities.get(invocation.capabilityId);

    if (!cap) {
      throw new Error(`Capability not found: ${invocation.capabilityId}`);
    }

    if (cap.status === 'offline') {
      throw new Error(`Capability is offline: ${invocation.capabilityId}`);
    }

    if (!cap.clientId) {
      throw new Error(`No client associated with capability: ${invocation.capabilityId}`);
    }

    // Create promise for this invocation
    return new Promise<CapabilityResult>((resolve, reject) => {
      const timeout = invocation.timeout || this.DEFAULT_TIMEOUT_MS;

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingInvocations.delete(invocation.correlationId);
        reject(new Error(`Capability invocation timed out after ${timeout}ms: ${invocation.capabilityId}`));
      }, timeout);

      // Store pending invocation
      this.pendingInvocations.set(invocation.correlationId, {
        resolve,
        reject,
        timeout: timeoutHandle,
        invocation,
      });

      // Send invocation to client via WebSocket
      try {
        const message: CapabilityInvokeMessage = {
          type: 'capability:invoke',
          correlationId: invocation.correlationId,
          capabilityId: invocation.capabilityId,
          inputs: invocation.inputs,
          timeout: invocation.timeout,
        };

        // Broadcast to the specific client
        const subscribers = clientRegistry.getClientsForSession(cap.clientId as any);
        if (subscribers.length === 0) {
          this.pendingInvocations.delete(invocation.correlationId);
          clearTimeout(timeoutHandle);
          reject(new Error(`Client not connected: ${cap.clientId}`));
          return;
        }

        // Send to first matching client (should only be one)
        const client = subscribers[0];
        if (!client) {
          this.pendingInvocations.delete(invocation.correlationId);
          clearTimeout(timeoutHandle);
          reject(new Error(`No WebSocket client found for: ${cap.clientId}`));
          return;
        }

        if (client.readyState === 1) {
          client.send(JSON.stringify(message));
          console.log(`[CapabilityRegistry] Invoked: ${cap.name} (${cap.id}) - correlation: ${invocation.correlationId}`);

          // Update last invoked timestamp
          cap.lastInvokedAt = new Date().toISOString();
        } else {
          this.pendingInvocations.delete(invocation.correlationId);
          clearTimeout(timeoutHandle);
          reject(new Error(`Client WebSocket not open: ${cap.clientId}`));
        }
      } catch (error) {
        this.pendingInvocations.delete(invocation.correlationId);
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  /**
   * Handle result from a client (matched by correlationId)
   */
  handleResult(correlationId: string, result: CapabilityResult): void {
    const pending = this.pendingInvocations.get(correlationId);
    if (!pending) {
      console.warn(`[CapabilityRegistry] Received result for unknown correlation ID: ${correlationId}`);
      return;
    }

    // Clear timeout and remove from pending
    clearTimeout(pending.timeout);
    this.pendingInvocations.delete(correlationId);

    // Resolve the promise
    pending.resolve(result);

    console.log(`[CapabilityRegistry] Result received for correlation: ${correlationId} - success: ${result.success}`);
  }

  /**
   * Handle error from a client
   */
  handleError(correlationId: string, error: string, code: string): void {
    const pending = this.pendingInvocations.get(correlationId);
    if (!pending) {
      console.warn(`[CapabilityRegistry] Received error for unknown correlation ID: ${correlationId}`);
      return;
    }

    // Clear timeout and remove from pending
    clearTimeout(pending.timeout);
    this.pendingInvocations.delete(correlationId);

    // Reject the promise
    pending.reject(new Error(`Capability error [${code}]: ${error}`));

    console.log(`[CapabilityRegistry] Error received for correlation: ${correlationId} - code: ${code}, error: ${error}`);
  }

  /**
   * Get statistics about registered capabilities
   */
  getStats(): {
    total: number;
    online: number;
    offline: number;
    degraded: number;
    byProvider: Record<string, number>;
  } {
    const caps = Array.from(this.capabilities.values());

    return {
      total: caps.length,
      online: caps.filter((c) => c.status === 'online').length,
      offline: caps.filter((c) => c.status === 'offline').length,
      degraded: caps.filter((c) => c.status === 'degraded').length,
      byProvider: caps.reduce((acc, c) => {
        acc[c.provider] = (acc[c.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Export singleton instance
export const capabilityRegistry = new CapabilityRegistry();
