/**
 * Cyclic Dependency Detector
 *
 * Detects cycles in routing rules (A → B and B → A)
 * and action dependencies (A depends on B, B depends on A).
 * Uses depth-first search (DFS) with recursion stack tracking.
 */

import type { RoutingRule, ActionMetadata } from './routingValidator.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a directed graph for cycle detection
 */
type DependencyGraph = Map<string, Set<string>>;

/**
 * Result of cycle detection analysis
 */
export interface CycleDetectionResult {
  hasCycles: boolean;
  cycles: string[][]; // Each cycle as an array of nodes
  acyclicGraph: boolean;
}

/**
 * Result of routing graph analysis
 */
export interface RoutingGraphAnalysis extends CycleDetectionResult {
  nodeCount: number;
  edgeCount: number;
  isolated: string[]; // Nodes with no incoming/outgoing edges
}

// ============================================================================
// Graph Building Functions
// ============================================================================

/**
 * Build a routing graph from rules
 * Nodes are actions, edges are rule routing paths
 * @param rules - Routing rules to analyze
 * @returns Directed graph as adjacency map
 */
export function buildRoutingGraph(rules: RoutingRule[]): DependencyGraph {
  const graph = new Map<string, Set<string>>();

  for (const rule of rules) {
    // Ensure action node exists
    if (!graph.has(rule.action)) {
      graph.set(rule.action, new Set());
    }

    // Add edge from action to fallback (if present)
    if (rule.fallback) {
      if (!graph.has(rule.fallback)) {
        graph.set(rule.fallback, new Set());
      }
      graph.get(rule.action)!.add(rule.fallback);
    }
  }

  return graph;
}

/**
 * Build a dependency graph from action metadata
 * Nodes are actions, edges are dependencies
 * @param metadata - Action metadata to analyze
 * @returns Directed graph as adjacency map
 */
export function buildDependencyGraph(
  metadata: ActionMetadata[]
): DependencyGraph {
  const graph = new Map<string, Set<string>>();

  // Initialize all nodes
  for (const m of metadata) {
    if (!graph.has(m.action)) {
      graph.set(m.action, new Set());
    }
  }

  // Add dependency edges
  for (const m of metadata) {
    for (const dependency of m.dependencies) {
      if (!graph.has(dependency)) {
        graph.set(dependency, new Set());
      }
      graph.get(m.action)!.add(dependency);
    }
  }

  return graph;
}

// ============================================================================
// Cycle Detection (DFS)
// ============================================================================

/**
 * Detect cycles in a directed graph using DFS
 * @param graph - Dependency graph to analyze
 * @returns Cycles found (empty array if acyclic)
 */
export function detectCycles(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  /**
   * DFS helper to find cycles
   * @param node - Current node
   * @param path - Path from start node to current
   */
  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || new Set();

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        // Continue DFS to unvisited neighbor
        dfs(neighbor, path);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle: path + neighbor back to start
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart).concat([neighbor]);
        cycles.push(cycle);
      }
    }

    recursionStack.delete(node);
    path.pop();
  }

  // Run DFS from each unvisited node
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

// ============================================================================
// Specific Detectors
// ============================================================================

/**
 * Check for cycles in routing rules
 * @param rules - Rules to check
 * @returns Detection result with any cycles found
 */
export function checkRoutingCycles(rules: RoutingRule[]): CycleDetectionResult {
  const graph = buildRoutingGraph(rules);
  const cycles = detectCycles(graph);

  return {
    hasCycles: cycles.length > 0,
    cycles,
    acyclicGraph: cycles.length === 0,
  };
}

/**
 * Check for cycles in action dependencies
 * @param metadata - Action metadata to check
 * @returns Detection result with any cycles found
 */
export function checkDependencyCycles(
  metadata: ActionMetadata[]
): CycleDetectionResult {
  const graph = buildDependencyGraph(metadata);
  const cycles = detectCycles(graph);

  return {
    hasCycles: cycles.length > 0,
    cycles,
    acyclicGraph: cycles.length === 0,
  };
}

// ============================================================================
// Graph Analysis
// ============================================================================

