import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ActionListItem, type ActionItemData } from './ActionListItem';
import { useFlowStore } from '@/stores/flowStore';
import { toast } from '@/lib/toast';
import type { WorkbenchId } from '@/lib/types';

export interface FlowComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: WorkbenchId;
}

const FLOW_NAME_REGEX = /^[a-z][a-z0-9-]*$/;

/**
 * Dialog for composing new flows from the action catalog.
 * Users can search available actions, select them, reorder via drag-and-drop
 * or keyboard arrows, name the flow, and save it to the flow store.
 */
export function FlowComposer({ open, onOpenChange, context }: FlowComposerProps) {
  const [flowName, setFlowName] = useState('');
  const [flowNameError, setFlowNameError] = useState(false);
  const [actions, setActions] = useState<ActionItemData[]>([]);
  const [selectedActions, setSelectedActions] = useState<ActionItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Load action catalog when dialog opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    async function fetchActions() {
      try {
        const res = await fetch('/api/actions');
        const data = await res.json();
        if (!cancelled && data.success) {
          setActions(data.actions);
        }
      } catch {
        // Silent failure -- actions list will be empty
      }
    }
    fetchActions();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredActions = searchQuery
    ? actions.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : actions;

  const isSelected = useCallback(
    (action: ActionItemData) =>
      selectedActions.some((sa) => sa.name === action.name),
    [selectedActions]
  );

  function handleToggleAction(action: ActionItemData) {
    if (isSelected(action)) {
      setSelectedActions((prev) => prev.filter((a) => a.name !== action.name));
    } else {
      setSelectedActions((prev) => [...prev, action]);
    }
  }

  function handleDragStart(index: number) {
    return (e: React.DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    };
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(dropIndex: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) return;

      setSelectedActions((prev) => {
        const items = [...prev];
        const [moved] = items.splice(dragIndex, 1);
        if (moved) {
          items.splice(dropIndex, 0, moved);
        }
        return items;
      });
      setDragIndex(null);
    };
  }

  function handleKeyReorder(index: number) {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp' && index > 0) {
        e.preventDefault();
        setSelectedActions((prev) => {
          const items = [...prev];
          const item = items[index];
          const neighbor = items[index - 1];
          if (item && neighbor) {
            items[index - 1] = item;
            items[index] = neighbor;
          }
          return items;
        });
      } else if (e.key === 'ArrowDown' && index < selectedActions.length - 1) {
        e.preventDefault();
        setSelectedActions((prev) => {
          const items = [...prev];
          const item = items[index];
          const neighbor = items[index + 1];
          if (item && neighbor) {
            items[index + 1] = item;
            items[index] = neighbor;
          }
          return items;
        });
      }
    };
  }

  function clearState() {
    setFlowName('');
    setFlowNameError(false);
    setSelectedActions([]);
    setSearchQuery('');
    setDragIndex(null);
  }

  function handleDiscard() {
    clearState();
    onOpenChange(false);
  }

  async function handleSave() {
    // Validate flow name
    if (!flowName || !FLOW_NAME_REGEX.test(flowName)) {
      setFlowNameError(true);
      return;
    }

    setFlowNameError(false);

    await useFlowStore.getState().addFlow({
      name: flowName,
      description: 'User-composed flow',
      category: context,
      tags: [],
      version: '1.0.0',
      chainTemplate: selectedActions.map((a) => a.name).join(' -> '),
    });

    toast.success(`Flow '${flowName}' saved.`);
    clearState();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose New Flow</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <label htmlFor="flow-name" className="text-body font-semibold">
            Name
          </label>
          <Input
            id="flow-name"
            inputSize="sm"
            placeholder="Flow name (e.g., deploy-and-verify)"
            value={flowName}
            onChange={(e) => {
              setFlowName(e.target.value);
              if (flowNameError) setFlowNameError(false);
            }}
            error={flowNameError}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Left column: Available Actions */}
          <div>
            <h3 className="text-body font-semibold mb-2">Available Actions</h3>
            <Input
              inputSize="sm"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search actions"
              className="mb-2"
            />
            <div
              className="max-h-64 overflow-y-auto border border-border rounded-md"
              role="listbox"
              aria-label="Available Actions"
            >
              {filteredActions.map((action) => (
                <ActionListItem
                  key={action.name}
                  action={action}
                  selected={isSelected(action)}
                  onToggle={() => handleToggleAction(action)}
                />
              ))}
              {filteredActions.length === 0 && actions.length > 0 && (
                <p className="text-caption text-text-dim p-3">No actions match your search.</p>
              )}
              {actions.length === 0 && (
                <p className="text-caption text-text-dim p-3">Loading actions...</p>
              )}
            </div>
          </div>

          {/* Right column: Chain Order */}
          <div>
            <h3 className="text-body font-semibold mb-2">Chain Order</h3>
            <div
              className="max-h-64 overflow-y-auto border border-border rounded-md"
              role="listbox"
              aria-label="Chain Order"
            >
              {selectedActions.length === 0 && (
                <p className="text-body text-text-dim py-4 px-3">
                  Drag actions here to build your chain.
                </p>
              )}
              {selectedActions.map((action, index) => (
                <ActionListItem
                  key={action.name}
                  action={action}
                  selected={true}
                  onToggle={() => handleToggleAction(action)}
                  draggable={true}
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop(index)}
                  onKeyDown={handleKeyReorder(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={handleDiscard}>
            Discard Flow
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Flow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
