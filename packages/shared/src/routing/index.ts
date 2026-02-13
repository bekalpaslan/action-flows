/**
 * Routing Infrastructure
 *
 * Exports for orchestrator routing system:
 * - Validators for rules and metadata
 * - Routing algorithm for action selection
 * - Cyclic dependency detection
 */

// Validators
export {
  validateRoutingRule,
  validateRoutingRules,
  validateActionMetadata,
  validateActionMetadataArray,
  validateRuleActions,
  validateMetadataDependencies,
  validateRulePriorities,
} from './routingValidator.js';
export type {
  ConfidenceLevel,
  Context,
  RoutingCondition,
  RoutingRule,
  ScopePreference,
  ActionTriggers,
  ActionMetadata,
} from './routingValidator.js';

// Routing Algorithm
export {
  calculateMatchScore,
  applyConfidenceThreshold,
  selectAction,
  getApplicableRules,
  scoreAllRules,
  formatRoutingDecision,
} from './routingAlgorithm.js';
export type { RoutingDecision } from './routingAlgorithm.js';

// Cyclic Dependency Detection
export {
  buildRoutingGraph,
  buildDependencyGraph,
  detectCycles,
  checkRoutingCycles,
  checkDependencyCycles,
  analyzeRoutingGraph,
  findPaths,
  topologicalSort,
  formatCycleDetectionResult,
  formatRoutingGraphAnalysis,
} from './cyclicDependencyDetector.js';
export type {
  CycleDetectionResult,
  RoutingGraphAnalysis,
} from './cyclicDependencyDetector.js';
