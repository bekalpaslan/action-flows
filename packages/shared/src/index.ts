/**
 * Shared types and interfaces for ActionFlows Dashboard
 *
 * This package provides comprehensive TypeScript interfaces for:
 * - Base types and branded strings (types.ts)
 * - Event system types (events.ts)
 * - Domain models (models.ts)
 * - Command types (commands.ts)
 *
 * All events support null-safe parsed fields for graceful degradation
 * when Claude output doesn't follow expected format.
 */

// ============================================================================
// Base Types & Branded Strings
// ============================================================================
export type {
  SessionId,
  ChainId,
  StepId,
  StepNumber,
  UserId,
  Timestamp,
  RegionId,
  EdgeId,
  StatusString,
  ModelString,
  ChainSourceString,
  DurationMs,
  FreshnessGrade,
  FreshnessMetadata,
  TelemetryLevel,
  TelemetryEntry,
  TelemetryQueryFilter,
  CircuitState,
  CircuitBreakerStats,
  LifecyclePhase,
  LifecycleEvent,
  LifecyclePolicy,
} from './types.js';

export { Status, Model, ChainSource, brandedTypes, duration, FRESHNESS_THRESHOLDS, calculateFreshnessGrade } from './types.js';

// ============================================================================
// Gate Checkpoint Tracing Types
// ============================================================================
export type {
  GateTrace,
  GateTraceLevel,
  GateId,
  GateStats,
  GateTraceFilter,
} from './gateTrace.js';

// ============================================================================
// Event Types
// ============================================================================
export type {
  BaseEvent,
  SessionStartedEvent,
  SessionEndedEvent,
  ChainCompiledEvent,
  ChainStepSnapshot,
  ChainStartedEvent,
  ChainCompletedEvent,
  StepSpawnedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  StepSkippedEvent,
  FileChange,
  AwaitingInputEvent,
  InputReceivedEvent,
  FileCreatedEvent,
  FileModifiedEvent,
  FileDeletedEvent,
  RegistryLineUpdatedEvent,
  RegistryChangedEvent,
  ExecutionLogCreatedEvent,
  TerminalOutputEvent,
  ClaudeCliStartedEvent,
  ClaudeCliOutputEvent,
  ClaudeCliExitedEvent,
  ChatMessageEvent,
  ChatHistoryEvent,
  ErrorOccurredEvent,
  WarningOccurredEvent,
  SessionFollowedEvent,
  SessionUnfollowedEvent,
  QuickActionTriggeredEvent,
  FlowNodeClickedEvent,
  PatternDetectedEvent,
  FrequencyUpdatedEvent,
  BookmarkCreatedEvent,
  HarmonyCheckEvent,
  HarmonyViolationEvent,
  HarmonyMetricsUpdatedEvent,
  UniverseInitializedEvent,
  RegionDiscoveredEvent,
  EvolutionTickEvent,
  SparkTravelingEvent,
  GateUpdatedEvent,
  WorkspaceEvent,
} from './events.js';

export { eventGuards } from './events.js';

// ============================================================================
// Domain Models
// ============================================================================
export type {
  ChainStep,
  Chain,
  Session,
  ExecutionPlan,
  ExecutionPlanStep,
  ActionRegistryEntry,
  InputDefinition,
  FlowDefinition,
  ExecutionMetrics,
  ChainTemplate,
  ChainTemplateStep,
  TemplateParameter,
  ClaudeCliSession,
  ChatMessage,
  DiscoveredClaudeSession,
  DiscoveredSessionEnrichment,
  RespectComponentType,
  RespectViolationType,
  RespectViolation,
  RespectComponentResult,
  RespectCheckResult,
} from './models.js';

// ============================================================================
// Commands
// ============================================================================
export type {
  Command,
  PauseCommand,
  ResumeCommand,
  CancelCommand,
  AbortCommand,
  RetryCommand,
  SkipCommand,
  ClaudeCliStartCommand,
  ClaudeCliSendInputCommand,
  ClaudeCliStopCommand,
  CommandPayload,
  CommandResult,
} from './commands.js';

export { CommandType, commandGuards, CommandValidator, CommandBuilder } from './commands.js';

// ============================================================================
// Session Window System Types
// ============================================================================
export type {
  SessionWindowState,
  SessionWindowConfig,
  QuickActionDefinition,
  QuickActionPreset,
  PromptType,
  FlowNodeData,
  FlowEdgeData,
  SessionWindowLayout,
  SessionLifecycleState,
} from './sessionWindows.js';

// ============================================================================
// Project Registry Types
// ============================================================================
export type {
  ProjectId,
  Project,
  ProjectAutoDetectionResult,
} from './projects.js';

// ============================================================================
// Self-Evolving System Types
// ============================================================================
export type {
  BehaviorPackId,
  LayerSource,
} from './selfEvolvingTypes.js';

// ============================================================================
// Button System Types
// ============================================================================
export type {
  ButtonId,
  ButtonActionType,
  ButtonAction,
  ButtonContext,
  ButtonDefinition,
  ButtonState,
  ToolbarSlot,
  ToolbarConfig,
} from './buttonTypes.js';

// ============================================================================
// Pattern & Bookmark Types
// ============================================================================
export type {
  BookmarkId,
  PatternId,
  BookmarkCategory,
  Bookmark,
  PatternType,
  ConfidenceScore,
  ActionSequence,
  DetectedPattern,
  PatternAction,
  FrequencyRecord,
  FrequencyQuery,
  BookmarkCluster,
} from './patternTypes.js';

