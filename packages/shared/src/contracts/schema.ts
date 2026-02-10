/**
 * Component Behavioral Contract Schema Types
 *
 * Defines TypeScript interfaces for behavioral contract definitions parsed from
 * markdown contract files (*.contract.md).
 */

// ============================================================================
// Enums & Type Aliases
// ============================================================================

export type ComponentType = 'page' | 'feature' | 'widget' | 'utility';

export type HealthCheckType =
  | 'render'                  // component renders without error
  | 'connection'              // WebSocket/API connection established
  | 'context-registration'    // registered with required context
  | 'timeout'                 // operation completes within time limit
  | 'data-fetch'              // data successfully loaded
  | 'interaction'             // user interaction works
  | 'boundary'                // spatial boundaries respected
  | 'data-integration'        // data extraction from props
  | 'behavior'                // behavioral verification
  | 'visual-feedback'         // visual state indicators
  | 'integration'             // component integration
  | 'accessibility';          // accessibility features present

export type InteractionMechanism = 'prop-callback' | 'context' | 'event' | 'ref' | 'parent-mediated';

export type ContextRole = 'provider' | 'consumer';

export type StorageOperation = 'read' | 'write';

export type TimerType = 'timeout' | 'interval';

export type ElectronIPCDirection = 'send' | 'receive';

export type RenderConditionType = 'prop' | 'context' | 'state' | 'route';

// ============================================================================
// Core Root Type
// ============================================================================

export interface ComponentBehavioralContract {
  // === Identity ===
  identity: Identity;

  // === Render Location ===
  renderLocation: RenderLocation;

  // === Lifecycle ===
  lifecycle: Lifecycle;

  // === Props Contract ===
  propsContract: PropsContract;

  // === State Ownership ===
  stateOwnership: StateOwnership;

  // === Interactions ===
  interactions: Interactions;

  // === Side Effects ===
  sideEffects: SideEffects;

  // === Test Hooks ===
  testHooks: TestHooks;

  // === Health Checks ===
  healthChecks: HealthChecks;

  // === Dependencies ===
  dependencies: Dependencies;

  // === Metadata ===
  metadata: Metadata;
}

// ============================================================================
// Identity
// ============================================================================

export interface Identity {
  componentName: string;              // e.g., "ChatPanel", "FlowVisualization"
  filePath: string;                   // relative to packages/app/src/
  parentGroup: string;                // directory group (SessionPanel, Canvas, etc.)
  type: ComponentType;                // 'page' | 'feature' | 'widget' | 'utility'
  introduced: string;                 // ISO date (YYYY-MM-DD)
  description?: string;               // 1-2 sentence description
}

// ============================================================================
// Render Location
// ============================================================================

export interface RenderLocation {
  mountsUnder: string[];                          // parent components
  conditions: RenderCondition[];                  // when it renders
  position: 'fixed' | 'relative' | 'absolute' | 'sticky' | null;
  zIndex?: number;                                // if stacking context matters
}

export interface RenderCondition {
  type: RenderConditionType;
  description: string;
  code: string;                       // condition expression (e.g., "session !== null")
}

// ============================================================================
// Lifecycle
// ============================================================================

export interface Lifecycle {
  mountTriggers: string[];                        // what causes mount
  keyEffects: LifecycleEffect[];                  // useEffect dependencies + side effects
  cleanup: string[];                              // cleanup actions on unmount
  unmountTriggers: string[];                      // what causes unmount
}

export interface LifecycleEffect {
  dependencies: string[];                         // useEffect deps array
  sideEffects: string[];                          // what the effect does (array of descriptions)
  cleanup?: string;                               // cleanup function description if any
  runCondition?: string;                          // when this effect runs
}

// ============================================================================
// Props Contract
// ============================================================================

export interface PropsContract {
  inputs: PropField[];                            // all props with types
  callbacksUp: CallbackProp[];                    // event handlers passed to component
  callbacksDown: CallbackProp[];                  // event handlers component passes to children
}

