/**
 * Analytics Aggregation Service (GAP-28)
 * Aggregates telemetry into time-buckets (1min, 5min, 1hour, daily)
 * Calculates: flow usage frequency, agent performance metrics, step success rates
 * Stores aggregated stats in Storage
 */

import type {
  AnalyticsData,
  FlowAnalytics,
  AgentAnalytics,
  SystemAnalyticsSummary,
  Timestamp,
} from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import type { TelemetryEntry } from '@afw/shared';

/**
 * Time bucket enum
 */
export type TimeBucket = 'minute' | '5min' | 'hour' | 'day';

/**
 * Analytics Aggregator Service
 * Processes telemetry and generates aggregated statistics
 */
export class AnalyticsAggregator {
  private aggregatedData: Map<string, AnalyticsData> = new Map();
  private flowMetrics: Map<string, FlowAnalytics> = new Map();
  private agentMetrics: Map<string, AgentAnalytics> = new Map();
  private systemSummary: SystemAnalyticsSummary | null = null;

  /**
   * Generate bucket key for a given timestamp and bucket type
   */
  private getBucketKey(timestamp: Timestamp, bucket: TimeBucket): string {
    const date = new Date(timestamp);

    switch (bucket) {
      case 'minute': {
        date.setSeconds(0, 0);
        return `minute:${date.toISOString()}`;
      }
      case '5min': {
        const minutes = Math.floor(date.getMinutes() / 5) * 5;
        date.setMinutes(minutes, 0, 0);
        return `5min:${date.toISOString()}`;
      }
      case 'hour': {
        date.setMinutes(0, 0, 0);
        return `hour:${date.toISOString()}`;
      }
      case 'day': {
        date.setHours(0, 0, 0, 0);
        return `day:${date.toISOString()}`;
      }
    }
  }

  /**
   * Get the end time for a bucket
   */
  private getBucketEndTime(startTime: Timestamp, bucket: TimeBucket): Timestamp {
    const date = new Date(startTime);

    switch (bucket) {
      case 'minute':
        date.setMinutes(date.getMinutes() + 1);
        break;
      case '5min':
        date.setMinutes(date.getMinutes() + 5);
        break;
      case 'hour':
        date.setHours(date.getHours() + 1);
        break;
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
    }

    return date.toISOString() as Timestamp;
  }

