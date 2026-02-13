import { createContext, useContext, useEffect, useCallback, useRef, useState, type ReactNode } from 'react';
import type { Capability, CapabilityId, WorkspaceEvent } from '@afw/shared';
import type {
  CapabilityInvokeMessage,
  CapabilityResultMessage,
  CapabilityErrorMessage,
  CapabilityRegisterMessage,
  CapabilityUnregisterMessage,
} from '@afw/shared';
import { useWebSocketContext } from '../contexts/WebSocketContext';

// Type for a capability handler function
type CapabilityHandler = (inputs: Record<string, unknown>) => Promise<unknown>;

interface CapabilityRegistration {
  capability: Capability;
  handler: CapabilityHandler;
}

interface CapabilityContextValue {
  /** Register a capability with a handler */
  registerCapability: (capability: Capability, handler: CapabilityHandler) => void;
  /** Unregister a capability */
  unregisterCapability: (capabilityId: CapabilityId) => void;
  /** List locally registered capabilities */
  capabilities: Capability[];
  /** Whether connected and capabilities are registered with backend */
  isRegistered: boolean;
}

const CapabilityContext = createContext<CapabilityContextValue | null>(null);

export function useCapabilities() {
  const ctx = useContext(CapabilityContext);
  if (!ctx) throw new Error('useCapabilities must be used within DashboardCapabilityProvider');
  return ctx;
}

interface DashboardCapabilityProviderProps {
  children: ReactNode;
}

/**
 * DashboardCapabilityProvider
 *
 * Phase 1 of Inspiration Roadmap — Thread 2 (Node Architecture)
 *
 * Manages frontend capability registration and invocation:
 * 1. Maintains a registry of local capabilities + handlers
 * 2. Listens for capability:invoke messages via WebSocket
 * 3. Executes handlers and sends back capability:result or capability:error
 * 4. Sends capability:register/unregister messages to backend
 */
export function DashboardCapabilityProvider({ children }: DashboardCapabilityProviderProps) {
  const { status, send, onEvent } = useWebSocketContext();

  // Local capability registry
  const registryRef = useRef<Map<CapabilityId, CapabilityRegistration>>(new Map());
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);

  // Register a capability
  const registerCapability = useCallback((capability: Capability, handler: CapabilityHandler) => {
    registryRef.current.set(capability.id, { capability, handler });
    setCapabilities(Array.from(registryRef.current.values()).map(r => r.capability));

    // Send registration to backend if connected
    if (status === 'connected') {
      const msg: CapabilityRegisterMessage = {
        type: 'capability:register',
        capabilities: [capability],
      };
      // Cast to any because CapabilityMessage is not in WorkspaceEvent union yet (backend integration pending)
      send(msg as any);
    }
  }, [status, send]);

  // Unregister a capability
  const unregisterCapability = useCallback((capabilityId: CapabilityId) => {
    registryRef.current.delete(capabilityId);
    setCapabilities(Array.from(registryRef.current.values()).map(r => r.capability));

    // Send unregistration to backend if connected
    if (status === 'connected') {
      const msg: CapabilityUnregisterMessage = {
        type: 'capability:unregister',
        capabilityIds: [capabilityId],
      };
      // Cast to any because CapabilityMessage is not in WorkspaceEvent union yet (backend integration pending)
      send(msg as any);
    }
  }, [status, send]);

  // Handle capability invocation from backend
  const handleCapabilityInvoke = useCallback(async (message: CapabilityInvokeMessage) => {
    const { correlationId, capabilityId, inputs, timeout = 30000 } = message;

    const registration = registryRef.current.get(capabilityId);

    if (!registration) {
      // Capability not found — send error
      const errorMsg: CapabilityErrorMessage = {
        type: 'capability:error',
        correlationId,
        capabilityId,
        error: `Capability not found: ${capabilityId}`,
        code: 'unavailable',
      };
      // Cast to any because CapabilityMessage is not in WorkspaceEvent union yet (backend integration pending)
      send(errorMsg as any);
      return;
    }

    try {
      // Execute handler with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Capability execution timeout')), timeout)
      );

      const resultPromise = registration.handler(inputs);

      const data = await Promise.race([resultPromise, timeoutPromise]);

      // Send success result
      const resultMsg: CapabilityResultMessage = {
        type: 'capability:result',
        correlationId,
        capabilityId,
        success: true,
        data,
      };
      // Cast to any because CapabilityMessage is not in WorkspaceEvent union yet (backend integration pending)
      send(resultMsg as any);
    } catch (error) {
      // Send error result
      const errorMsg: CapabilityErrorMessage = {
        type: 'capability:error',
        correlationId,
        capabilityId,
        error: error instanceof Error ? error.message : String(error),
        code: 'execution-error',
      };
      // Cast to any because CapabilityMessage is not in WorkspaceEvent union yet (backend integration pending)
      send(errorMsg as any);
    }
  }, [send]);

  // Listen for capability:invoke messages
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event: WorkspaceEvent) => {
      // Cast to any to check for capability:invoke (not in WorkspaceEvent union yet)
      const eventAny = event as any;
      if (eventAny.type === 'capability:invoke') {
        handleCapabilityInvoke(eventAny as CapabilityInvokeMessage);
      }
    });

    return unsubscribe;
  }, [onEvent, handleCapabilityInvoke]);

  // Re-register all capabilities when connection is established
  useEffect(() => {
    if (status === 'connected' && registryRef.current.size > 0) {
      const allCapabilities = Array.from(registryRef.current.values()).map(r => r.capability);
      const msg: CapabilityRegisterMessage = {
        type: 'capability:register',
        capabilities: allCapabilities,
      };
      // Cast to any because CapabilityMessage is not in WorkspaceEvent union yet (backend integration pending)
      send(msg as any);
      setIsRegistered(true);
    } else if (status === 'disconnected') {
      setIsRegistered(false);
    }
  }, [status, send]);

  const value: CapabilityContextValue = {
    registerCapability,
    unregisterCapability,
    capabilities,
    isRegistered,
  };

  return (
    <CapabilityContext.Provider value={value}>
      {children}
    </CapabilityContext.Provider>
  );
}
