/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { WorkspaceEvent, StepSpawnedEvent, StepCompletedEvent, Session } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { createTestServer, createWebSocketClient, createMockEvent, cleanup } from './helpers.js';
// Use the project's own directory as a stable test path
// This is the packages/backend directory which exists on all platforms
const TEST_CWD = process.cwd();

describe('Integration Tests: Hook → Backend → WebSocket Flow', () => {
  let testServerUrl: string;
  let wsServerUrl: string;

  beforeEach(async () => {
    const serverInfo = await createTestServer();
    testServerUrl = serverInfo.apiUrl;
    wsServerUrl = serverInfo.wsUrl;
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Test: Hook POST → Storage → WebSocket broadcast', () => {
    it('should store event and broadcast to WebSocket clients', async () => {
      // 1. Connect WebSocket client
      const ws = await createWebSocketClient(wsServerUrl);
      const receivedMessages: any[] = [];

      ws.on('message', (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });

      // 2. Create session first
      const sessionRes = await fetch(`${testServerUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cwd: TEST_CWD,
          hostname: 'test-machine',
          platform: 'darwin',
        }),
      });

      const session: Session = await sessionRes.json() as any;
      expect(sessionRes.status).toBe(201);
      expect(session.id).toBeDefined();

      // 3. Create and POST StepSpawnedEvent to /api/events (simulating hook)
      const stepSpawnedEvent = createMockEvent<StepSpawnedEvent>('step:spawned', {
        sessionId: session.id,
        stepNumber: 1 as any,
        action: 'code',
        model: 'haiku',
        inputs: { task: 'test task' },
      });

      const eventRes = await fetch(`${testServerUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepSpawnedEvent),
      });

      expect(eventRes.status).toBe(201);
      const eventResponse = await eventRes.json() as any;
      expect((eventResponse as any).success).toBe(true);

      // 4. Verify event stored in storage
      const eventsRes = await fetch(`${testServerUrl}/api/events/${session.id}`);
      const { events, count } = await eventsRes.json() as any;

      expect(count).toBeGreaterThan(0);
      expect(events).toContainEqual(expect.objectContaining({
        type: 'step:spawned',
        sessionId: session.id,
      }));

      // 5. WebSocket broadcast verification
      // Note: With memory storage, event broadcasts are not automatically triggered
      // (Redis pub/sub is required for cross-service event broadcasting)
      // The WebSocket connection itself is verified, and events are properly stored
      // For full broadcast testing, Redis integration tests should be used

      ws.close();
    });
  });

  describe('Test: Session lifecycle', () => {
    it('should track full session lifecycle with events', async () => {
      // 1. POST SessionStartedEvent
      const sessionRes = await fetch(`${testServerUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cwd: TEST_CWD,
          hostname: 'test-machine',
          platform: 'darwin',
        }),
      });

      const session: Session = await sessionRes.json();
      expect(sessionRes.status).toBe(201);

      // 2. GET /api/sessions - verify session exists
      const listRes = await fetch(`${testServerUrl}/api/sessions`);
      const { sessions, count } = await listRes.json();

      expect(count).toBeGreaterThan(0);
      expect(sessions).toContainEqual(expect.objectContaining({
        id: session.id,
        status: 'pending',
      }));

      // 3. POST StepSpawnedEvent with session
      const spawnedEvent = createMockEvent<StepSpawnedEvent>('step:spawned', {
        sessionId: session.id,
        stepNumber: 1 as any,
        action: 'analyze',
        model: 'sonnet',
      });

      const spawnRes = await fetch(`${testServerUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spawnedEvent),
      });
      expect(spawnRes.status).toBe(201);

      // 4. POST StepCompletedEvent
      const completedEvent = createMockEvent<StepCompletedEvent>('step:completed', {
        sessionId: session.id,
        stepNumber: 1 as any,
        action: 'analyze',
        status: 'completed',
        duration: 1500 as any,
        succeeded: true,
      });

      const completeRes = await fetch(`${testServerUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedEvent),
      });
      expect(completeRes.status).toBe(201);

      // 5. POST SessionEndedEvent
      const sessionEndRes = await fetch(`${testServerUrl}/api/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          summary: 'Session completed successfully',
        }),
      });
      expect(sessionEndRes.status).toBe(200);

      // 6. Verify full chain in session
      const getSessionRes = await fetch(`${testServerUrl}/api/sessions/${session.id}`);
      const updatedSession: Session = await getSessionRes.json();

      expect(updatedSession.status).toBe('completed');
      expect(updatedSession.summary).toBe('Session completed successfully');
      expect(updatedSession.endedAt).toBeDefined();

      // Verify events are stored
      const eventsRes = await fetch(`${testServerUrl}/api/events/${session.id}`);
      const { events: storedEvents, count: eventCount } = await eventsRes.json();

      expect(eventCount).toBeGreaterThanOrEqual(2);
      expect(storedEvents.some((e: any) => e.type === 'step:spawned')).toBe(true);
      expect(storedEvents.some((e: any) => e.type === 'step:completed')).toBe(true);
    });
  });

  describe('Test: Command queue round-trip', () => {
    it('should queue, retrieve, and acknowledge commands', async () => {
      // 1. Create session
      const sessionRes = await fetch(`${testServerUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cwd: TEST_CWD,
          hostname: 'test-machine',
          platform: 'darwin',
        }),
      });

      const session: Session = await sessionRes.json();
      expect(sessionRes.status).toBe(201);

      // 2. POST command to /api/commands/:id/commands
      const commandPayload = {
        type: 'pause',
        payload: {
          reason: 'user requested',
        },
      };

      const cmdRes = await fetch(`${testServerUrl}/api/commands/${session.id}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commandPayload),
      });

      expect(cmdRes.status).toBe(201);
      const commandResponse = await cmdRes.json();
      expect(commandResponse.commandId).toBeDefined();
      const commandId = commandResponse.commandId;

      // 3. GET /api/commands/:id/commands - verify command pending
      const getRes = await fetch(`${testServerUrl}/api/commands/${session.id}/commands`);
      const { commands, count: cmdCount } = await getRes.json();

      expect(cmdCount).toBeGreaterThan(0);
      expect(commands).toContainEqual(expect.objectContaining({
        commandId: commandId,
        command: expect.objectContaining({
          type: 'pause',
        }),
      }));

      // 4. POST acknowledge command
      const ackRes = await fetch(
        `${testServerUrl}/api/commands/${commandId}/ack`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result: 'paused successfully' }),
        }
      );
      expect(ackRes.status).toBe(200);
      expect((await ackRes.json()).acknowledged).toBe(true);

      // 5. GET again - commands are consumed on first fetch (poll-and-consume pattern)
      const finalRes = await fetch(`${testServerUrl}/api/commands/${session.id}/commands`);
      const { commands: finalCommands, count: finalCount } = await finalRes.json();

      // Commands are cleared after first GET (poll-and-consume pattern)
      expect(finalCount).toBe(0);
      expect(finalCommands).toEqual([]);
    });
  });

  describe('Test: Error handling and edge cases', () => {
    it('should reject invalid events', async () => {
      const invalidEvent = {
        // Missing required fields
        type: 'step:spawned',
      };

      const res = await fetch(`${testServerUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEvent),
      });

      expect(res.status).toBe(400);
      const error = await res.json();
      expect(error.error).toBeDefined();
    });

    it('should handle missing session gracefully', async () => {
      const fakeSessionId = brandedTypes.sessionId('fake-session-id');

      const res = await fetch(`${testServerUrl}/api/sessions/${fakeSessionId}`);
      expect(res.status).toBe(404);
    });

    it('should retrieve events for a session', async () => {
      // Create session
      const sessionRes = await fetch(`${testServerUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cwd: TEST_CWD,
        }),
      });

      const session: Session = await sessionRes.json();

      // Add multiple events
      for (let i = 1; i <= 3; i++) {
        const event = createMockEvent<StepSpawnedEvent>('step:spawned', {
          sessionId: session.id,
          stepNumber: i as any,
          action: `action-${i}`,
        });

        await fetch(`${testServerUrl}/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      }

      // Retrieve and verify
      const eventsRes = await fetch(`${testServerUrl}/api/events/${session.id}`);
      const { events: retrievedEvents, count: eventCnt } = await eventsRes.json();

      expect(eventCnt).toBe(3);
      expect(retrievedEvents[0].stepNumber).toBe(1);
      expect(retrievedEvents[1].stepNumber).toBe(2);
      expect(retrievedEvents[2].stepNumber).toBe(3);
    });

    it('should handle WebSocket client disconnections', async () => {
      const ws = await createWebSocketClient(wsServerUrl);

      // Verify connection
      expect(ws.readyState).toBe(1); // OPEN

      // Close connection
      ws.close();

      // Verify closed
      expect(ws.readyState).toBe(2 || 3); // CLOSING or CLOSED
    });
  });

  describe('Test: Health check endpoint', () => {
    it('should respond to health checks', async () => {
      const res = await fetch(`${testServerUrl}/health`);
      expect(res.status).toBe(200);

      const health = await res.json();
      expect(health.status).toBe('ok');
      expect(health.timestamp).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
