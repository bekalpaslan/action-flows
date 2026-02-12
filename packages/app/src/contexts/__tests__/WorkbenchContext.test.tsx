import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { WorkbenchProvider, useWorkbenchContext, useActiveWorkbench } from '../WorkbenchContext';
import type { WorkbenchId } from '@afw/shared';

describe('WorkbenchContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useWorkbenchContext());
    }).toThrow('useWorkbenchContext must be used within WorkbenchProvider');

    consoleSpy.mockRestore();
  });

  it('should initialize with default workbench (work)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    expect(result.current.activeWorkbench).toBe('work');
  });

  it('should restore activeWorkbench from localStorage', () => {
    localStorage.setItem('afw-active-workbench', 'settings');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    expect(result.current.activeWorkbench).toBe('settings');
  });

  it('should persist activeWorkbench to localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.setActiveWorkbench('settings' as WorkbenchId);

    expect(localStorage.getItem('afw-active-workbench')).toBe('settings');
  });

  it('should set active workbench', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    expect(result.current.activeWorkbench).toBe('work');

    result.current.setActiveWorkbench('pm' as WorkbenchId);

    expect(result.current.activeWorkbench).toBe('pm');
  });

  it('should track previous workbench when changing', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    expect(result.current.previousWorkbench).toBeNull();

    result.current.setActiveWorkbench('settings' as WorkbenchId);

    expect(result.current.previousWorkbench).toBe('work');
  });

  it('should not update previousWorkbench if setting same workbench', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.setActiveWorkbench('work' as WorkbenchId);

    expect(result.current.previousWorkbench).toBeNull();
  });

  it('should go back to previous workbench', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.setActiveWorkbench('settings' as WorkbenchId);
    expect(result.current.activeWorkbench).toBe('settings');
    expect(result.current.previousWorkbench).toBe('work');

    result.current.goBack();

    expect(result.current.activeWorkbench).toBe('work');
    expect(result.current.previousWorkbench).toBeNull();
  });

  it('should not go back if no previous workbench', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.goBack();

    // Should remain at work
    expect(result.current.activeWorkbench).toBe('work');
  });

  it('should initialize workbench configs', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    expect(result.current.workbenchConfigs).toBeDefined();
    expect(result.current.workbenchConfigs.size).toBeGreaterThan(0);

    // Should have 'work' config at minimum
    expect(result.current.workbenchConfigs.has('work' as WorkbenchId)).toBe(true);
  });

  it('should add notifications to workbench', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.addNotification('work' as WorkbenchId);
    result.current.addNotification('work' as WorkbenchId);

    const notificationCount = result.current.workbenchNotifications.get(
      'work' as WorkbenchId
    ) || 0;

    expect(notificationCount).toBe(2);
  });

  it('should clear notifications for workbench', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.addNotification('work' as WorkbenchId);
    result.current.addNotification('work' as WorkbenchId);

    expect(
      (result.current.workbenchNotifications.get('work' as WorkbenchId) || 0) > 0
    ).toBe(true);

    result.current.clearNotifications('work' as WorkbenchId);

    expect(
      result.current.workbenchNotifications.get('work' as WorkbenchId) || 0
    ).toBe(0);
  });

  it('should manage separate notification counts for different workbenches', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.addNotification('work' as WorkbenchId);
    result.current.addNotification('work' as WorkbenchId);
    result.current.addNotification('settings' as WorkbenchId);

    const workCount = result.current.workbenchNotifications.get('work' as WorkbenchId) || 0;
    const settingsCount = result.current.workbenchNotifications.get('settings' as WorkbenchId) || 0;

    expect(workCount).toBe(2);
    expect(settingsCount).toBe(1);
  });

  it('should set routing filter', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    expect(result.current.routingFilter).toBeNull();

    result.current.setRoutingFilter('work' as WorkbenchId);

    expect(result.current.routingFilter).toBe('work');
  });

  it('should clear routing filter', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.setRoutingFilter('work' as WorkbenchId);
    expect(result.current.routingFilter).toBe('work');

    result.current.setRoutingFilter(null);

    expect(result.current.routingFilter).toBeNull();
  });

  it('should filter sessions by routing context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    const sessions = [
      {
        id: 'session-1' as any,
        userId: 'user-1' as any,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        metadata: { routingContext: 'work' },
      },
      {
        id: 'session-2' as any,
        userId: 'user-1' as any,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        metadata: { routingContext: 'settings' },
      },
      {
        id: 'session-3' as any,
        userId: 'user-1' as any,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        metadata: { routingContext: 'work' },
      },
    ];

    result.current.setRoutingFilter('work' as WorkbenchId);

    const filtered = result.current.filterSessionsByContext(sessions);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('session-1');
    expect(filtered[1].id).toBe('session-3');
  });

  it('should return all sessions when no routing filter is set', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    const sessions = [
      {
        id: 'session-1' as any,
        userId: 'user-1' as any,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        metadata: { routingContext: 'work' },
      },
      {
        id: 'session-2' as any,
        userId: 'user-1' as any,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        metadata: { routingContext: 'settings' },
      },
    ];

    const filtered = result.current.filterSessionsByContext(sessions);

    expect(filtered).toHaveLength(2);
  });

  it('should set active tool', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    expect(result.current.activeTool).toBeNull();

    result.current.setActiveTool('tool-123' as any);

    expect(result.current.activeTool).toBe('tool-123');
  });

  it('should clear active tool', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useWorkbenchContext(), { wrapper });

    result.current.setActiveTool('tool-123' as any);
    expect(result.current.activeTool).toBe('tool-123');

    result.current.setActiveTool(null);

    expect(result.current.activeTool).toBeNull();
  });

  it('should provide convenient useActiveWorkbench hook', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result } = renderHook(() => useActiveWorkbench(), { wrapper });

    expect(result.current.activeWorkbench).toBe('work');
    expect(result.current.setActiveWorkbench).toBeDefined();
  });

  it('should throw error when useActiveWorkbench is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useActiveWorkbench());
    }).toThrow('useWorkbenchContext must be used within WorkbenchProvider');

    consoleSpy.mockRestore();
  });

  it('should synchronize activeWorkbench changes with useActiveWorkbench', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result: contextResult } = renderHook(() => useWorkbenchContext(), { wrapper });
    const { result: hookResult } = renderHook(() => useActiveWorkbench(), { wrapper });

    expect(contextResult.current.activeWorkbench).toBe('work');
    expect(hookResult.current.activeWorkbench).toBe('work');

    contextResult.current.setActiveWorkbench('settings' as WorkbenchId);

    waitFor(() => {
      expect(hookResult.current.activeWorkbench).toBe('settings');
    });
  });

  it('should maintain separate state for multiple provider instances', () => {
    const wrapper1 = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const wrapper2 = ({ children }: { children: React.ReactNode }) => (
      <WorkbenchProvider>{children}</WorkbenchProvider>
    );

    const { result: result1 } = renderHook(() => useWorkbenchContext(), { wrapper: wrapper1 });
    const { result: result2 } = renderHook(() => useWorkbenchContext(), { wrapper: wrapper2 });

    result1.current.setActiveWorkbench('settings' as WorkbenchId);

    expect(result1.current.activeWorkbench).toBe('settings');
    // result2 should still be at work because it has its own state
    expect(result2.current.activeWorkbench).toBe('work');
  });
});