  /**
   * Aggregate telemetry entries into time buckets
   */
  aggregateTelemetry(entries: TelemetryEntry[], bucket: TimeBucket): AnalyticsData[] {
    const buckets = new Map<string, {
      sessions: Set<string>;
      chains: Set<string>;
      steps: number;
      successful: number;
      failed: number;
      durations: number[];
      startTime: Timestamp;
    }>();

    // Process each entry
    for (const entry of entries) {
      const bucketKey = this.getBucketKey(entry.timestamp, bucket);

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          sessions: new Set(),
          chains: new Set(),
          steps: 0,
          successful: 0,
          failed: 0,
          durations: [],
          startTime: entry.timestamp,
        });
      }

      const data = buckets.get(bucketKey)!;

      // Track sessions and chains from metadata
      if (entry.metadata) {
        if (entry.metadata.sessionId) {
          data.sessions.add(String(entry.metadata.sessionId));
        }
        if (entry.metadata.chainId) {
          data.chains.add(String(entry.metadata.chainId));
        }
        if (entry.metadata.stepCount) {
          data.steps += Number(entry.metadata.stepCount);
        }
        if (entry.metadata.duration) {
          data.durations.push(Number(entry.metadata.duration));
        }
      }

      // Count successes/failures from log level
      if (entry.level === 'error') {
        data.failed++;
      } else if (entry.level === 'info') {
        data.successful++;
      }
    }

    // Convert buckets to AnalyticsData
    const results: AnalyticsData[] = [];
    for (const [key, data] of buckets.entries()) {
      const totalSteps = data.steps || 1; // Avoid division by zero
      const avgDuration = data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0;

      const successRate = (data.successful / (data.successful + data.failed)) * 100 || 0;

      results.push({
        bucket,
        startTime: data.startTime,
        endTime: this.getBucketEndTime(data.startTime, bucket),
        totalSessions: data.sessions.size,
        totalChains: data.chains.size,
        totalSteps: totalSteps,
        successfulSteps: data.successful,
        failedSteps: data.failed,
        successRate: Math.round(successRate * 100) / 100,
        avgChainDuration: Math.round(avgDuration),
        avgStepDuration: Math.round(avgDuration / Math.max(1, totalSteps)),
      });
    }

    return results.sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  /**
   * Calculate per-flow metrics
   */
  calculateFlowMetrics(entries: TelemetryEntry[]): FlowAnalytics[] {
    const flows = new Map<string, {
      count: number;
      successful: number;
      failed: number;
      durations: number[];
      steps: number[];
      lastExecuted?: Timestamp;
      firstExecuted?: Timestamp;
      name: string;
    }>();

    for (const entry of entries) {
      if (!entry.metadata?.flowId) continue;

      const flowId = String(entry.metadata.flowId);
      if (!flows.has(flowId)) {
        flows.set(flowId, {
          count: 0,
          successful: 0,
          failed: 0,
          durations: [],
          steps: [],
          name: String(entry.metadata.flowName || flowId),
        });
      }

      const flow = flows.get(flowId)!;
      flow.count++;

      if (entry.level !== 'error') {
        flow.successful++;
      } else {
        flow.failed++;
      }

      if (entry.metadata.duration) {
        flow.durations.push(Number(entry.metadata.duration));
      }
      if (entry.metadata.stepCount) {
        flow.steps.push(Number(entry.metadata.stepCount));
      }

      // Track first and last execution times
      if (!flow.firstExecuted || new Date(entry.timestamp) < new Date(flow.firstExecuted)) {
        flow.firstExecuted = entry.timestamp;
      }
      if (!flow.lastExecuted || new Date(entry.timestamp) > new Date(flow.lastExecuted)) {
        flow.lastExecuted = entry.timestamp;
      }
    }

    // Convert to FlowAnalytics
    const results: FlowAnalytics[] = [];
    for (const [flowId, data] of flows.entries()) {
      const successRate = data.successful / data.count;
      const avgDuration = data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0;
      const avgSteps = data.steps.length > 0
        ? Math.round(data.steps.reduce((a, b) => a + b, 0) / data.steps.length)
        : 0;
      const totalDuration = data.durations.reduce((a, b) => a + b, 0);

      results.push({
        flowId,
        flowName: data.name,
        usageCount: data.count,
        successRate: Math.round(successRate * 100) / 100,
        averageDuration: avgDuration,
        totalDuration,
        avgStepsPerExecution: avgSteps,
        lastExecutedAt: data.lastExecuted,
        firstExecutedAt: data.firstExecuted,
      });
    }

    return results.sort((a, b) => b.executionCount - a.executionCount);
  }

  /**
   * Calculate per-agent metrics
   */
  calculateAgentMetrics(entries: TelemetryEntry[]): AgentAnalytics[] {
    const agents = new Map<string, {
      count: number;
      successful: number;
      failed: number;
      durations: number[];
      lastUsed?: Timestamp;
      firstUsed?: Timestamp;
    }>();

    for (const entry of entries) {
      if (!entry.metadata?.agentName) continue;

      const agentName = String(entry.metadata.agentName);
      if (!agents.has(agentName)) {
        agents.set(agentName, {
          count: 0,
          successful: 0,
          failed: 0,
          durations: [],
        });
      }

      const agent = agents.get(agentName)!;
      agent.count++;

      if (entry.level !== 'error') {
        agent.successful++;
      } else {
        agent.failed++;
      }

      if (entry.metadata.duration) {
        agent.durations.push(Number(entry.metadata.duration));
      }

      // Track first and last usage times
      if (!agent.firstUsed || new Date(entry.timestamp) < new Date(agent.firstUsed)) {
        agent.firstUsed = entry.timestamp;
      }
      if (!agent.lastUsed || new Date(entry.timestamp) > new Date(agent.lastUsed)) {
        agent.lastUsed = entry.timestamp;
      }
    }

    // Convert to AgentAnalytics
    const results: AgentAnalytics[] = [];
    for (const [agentName, data] of agents.entries()) {
      const successRate = data.successful / data.count;
      const avgDuration = data.durations.length > 0
        ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
        : 0;

      results.push({
        agentId: agentName,
        tasksCompleted: data.count,
        successRate: Math.round(successRate * 100) / 100,
        averageDuration: avgDuration,
        errorCount: data.failed,
        lastActive: data.lastUsed,
        firstUsedAt: data.firstUsed,
      });
    }

    return results.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
  }

  /**
   * Calculate system summary statistics
   */
  calculateSystemSummary(entries: TelemetryEntry[]): SystemAnalyticsSummary {
    const sessions = new Set<string>();
    const chains = new Set<string>();
    let totalSteps = 0;
    let successful = 0;
    let failed = 0;
    const durations: number[] = [];
    const now = new Date();
    const day24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day7dAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let sessions24h = 0;
    let sessions7d = 0;

    const flowCounts = new Map<string, number>();
    const agentCounts = new Map<string, number>();

    for (const entry of entries) {
      if (entry.metadata?.sessionId) {
        sessions.add(String(entry.metadata.sessionId));
        const entryDate = new Date(entry.timestamp);
        if (entryDate >= day24hAgo) sessions24h++;
        if (entryDate >= day7dAgo) sessions7d++;
      }

      if (entry.metadata?.chainId) {
        chains.add(String(entry.metadata.chainId));
      }

      if (entry.metadata?.stepCount) {
        totalSteps += Number(entry.metadata.stepCount);
      }

      if (entry.level !== 'error') {
        successful++;
      } else {
        failed++;
      }

      if (entry.metadata?.duration) {
        durations.push(Number(entry.metadata.duration));
      }

      // Track top flows and agents
      if (entry.metadata?.flowId) {
        const flowId = String(entry.metadata.flowId);
        flowCounts.set(flowId, (flowCounts.get(flowId) || 0) + 1);
      }
      if (entry.metadata?.agentName) {
        const agentName = String(entry.metadata.agentName);
        agentCounts.set(agentName, (agentCounts.get(agentName) || 0) + 1);
      }
    }

    const successRate = (successful / (successful + failed)) || 0;
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    // Find top flow and agent
    let topFlow: string | undefined;
    let topFlowCount = 0;
    for (const [flowId, count] of flowCounts.entries()) {
      if (count > topFlowCount) {
        topFlow = flowId;
        topFlowCount = count;
      }
    }

    let topAgent: string | undefined;
    let topAgentCount = 0;
    for (const [agentName, count] of agentCounts.entries()) {
      if (count > topAgentCount) {
        topAgent = agentName;
        topAgentCount = count;
      }
    }

    return {
      totalSessions: sessions.size,
      totalChains: chains.size,
      totalSteps,
      overallSuccessRate: Math.round(successRate * 100) / 100,
      avgChainDuration: avgDuration,
      topFlow,
      topAgent,
      sessionCount24h: sessions24h,
      sessionCount7d: sessions7d,
      lastUpdatedAt: new Date().toISOString() as Timestamp,
    };
  }
}

/**
 * Global analytics aggregator instance
 */
export const analyticsAggregator = new AnalyticsAggregator();
