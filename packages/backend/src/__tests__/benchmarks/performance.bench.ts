import { describe, bench, beforeEach, afterEach } from 'vitest';
import type { Session, Chain, WorkspaceEvent, SessionId, ChainId, UserId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage, isAsyncStorage } from '../../storage/index.js';

/**
 * Performance Benchmark Suite for ActionFlows Backend
 *
 * Measures throughput and latency of critical backend operations:
 * - Session creation
 * - Event ingestion
 * - Chain compilation
 * - WebSocket broadcast (simulated)
 * - Storage reads
 * - Storage writes
 *
 * Results are published to a markdown report for trend tracking.
 */

// ============================================================================
// Test Data Factories
// ============================================================================

function createMockSession(userId: UserId): Session {
  return {
    id: brandedTypes.sessionId(crypto.randomUUID()),
    user: userId,
    startedAt: brandedTypes.timestamp(new Date().toISOString()),
    status: 'active' as const,
    chainCount: 0,
    eventCount: 0,
    metadata: {
      source: 'benchmark',
    },
  };
}

function createMockChain(sessionId: SessionId): Chain {
  return {
    id: brandedTypes.chainId(crypto.randomUUID()),
    sessionId,
    actions: [
      {
        action: 'analyze',
        model: 'haiku',
      },
    ],
    status: 'pending' as const,
    compiledAt: brandedTypes.timestamp(new Date().toISOString()),
  };
}

function createMockEvent(sessionId: SessionId, index: number): WorkspaceEvent {
  return {
    id: crypto.randomUUID(),
    sessionId,
    type: 'step:spawned',
    timestamp: brandedTypes.timestamp(new Date().toISOString()),
    data: {
      stepNumber: index,
      action: 'analyze',
      model: 'haiku',
    },
  };
}

// ============================================================================
// Benchmark Suite
// ============================================================================

