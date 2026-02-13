import { useState, useCallback, useMemo } from 'react';
import type { Role } from '@afw/shared';
import { PermissionGuard } from './PermissionGuard';
import './Auth.css';

interface RoleAssignmentProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * RoleAssignment Component
 *
 * Admin-only interface for assigning roles to users.
 * Requires 'manage_users' permission.
 *
 * Features:
 * - Input field for userId
 * - Dropdown for role selection
 * - Loading state during API call
 * - Success/error feedback
 * - Automatically hidden if user lacks permission
 */
export function RoleAssignment({ onSuccess, onError }: RoleAssignmentProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleAssignRole = useCallback(async () => {
    if (!userId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a user ID' });
      onError?.('User ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      const response = await fetch(`${API_BASE_URL}/api/auth/assign-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: userId.trim(), role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to assign role: ${response.statusText}`);
      }

      setMessage({
        type: 'success',
        text: `Successfully assigned role "${role}" to user ${userId}`,
      });
      onSuccess?.();
      setUserId('');
      setRole('viewer');
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ type: 'error', text: error });
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, role, API_BASE_URL, onSuccess, onError]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAssignRole();
      }
    },
    [handleAssignRole]
  );

  const fallback = useMemo(
    () => (
      <div className="permission-denied" role="alert">
        <span className="permission-denied__icon">🔒</span>
        You don't have permission to assign roles. Contact an administrator.
      </div>
    ),
    []
  );

  return (
    <PermissionGuard permission="manage_users" fallback={fallback}>
      <div className="role-assignment" role="region" aria-label="Role assignment">
        <div className="role-assignment__input-group">
          <label htmlFor="user-id-input" className="role-assignment__label">
            User ID
          </label>
          <input
            id="user-id-input"
            type="text"
            className="role-assignment__input"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter user ID"
            disabled={isLoading}
            aria-describedby={message ? 'role-assignment-message' : undefined}
          />
        </div>

        <div className="role-assignment__input-group">
          <label htmlFor="role-select" className="role-assignment__label">
            Role
          </label>
          <select
            id="role-select"
            className="role-assignment__select"
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            disabled={isLoading}
          >
            <option value="viewer">Viewer</option>
            <option value="reviewer">Reviewer</option>
            <option value="executor">Executor</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          className="role-assignment__button"
          onClick={handleAssignRole}
          disabled={isLoading || !userId.trim()}
          aria-busy={isLoading}
        >
          {isLoading ? 'Assigning...' : 'Assign'}
        </button>

        {message && (
          <div
            id="role-assignment-message"
            className={`message ${message.type}`}
            role="status"
            aria-live="polite"
          >
            {message.type === 'success' ? '✓ ' : '✗ '}
            {message.text}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