// ============================================================================
// Registry Types
// ============================================================================
export type {
  RegistryEntryId,
  RegistryEntryType,
  RegistryEntryStatus,
  WorkflowDefinition,
  ShortcutDefinition,
  CustomPromptDefinition,
  ModifierDefinition,
  RegistryEntry,
  PackCompatibility,
  BehaviorPack,
  ResolvedBehavior,
  RegistryConflict,
  RegistryFilter,
} from './registryTypes.js';

// ============================================================================
// Reminder Types
// ============================================================================
export type {
  ReminderDefinition,
  ReminderInstance,
  ReminderVariant,
} from './reminderTypes.js';

// ============================================================================
// Error Announcement Types
// ============================================================================
export type {
  ErrorInstance,
  ErrorRecoveryAction,
  ErrorSeverity,
  CreateErrorInput,
} from './errorTypes.js';

// ============================================================================
// Harmony Detection Types
// ============================================================================
export type {
  HarmonyResult,
  HarmonyCheck,
  HarmonyMetrics,
  HarmonyFilter,
} from './harmonyTypes.js';

// ============================================================================
// Workbench System Types
// ============================================================================
export type {
  WorkbenchId,
  StarId,
  ToolId,
  HarmonySpace,
  NavigationTarget,
  WorkbenchConfig,
  StarConfig,
  ToolConfig,
  HarmonyConfig,
  WorkbenchState,
  WorkbenchNotification,
  SessionWorkbenchTag,
} from './workbenchTypes.js';

export {
  WORKBENCH_IDS,
  STAR_IDS,
  TOOL_IDS,
  NAVIGATION_TARGETS,
  STAR_CONFIGS,
  TOOL_CONFIGS,
  HARMONY_CONFIG,
  DEFAULT_WORKBENCH_CONFIGS,
  getWorkbenchForSessionTag,
  getSessionCapableWorkbenches,
  ROUTABLE_WORKBENCHES,
  isRoutable,
  isStarId,
  isToolId,
  isHarmonySpace,
  isNavigationTarget,
} from './workbenchTypes.js';

// ============================================================================
// Intel Dossier Types
// ============================================================================
export type {
  DossierId,
  SuggestionId,
  WidgetType,
  LayoutType,
  WidgetDescriptor,
  LayoutDescriptor,
  DossierStatus,
  DossierHistoryEntry,
  IntelDossier,
  SuggestionEntry,
} from './dossierTypes.js';

export { createDossierId, createSuggestionId } from './dossierTypes.js';

// ============================================================================
// Routing Types
// ============================================================================
export type {
  RoutingResult,
  DisambiguationRequest,
  RoutingDecision,
} from './routingTypes.js';

export { ROUTING_THRESHOLDS } from './routingTypes.js';

// ============================================================================
// Control Panel Types
// ============================================================================
export type {
  QuickCommand,
  QuickCommandAction,
  FlowAction,
  ControlPanelConfig,
} from './controlPanelTypes.js';

export {
  DEFAULT_QUICK_COMMANDS,
  DEFAULT_CONTROL_PANEL_CONFIG,
} from './controlPanelTypes.js';

// ============================================================================
// Hierarchical Notification Types
// ============================================================================
export type {
  NotificationLevel,
  NotificationSource,
  NotificationEvent,
  PropagationPath,
  NotificationState,
} from './notificationTypes.js';

export {
  NOTIFICATION_GLOW_COLORS,
  NOTIFICATION_GLOW_INTENSITIES,
  createNotification,
  createPropagationPath,
  aggregateNotificationState,
} from './notificationTypes.js';

// ============================================================================
// Orchestrator Output Contract
// ============================================================================
export * from './contract/index.js';

// ============================================================================
// Living Universe Types
// ============================================================================
export type {
  RegionNode,
  LightBridge,
  GateCheckpoint,
  MoonOrbit,
  SparkParticle,
  TraceAccumulation,
  TraceEntry,
  ColorShift,
  HealthMetrics,
  DiscoveryTrigger,
  DiscoveryCondition,
  EvolutionTick,
  EvolutionType,
  UniverseGraph,
  UniverseMetadata,
} from './universeTypes.js';

export { FogState } from './universeTypes.js';

export { createDefaultUniverse, DEFAULT_UNIVERSE } from './defaultUniverse.js';

// ============================================================================
// Chain-to-Region Mapping
// ============================================================================
export {
  mapActionToRegion,
  mapChainToBridges,
  getChainRegions,
  validateMapping,
  ACTION_TO_REGION_MAP,
  DEFAULT_REGION,
} from './chainRegionMapping.js';

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================

/**
 * Hook execution event (legacy)
 */
export interface HookExecutionEvent {
  id: string;
  timestamp: number;
  hookName: string;
  status: 'pending' | 'success' | 'failure';
  data: Record<string, unknown>;
}

/**
 * WebSocket message types (legacy)
 */
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

/**
 * Agent task interface (legacy)
 */
export interface AgentTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  result?: unknown;
  error?: string;
}

/**
 * Hook definition interface (legacy)
 */
export interface HookDefinition {
  name: string;
  event: string;
  script: string;
  enabled: boolean;
}

export type { HookExecutionEvent as HookEvent };