/**
 * Analyze a routing graph for cycles and topology
 * @param rules - Routing rules to analyze
 * @returns Complete analysis including cycles and statistics
 */
export function analyzeRoutingGraph(rules: RoutingRule[]): RoutingGraphAnalysis {
  const graph = buildRoutingGraph(rules);
  const cycles = detectCycles(graph);

  // Count edges
  let edgeCount = 0;
  for (const edges of graph.values()) {
    edgeCount += edges.size;
  }

  // Find isolated nodes (no incoming or outgoing edges)
  const hasOutgoing = new Set(graph.keys());
  const hasIncoming = new Set<string>();

  for (const edges of graph.values()) {
    for (const edge of edges) {
      hasIncoming.add(edge);
    }
  }

  const isolated: string[] = [];
  for (const node of graph.keys()) {
    if (!hasOutgoing.has(node) && !hasIncoming.has(node)) {
      isolated.push(node);
    }
  }

  return {
    nodeCount: graph.size,
    edgeCount,
    isolated,
    hasCycles: cycles.length > 0,
    cycles,
    acyclicGraph: cycles.length === 0,
  };
}

/**
 * Find all paths from a source to destination node
 * Useful for understanding routing chains
 * @param graph - Dependency graph
 * @param source - Starting node
 * @param destination - Target node
 * @param maxDepth - Maximum path length (prevents infinite loops)
 * @returns All paths from source to destination
 */
export function findPaths(
  graph: DependencyGraph,
  source: string,
  destination: string,
  maxDepth: number = 10
): string[][] {
  const paths: string[][] = [];

  function dfs(node: string, path: string[], depth: number): void {
    if (depth > maxDepth) return;

    if (node === destination) {
      paths.push([...path, node]);
      return;
    }

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        // Avoid infinite loops
        dfs(neighbor, [...path, node], depth + 1);
      }
    }
  }

  dfs(source, [], 0);
  return paths;
}

/**
 * Get topological sort of acyclic graph
 * Useful for understanding action execution order
 * @param graph - Acyclic dependency graph
 * @returns Nodes in topological order (dependencies before dependents)
 */
export function topologicalSort(graph: DependencyGraph): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function dfs(node: string): void {
    if (visited.has(node)) return;
    visited.add(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      dfs(neighbor);
    }

    result.push(node);
  }

  // Process all nodes
  for (const node of graph.keys()) {
    dfs(node);
  }

  return result.reverse();
}

// ============================================================================
// Validation & Reporting
// ============================================================================

/**
 * Format cycle detection results for human reading
 * @param result - CycleDetectionResult from detector
 * @returns Formatted string for logs/reports
 */
export function formatCycleDetectionResult(result: CycleDetectionResult): string {
  if (result.acyclicGraph) {
    return 'No cycles detected. Graph is acyclic.';
  }

  const lines = [
    `Found ${result.cycles.length} cycle(s):`,
    '',
  ];

  for (const cycle of result.cycles) {
    const cycleStr = cycle.join(' → ');
    lines.push(`  ${cycleStr}`);
  }

  return lines.join('\n');
}

/**
 * Format full routing graph analysis
 * @param analysis - RoutingGraphAnalysis from analyzer
 * @returns Formatted string for logs/reports
 */
export function formatRoutingGraphAnalysis(
  analysis: RoutingGraphAnalysis
): string {
  const lines = [
    `Routing Graph Analysis`,
    `=====================`,
    `Nodes (actions): ${analysis.nodeCount}`,
    `Edges (routes): ${analysis.edgeCount}`,
    `Status: ${analysis.acyclicGraph ? '✅ Acyclic' : '❌ Has cycles'}`,
    '',
  ];

  if (analysis.isolated.length > 0) {
    lines.push(`Isolated nodes (no routing): ${analysis.isolated.join(', ')}`);
    lines.push('');
  }

  if (!analysis.acyclicGraph) {
    lines.push(`Cycles detected: ${analysis.cycles.length}`);
    for (const cycle of analysis.cycles) {
      lines.push(`  → ${cycle.join(' → ')}`);
    }
  }

  return lines.join('\n');
}
