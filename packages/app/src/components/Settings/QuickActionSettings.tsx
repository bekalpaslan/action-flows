import { useState } from 'react';
import type { QuickActionDefinition } from '@afw/shared';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import './QuickActionSettings.css';

export interface QuickActionSettingsProps {
  /** Current quick action presets */
  quickActions: QuickActionDefinition[];

  /** Callback when presets updated */
  onUpdate: (actions: QuickActionDefinition[]) => void;

  /** Callback when close clicked */
  onClose: () => void;
}

/**
 * Available icon options for quick actions
 */
const AVAILABLE_ICONS = [
  { name: 'check', label: 'Check' },
  { name: 'x', label: 'X' },
  { name: 'skip', label: 'Skip' },
  { name: 'number', label: 'Number' },
  { name: 'folder', label: 'Folder' },
  { name: 'edit', label: 'Edit' },
];

/**
 * QuickActionSettings - settings panel for managing quick actions
 *
 * Allows adding, editing, and deleting global quick action presets
 */
export function QuickActionSettings({
  quickActions,
  onUpdate,
  onClose,
}: QuickActionSettingsProps) {
  const [actions, setActions] = useState<QuickActionDefinition[]>(quickActions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<QuickActionDefinition>>({});
  const [isNewUnsaved, setIsNewUnsaved] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Track if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(actions) !== JSON.stringify(quickActions);

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend: handleDiscussSend } = useDiscussButton({
    componentName: 'QuickActionSettings',
    getContext: () => ({
      settingsCategory: 'Quick Actions',
      unsavedChanges: hasUnsavedChanges,
    }),
  });

  // Handle discuss dialog send
  const handleDiscussDialogSend = (message: string) => {
    const formattedMessage = handleDiscussSend(message);
    console.log('Discussion message:', formattedMessage);
    closeDialog();
  };

  const handleAddNew = () => {
    const newAction: QuickActionDefinition = {
      id: `action-${Date.now()}`,
      label: '',
      icon: 'check',
      value: '',
      alwaysShow: false,
    };

    setActions([...actions, newAction]);
    setEditingId(newAction.id);
    setEditForm(newAction);
    setIsNewUnsaved(true);
  };

  const handleEdit = (action: QuickActionDefinition) => {
    setEditingId(action.id);
    setEditForm({ ...action });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editForm.label?.trim() || !editForm.value?.trim()) {
      return;
    }

    const updated = actions.map(a =>
      a.id === editingId ? { ...a, ...editForm } : a
    );

    setActions(updated);
    setEditingId(null);
    setEditForm({});
    setIsNewUnsaved(false);
  };

  const handleCancelEdit = () => {
    // Remove action if it was newly created and never saved
    if (isNewUnsaved) {
      setActions(actions.filter(a => a.id !== editingId));
    }

    setEditingId(null);
    setEditForm({});
    setIsNewUnsaved(false);
  };

  const handleDeleteRequest = (id: string) => {
    setPendingDeleteId(id);
  };

  const handleDeleteConfirm = () => {
    if (pendingDeleteId) {
      setActions(actions.filter(a => a.id !== pendingDeleteId));
      setPendingDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setPendingDeleteId(null);
  };

  const handleSave = () => {
    onUpdate(actions);
    onClose();
  };

  return (
    <div className="quick-action-settings-overlay" onClick={onClose}>
      <div className="quick-action-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Quick Action Settings</h2>
          <DiscussButton componentName="QuickActionSettings" onClick={openDialog} size="small" />
          <button className="settings-close-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-actions-list">
            {actions.map((action) => (
              <div key={action.id} className="settings-action-item">
                {editingId === action.id ? (
                  <div className="action-edit-form">
                    <div className="form-row">
                      <label>Label:</label>
                      <input
                        type="text"
                        value={editForm.label || ''}
                        onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                        placeholder="Button label"
                      />
                    </div>

                    <div className="form-row">
                      <label>Value:</label>
                      <input
                        type="text"
                        value={editForm.value || ''}
                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                        placeholder="Input value to send"
                      />
                    </div>

                    <div className="form-row">
                      <label>Icon:</label>
                      <select
                        value={editForm.icon || 'check'}
                        onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                      >
                        {AVAILABLE_ICONS.map((icon) => (
                          <option key={icon.name} value={icon.name}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row checkbox-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={editForm.alwaysShow || false}
                          onChange={(e) =>
                            setEditForm({ ...editForm, alwaysShow: e.target.checked })
                          }
                        />
                        Always show (ignore context)
                      </label>
                    </div>

                    <div className="form-actions">
                      <button className="form-btn save-btn" onClick={handleSaveEdit}>
                        Save
                      </button>
                      <button className="form-btn cancel-btn" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="action-view">
                    <div className="action-info">
                      <div className="action-label-row">
                        <span className="action-icon-preview">{action.icon}</span>
                        <span className="action-label">{action.label}</span>
                      </div>
                      <div className="action-details">
                        <span className="action-value">Value: {action.value}</span>
                        {action.alwaysShow && (
                          <span className="action-badge">Always Show</span>
                        )}
                      </div>
                    </div>

                    <div className="action-buttons">
                      {pendingDeleteId === action.id ? (
                        <>
                          <span className="delete-confirm-label">Delete?</span>
                          <button
                            className="action-btn confirm-btn"
                            onClick={handleDeleteConfirm}
                            title="Confirm delete"
                          >
                            Yes
                          </button>
                          <button
                            className="action-btn cancel-btn"
                            onClick={handleDeleteCancel}
                            title="Cancel delete"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(action)}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteRequest(action.id)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="add-action-btn" onClick={handleAddNew}>
            + Add Quick Action
          </button>
        </div>

        <div className="settings-footer">
          <button className="footer-btn cancel-footer-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="footer-btn save-footer-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>

        {/* DiscussDialog */}
        <DiscussDialog
          isOpen={isDialogOpen}
          componentName="QuickActionSettings"
          componentContext={{
            settingsCategory: 'Quick Actions',
            unsavedChanges: hasUnsavedChanges,
          }}
          onSend={handleDiscussDialogSend}
          onClose={closeDialog}
        />
      </div>
    </div>
  );
}