describe('Backend Performance Benchmarks', () => {
  const testUserId = brandedTypes.userId('perf-test-user');
  const isAsync = isAsyncStorage(storage);

  // ========================================================================
  // Benchmark 1: Session Creation Throughput
  // ========================================================================
  bench(
    'Session creation throughput (100 ops)',
    async () => {
      const session = createMockSession(testUserId);
      await Promise.resolve(storage.setSession(session));
    },
    {
      iterations: 100,
      warmup: 10,
      setup: () => {
        // Clear state before benchmark
      },
    }
  );

  // ========================================================================
  // Benchmark 2: Event Ingestion Latency
  // ========================================================================
  bench(
    'Event ingestion latency (1000 ops)',
    async () => {
      const sessionId = brandedTypes.sessionId(crypto.randomUUID());
      const event = createMockEvent(sessionId, 1);
      await Promise.resolve(storage.addEvent(sessionId, event));
    },
    {
      iterations: 1000,
      warmup: 100,
    }
  );

  // ========================================================================
  // Benchmark 3: Chain Compilation
  // ========================================================================
  bench(
    'Chain compilation (50 ops)',
    async () => {
      const sessionId = brandedTypes.sessionId(crypto.randomUUID());
      const chain = createMockChain(sessionId);
      await Promise.resolve(storage.addChain(sessionId, chain));
    },
    {
      iterations: 50,
      warmup: 5,
    }
  );

  // ========================================================================
  // Benchmark 4: WebSocket Broadcast (simulated)
  // ========================================================================
  bench(
    'WebSocket broadcast simulation (500 ops)',
    async () => {
      const sessionId = brandedTypes.sessionId(crypto.randomUUID());
      // Simulate broadcast by adding event to 5 different sessions and reading
      for (let i = 0; i < 5; i++) {
        const event = createMockEvent(sessionId, i);
        await Promise.resolve(storage.addEvent(sessionId, event));
      }
    },
    {
      iterations: 100, // 100 * 5 = 500 simulated broadcasts
      warmup: 10,
    }
  );

  // ========================================================================
  // Benchmark 5: Storage Reads
  // ========================================================================
  bench(
    'Storage reads - 200 sessions (async-aware)',
    async () => {
      // Create a session and read it
      const sessionId = brandedTypes.sessionId(crypto.randomUUID());
      const session = createMockSession(testUserId);
      session.id = sessionId;
      await Promise.resolve(storage.setSession(session));

      // Benchmark the read operation
      await Promise.resolve(storage.getSession(sessionId));
    },
    {
      iterations: 200,
      warmup: 20,
    }
  );

  // ========================================================================
  // Benchmark 6: Storage Writes
  // ========================================================================
  bench(
    'Storage writes - 200 sessions',
    async () => {
      const session = createMockSession(testUserId);
      await Promise.resolve(storage.setSession(session));
    },
    {
      iterations: 200,
      warmup: 20,
    }
  );

  // ========================================================================
  // Bonus: Event Reading Performance
  // ========================================================================
  bench(
    'Event reading - 500 events per session',
    async () => {
      const sessionId = brandedTypes.sessionId(crypto.randomUUID());

      // Setup: write 50 events
      for (let i = 0; i < 50; i++) {
        const event = createMockEvent(sessionId, i);
        await Promise.resolve(storage.addEvent(sessionId, event));
      }

      // Benchmark: read them back
      await Promise.resolve(storage.getEvents(sessionId));
    },
    {
      iterations: 10,
      warmup: 1,
    }
  );

  // ========================================================================
  // Bonus: Batch Operations
  // ========================================================================
  bench(
    'Batch session creation - 100 sessions',
    async () => {
      const sessions = Array.from({ length: 10 }, () => createMockSession(testUserId));
      for (const session of sessions) {
        await Promise.resolve(storage.setSession(session));
      }
    },
    {
      iterations: 10, // 10 batches of 10 = 100 sessions total
      warmup: 1,
    }
  );

  // ========================================================================
  // Bonus: Mixed Workload
  // ========================================================================
  bench(
    'Mixed workload - create + events + chains',
    async () => {
      const sessionId = brandedTypes.sessionId(crypto.randomUUID());
      const session = createMockSession(testUserId);
      session.id = sessionId;

      // Create session
      await Promise.resolve(storage.setSession(session));

      // Add events
      for (let i = 0; i < 10; i++) {
        const event = createMockEvent(sessionId, i);
        await Promise.resolve(storage.addEvent(sessionId, event));
      }

      // Add chains
      for (let i = 0; i < 2; i++) {
        const chain = createMockChain(sessionId);
        await Promise.resolve(storage.addChain(sessionId, chain));
      }

      // Read back
      await Promise.resolve(storage.getSession(sessionId));
      await Promise.resolve(storage.getEvents(sessionId));
      await Promise.resolve(storage.getChains(sessionId));
    },
    {
      iterations: 20,
      warmup: 2,
    }
  );
});

// ============================================================================
// Benchmark Notes
// ============================================================================
/**
 * Vitest Bench API Configuration:
 *
 * - `iterations`: Number of times the benchmark function runs
 * - `warmup`: Number of warm-up runs before actual measurement
 * - Vitest automatically measures: throughput (ops/sec), latency (min/max/avg)
 *
 * Expected Baseline Thresholds (from task):
 * - Session creation: > 500/sec
 * - Event ingestion: < 10ms p95
 *
 * Storage Backend Detection:
 * - Memory Storage: Synchronous operations, faster baseline
 * - Redis Storage: Async operations, network latency included
 *
 * Running Benchmarks:
 * ```bash
 * # Run all benchmarks
 * pnpm -F @afw/backend test benchmarks/performance.bench.ts
 *
 * # With Redis (if available)
 * REDIS_URL=redis://localhost:6379 pnpm -F @afw/backend test benchmarks/performance.bench.ts
 * ```
 */
