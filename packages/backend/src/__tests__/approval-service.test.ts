import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApprovalService } from '../services/approvalService.js';

describe('ApprovalService', () => {
  let service: ApprovalService;

  beforeEach(() => {
    service = new ApprovalService();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('needsApproval', () => {
    test('full autonomy: never needs approval', () => {
      // settings workbench defaults to 'full'
      expect(service.needsApproval('settings', 'delete_files')).toBe(false);
      expect(service.needsApproval('settings', 'edit_file')).toBe(false);
    });

    test('full autonomy: studio also defaults to full', () => {
      expect(service.needsApproval('studio', 'delete_files')).toBe(false);
      expect(service.needsApproval('studio', 'force_push')).toBe(false);
    });

    test('supervised autonomy: needs approval for destructive actions only', () => {
      // work workbench defaults to 'supervised'
      expect(service.needsApproval('work', 'delete_files')).toBe(true);
      expect(service.needsApproval('work', 'force_push')).toBe(true);
      expect(service.needsApproval('work', 'drop_table')).toBe(true);
      expect(service.needsApproval('work', 'git_reset_hard')).toBe(true);
      expect(service.needsApproval('work', 'remove_directory')).toBe(true);
      expect(service.needsApproval('work', 'edit_file')).toBe(false);
      expect(service.needsApproval('work', 'create_file')).toBe(false);
    });

    test('restricted autonomy: always needs approval', () => {
      // review workbench defaults to 'restricted'
      expect(service.needsApproval('review', 'edit_file')).toBe(true);
      expect(service.needsApproval('review', 'delete_files')).toBe(true);
      expect(service.needsApproval('review', 'create_file')).toBe(true);
    });
  });

  describe('request lifecycle', () => {
    test('createRequest returns pending request with 120s expiry', () => {
      const now = Date.now();
      const request = service.createRequest({
        action: 'delete_files',
        description: 'Delete 3 files from packages/app/',
        files: ['a.ts', 'b.ts', 'c.ts'],
        workbenchId: 'work',
        sessionId: 'session-123',
      });

      expect(request.id).toMatch(/^approval_/);
      expect(request.status).toBe('pending');
      expect(request.action).toBe('delete_files');
      expect(request.description).toBe('Delete 3 files from packages/app/');
      expect(request.files).toEqual(['a.ts', 'b.ts', 'c.ts']);
      expect(request.workbenchId).toBe('work');
      expect(request.sessionId).toBe('session-123');
      expect(request.autonomyLevel).toBe('supervised');
      expect(request.resolvedAt).toBeUndefined();

      // Check expiry is approximately 120s from now
      const expiresAt = new Date(request.expiresAt).getTime();
      const diff = expiresAt - now;
      expect(diff).toBeGreaterThanOrEqual(119000);
      expect(diff).toBeLessThanOrEqual(121000);
    });

    test('resolveRequest changes status and sets resolvedAt', () => {
      const request = service.createRequest({
        action: 'delete_files',
        description: 'Delete files',
        workbenchId: 'work',
        sessionId: 'session-123',
      });

      const resolved = service.resolveRequest(request.id, 'approved');
      expect(resolved).not.toBeNull();
      expect(resolved!.status).toBe('approved');
      expect(resolved!.resolvedAt).toBeDefined();
    });

    test('resolveRequest with denied status', () => {
      const request = service.createRequest({
        action: 'force_push',
        description: 'Force push to main',
        workbenchId: 'work',
        sessionId: 'session-456',
      });

      const resolved = service.resolveRequest(request.id, 'denied');
      expect(resolved).not.toBeNull();
      expect(resolved!.status).toBe('denied');
      expect(resolved!.resolvedAt).toBeDefined();
    });

    test('resolveRequest returns null for already resolved', () => {
      const request = service.createRequest({
        action: 'delete_files',
        description: 'Delete files',
        workbenchId: 'work',
        sessionId: 'session-123',
      });

      service.resolveRequest(request.id, 'approved');
      const secondResolve = service.resolveRequest(request.id, 'denied');
      expect(secondResolve).toBeNull();
    });

    test('getRequest returns null for unknown id', () => {
      const result = service.getRequest('nonexistent-id');
      expect(result).toBeNull();
    });

    test('getRequest returns the request after creation', () => {
      const request = service.createRequest({
        action: 'edit_file',
        description: 'Edit config',
        workbenchId: 'review',
        sessionId: 'session-789',
      });

      const fetched = service.getRequest(request.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(request.id);
      expect(fetched!.action).toBe('edit_file');
    });
  });

  describe('autonomy levels', () => {
    test('getAutonomyLevel returns default for known workbench', () => {
      expect(service.getAutonomyLevel('work')).toBe('supervised');
      expect(service.getAutonomyLevel('settings')).toBe('full');
      expect(service.getAutonomyLevel('review')).toBe('restricted');
      expect(service.getAutonomyLevel('studio')).toBe('full');
      expect(service.getAutonomyLevel('archive')).toBe('restricted');
    });

    test('setAutonomyLevel updates the level', () => {
      service.setAutonomyLevel('work', 'full');
      expect(service.getAutonomyLevel('work')).toBe('full');

      service.setAutonomyLevel('work', 'restricted');
      expect(service.getAutonomyLevel('work')).toBe('restricted');
    });

    test('getAutonomyLevel returns supervised for unknown workbench', () => {
      expect(service.getAutonomyLevel('unknown-workbench')).toBe('supervised');
    });
  });
});