export interface PropField {
  name: string;
  type: string;                                   // TypeScript type string
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface CallbackProp {
  name: string;
  signature: string;                              // function signature
  description: string;
  emittedBy?: string;                             // which child emits this callback
  passedTo?: string;                              // which component receives this (for callbacksDown)
}

// ============================================================================
// State Ownership
// ============================================================================

export interface StateOwnership {
  localState: StateField[];                       // useState declarations
  contextConsumption: ContextField[];             // which contexts it reads from
  derivedState: DerivedField[];                   // useMemo/useCallback computed values
  customHooks: string[];                          // custom hooks used
}

export interface StateField {
  name: string;
  type: string;
  initialValue: string;
  updatedBy: string[];                            // which functions update this state
}

export interface ContextField {
  contextName: string;                            // e.g., "WebSocketContext"
  valuesConsumed: string[];                       // which values from context
}

export interface DerivedField {
  name: string;
  type: string;
  dependencies: string[];
  computation: string;                            // description of how it's computed
}

// ============================================================================
// Interactions
// ============================================================================

export interface Interactions {
  parentCommunication: ParentInteraction[];       // how it talks to parents
  childCommunication: ChildInteraction[];         // how it talks to children
  siblingCommunication: SiblingInteraction[];     // sibling component coordination
  contextCommunication: ContextInteraction[];     // context provider/consumer patterns
}

export interface ParentInteraction {
  mechanism: InteractionMechanism;
  description: string;
  example?: string;
}

export interface ChildInteraction {
  childComponent: string;
  mechanism: 'props' | 'context' | 'ref';
  dataFlow: string;                               // what data is passed
}

export interface SiblingInteraction {
  sibling: string;
  mechanism: InteractionMechanism;
  description: string;
}

export interface ContextInteraction {
  contextName: string;
  role: ContextRole;
  operations: string[];                           // what it does with context
}

// ============================================================================
// Side Effects
// ============================================================================

export interface SideEffects {
  apiCalls: APICall[];                            // HTTP requests
  webSocketEvents: WebSocketEvent[];              // WS subscriptions
  timers: Timer[];                                // setTimeout/setInterval
  localStorage: LocalStorageOp[];                 // localStorage read/write
  domManipulation: DOMManipulation[];             // direct DOM access
  electronIPC?: ElectronIPC[];                    // Electron IPC (if applicable)
}

export interface APICall {
  endpoint: string;                               // e.g., "/api/sessions"
  method: string;                                 // GET, POST, PUT, DELETE
  trigger: string;                                // what causes this call
  response: string;                               // what happens with response
}

export interface WebSocketEvent {
  eventType: string;                              // e.g., "session:started"
  trigger: string;                                // when subscription starts
  handler: string;                                // what happens when event received
}

export interface Timer {
  type: TimerType;
  duration: number;                               // milliseconds
  purpose: string;
  cleanup: boolean;                               // whether it's cleaned up on unmount
}

export interface LocalStorageOp {
  key: string;
  operation: StorageOperation;
  trigger: string;
  value?: string;
}

export interface DOMManipulation {
  target: string;                                 // what DOM element/property
  operation: string;                              // what is done
  trigger: string;
}

export interface ElectronIPC {
  channel: string;
  direction: ElectronIPCDirection;
  purpose: string;
}

// ============================================================================
// Test Hooks
// ============================================================================

export interface TestHooks {
  cssSelectors: string[];                         // CSS class names for targeting
  dataTestIds?: string[];                         // data-testid attributes (if present)
  ariaLabels?: string[];                          // aria-label values
  visualLandmarks: VisualLandmark[];              // unique visual markers for snapshot identification
}

export interface VisualLandmark {
  description: string;                            // e.g., "blue 'Send' button in bottom-right"
  cssClass: string;
  uniqueFeature: string;                          // what makes it unique visually
}

// ============================================================================
// Health Checks
// ============================================================================

export interface HealthChecks {
  critical: HealthCheck[];                        // must pass
  warning: HealthCheck[];                         // should pass but non-blocking
  performance: PerformanceCheck[];                // optional performance benchmarks
}

export interface HealthCheck {
  id: string;                                     // unique check ID
  type: HealthCheckType;
  target: string;                                 // what to check
  condition: string;                              // success condition
  failureMode: string;                            // what breaks if this fails
  automationScript?: string;                      // Chrome MCP script to run this check
}

export interface PerformanceCheck {
  metric: 'render-time' | 'bundle-size' | 'memory' | 'interaction-delay';
  threshold: number;
  unit: string;
  description: string;
}

// ============================================================================
// Dependencies
// ============================================================================

export interface Dependencies {
  contexts: string[];                             // context providers it depends on
  hooks: string[];                                // custom hooks it uses
  childComponents: string[];                      // components it renders
  requiredProps: string[];                        // props that must be provided
}

// ============================================================================
// Metadata
// ============================================================================

export interface Metadata {
  lastReviewed: string;                           // ISO date of last contract review
  contractVersion: string;                        // semantic version of contract schema
  notes?: string;                                 // freeform notes for developers
  authored?: string;                              // ISO date contract was created
  updated?: string;                               // ISO date contract was last updated
}
