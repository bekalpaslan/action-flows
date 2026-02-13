/**
 * Dashboard Capabilities
 *
 * Phase 1 of Inspiration Roadmap — Thread 2 (Node Architecture)
 *
 * This module exports the DashboardCapabilityProvider and all
 * capability definitions that can be registered by dashboard components.
 *
 * Architecture:
 * 1. DashboardCapabilityProvider wraps the app tree
 * 2. Individual components register capabilities via useCapabilities()
 * 3. Backend invokes capabilities via WebSocket messages
 * 4. Handlers execute and return results
 */

// Provider and hook
export { DashboardCapabilityProvider, useCapabilities } from './DashboardCapabilityProvider';

// Capability definitions
export { cosmicMapCapability } from './cosmicMapCapability';
export type { CosmicMapStateResult } from './cosmicMapCapability';

export { terminalCapability } from './terminalCapability';
export type { TerminalExecuteInput, TerminalExecuteResult } from './terminalCapability';
