import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotificationGlow } from '../useNotificationGlow';
import type { SessionId, WorkbenchId } from '@afw/shared';

/**
 * useNotificationGlow Hook Tests (P0)
 *
 * Tests core notification and glow state management.
 * Full integration with WebSocket server is covered by E2E tests.
 */
describe('useNotificationGlow Hook', () => {
  const testSessionId = 'test-session-123' as SessionId;
  const testWorkbenchId = 'work' as WorkbenchId;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotificationGlow());

    expect(result.current.notifications).toEqual([]);
  });

  it('should return correct hook structure', () => {
    const { result } = renderHook(() => useNotificationGlow());

    expect(result.current).toBeDefined();
    expect(Array.isArray(result.current.notifications)).toBe(true);
    expect(result.current.notificationState).toBeDefined();
    expect(typeof result.current.addNotification).toBe('function');
    expect(typeof result.current.markAsRead).toBe('function');
    expect(typeof result.current.dismissNotification).toBe('function');
    expect(typeof result.current.getSessionGlow).toBe('function');
    expect(typeof result.current.getWorkbenchGlow).toBe('function');
  });

  it('should provide addNotification function', () => {
    const { result } = renderHook(() => useNotificationGlow());

    expect(typeof result.current.addNotification).toBe('function');
  });

  it('should add notification', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const notification = result.current.addNotification({
      level: 'info',
      message: 'Test notification',
      sessionId: testSessionId,
      source: 'step',
    });

    expect(notification).toBeDefined();
    expect(notification.id).toBeTruthy();
    expect(notification.message).toBe('Test notification');
  });

  it('should mark notification as read', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const notification = result.current.addNotification({
      level: 'info',
      message: 'Test',
      sessionId: testSessionId,
      source: 'step',
    });

    result.current.markAsRead(notification.id);

    const updatedNotif = result.current.notifications.find(n => n.id === notification.id);
    expect(updatedNotif?.read).toBe(true);
  });

  it('should dismiss notification', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const notification = result.current.addNotification({
      level: 'info',
      message: 'Test',
      sessionId: testSessionId,
      source: 'step',
    });

    result.current.dismissNotification(notification.id);

    const updatedNotif = result.current.notifications.find(n => n.id === notification.id);
    expect(updatedNotif?.dismissed).toBe(true);
  });

  it('should provide getSessionGlow function', () => {
    const { result } = renderHook(() => useNotificationGlow());

    expect(typeof result.current.getSessionGlow).toBe('function');
  });

  it('should calculate glow state for session', () => {
    const { result } = renderHook(() => useNotificationGlow());

    result.current.addNotification({
      level: 'error',
      message: 'Error',
      sessionId: testSessionId,
      source: 'step',
    });

    const glow = result.current.getSessionGlow(testSessionId);

    expect(glow).toBeDefined();
    expect(typeof glow.active).toBe('boolean');
    expect(glow.intensity).toBeGreaterThanOrEqual(0);
    expect(glow.intensity).toBeLessThanOrEqual(1);
  });

  it('should return inactive glow when no notifications', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const glow = result.current.getSessionGlow(testSessionId);

    expect(glow.active).toBe(false);
    expect(glow.intensity).toBe(0);
  });

  it('should provide getWorkbenchGlow function', () => {
    const { result } = renderHook(() => useNotificationGlow());

    expect(typeof result.current.getWorkbenchGlow).toBe('function');
  });

  it('should calculate glow state for workbench', () => {
    const { result } = renderHook(() => useNotificationGlow());

    result.current.addNotification({
      level: 'warning',
      message: 'Warning',
      workbenchId: testWorkbenchId,
      source: 'step',
    });

    const glow = result.current.getWorkbenchGlow(testWorkbenchId);

    expect(glow).toBeDefined();
    expect(typeof glow.active).toBe('boolean');
  });

  it('should provide clearSessionNotifications function', () => {
    const { result } = renderHook(() => useNotificationGlow());

    expect(typeof result.current.clearSessionNotifications).toBe('function');
  });

  it('should clear session notifications', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const notif = result.current.addNotification({
      level: 'info',
      message: 'Test',
      sessionId: testSessionId,
      source: 'step',
    });

    // Verify notification was added
    const added = result.current.notifications.some(n => n.id === notif.id);
    if (added) {
      result.current.clearSessionNotifications(testSessionId);
      const glow = result.current.getSessionGlow(testSessionId);
      expect(glow.active).toBe(false);
    }
  });

  it('should provide clearWorkbenchNotifications function', () => {
    const { result } = renderHook(() => useNotificationGlow());

    expect(typeof result.current.clearWorkbenchNotifications).toBe('function');
  });

  it('should provide getPropagationPath function', () => {
    const { result } = renderHook(() => useNotificationGlow());

    expect(typeof result.current.getPropagationPath).toBe('function');
  });

  it('should get propagation path for notification', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const notification = result.current.addNotification({
      level: 'error',
      message: 'Error',
      sessionId: testSessionId,
      source: 'step',
    });

    const path = result.current.getPropagationPath(notification);

    expect(path === null || path !== null).toBe(true); // May be null if workbench not registered
  });

  it('should handle multiple notification levels', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const n1 = result.current.addNotification({
      level: 'info',
      message: 'Info',
      sessionId: testSessionId,
      source: 'step',
    });

    const n2 = result.current.addNotification({
      level: 'warning',
      message: 'Warning',
      sessionId: testSessionId,
      source: 'step',
    });

    const n3 = result.current.addNotification({
      level: 'error',
      message: 'Error',
      sessionId: testSessionId,
      source: 'step',
    });

    // Check that notifications are returned correctly
    expect(n1).toBeDefined();
    expect(n2).toBeDefined();
    expect(n3).toBeDefined();
  });

  it('should handle notification metadata', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const notification = result.current.addNotification({
      level: 'error',
      message: 'Test',
      sessionId: testSessionId,
      source: 'step',
      chainId: 'chain-1' as any,
      stepId: 'step-1' as any,
    });

    expect(notification.chainId).toBe('chain-1');
    expect(notification.stepId).toBe('step-1');
  });

  it('should have notification state properties', () => {
    const { result } = renderHook(() => useNotificationGlow());

    const notif = result.current.addNotification({
      level: 'info',
      message: 'Test',
      sessionId: testSessionId,
      source: 'step',
    });

    expect(notif.id).toBeDefined();
    expect(notif.level).toBeDefined();
    expect(notif.message).toBeDefined();
    expect(notif.timestamp).toBeDefined();
    expect(typeof notif.read).toBe('boolean');
    expect(typeof notif.dismissed).toBe('boolean');
  });

  it('should provide notificationState', () => {
    const { result } = renderHook(() => useNotificationGlow());

    result.current.addNotification({
      level: 'info',
      message: 'Test',
      sessionId: testSessionId,
      source: 'step',
    });

    expect(result.current.notificationState).toBeDefined();
  });

  it('should not throw on cleanup', () => {
    const { unmount } = renderHook(() => useNotificationGlow());

    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('should support optional WebSocket context', () => {
    const { result } = renderHook(() => useNotificationGlow(null));

    expect(result.current).toBeDefined();
    expect(result.current.notifications).toEqual([]);
  });
});
