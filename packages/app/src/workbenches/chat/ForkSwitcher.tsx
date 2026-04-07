/**
 * ForkSwitcher — tab bar for switching between main session and fork branches.
 *
 * Only renders when session has >= 1 fork. Uses Radix Tabs horizontally.
 * Includes per-fork dropdown with merge, discard, and rename actions.
 * Overflow handling: shows "..." dropdown for > 5 forks.
 */
import { useState, useCallback, useEffect } from 'react';
import { MoreHorizontal, GitMerge, Trash2, Pencil } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/workbenches/shared/DeleteConfirmationDialog';
import { MergeDialog } from './MergeDialog';
import { useForkStore } from '@/stores/forkStore';
import type { ForkMetadata } from '@afw/shared';

export interface ForkSwitcherProps {
  parentSessionId: string;
  workbenchId: string;
}

/** Maximum visible fork tabs before overflow */
const MAX_VISIBLE_FORKS = 5;

export function ForkSwitcher({ parentSessionId, workbenchId }: ForkSwitcherProps) {
  const forks = useForkStore((s) => s.getForksForSession(parentSessionId));
  const activeBranch = useForkStore((s) => s.getActiveBranch(parentSessionId));
  const switchBranch = useForkStore((s) => s.switchBranch);
  const discardFork = useForkStore((s) => s.discardFork);
  const renameFork = useForkStore((s) => s.renameFork);
  const loadForks = useForkStore((s) => s.loadForks);

  // Merge dialog state
  const [mergeDialogForkId, setMergeDialogForkId] = useState<string | null>(null);

  // Discard confirmation state
  const [discardForkId, setDiscardForkId] = useState<string | null>(null);

  // Inline rename state
  const [renamingForkId, setRenamingForkId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Load forks on mount
  useEffect(() => {
    loadForks(parentSessionId);
  }, [parentSessionId, loadForks]);

  // Only active forks shown in tabs
  const activeForks = forks.filter((f) => f.status === 'active');

  // Don't render if no forks
  if (activeForks.length === 0) return null;

  const visibleForks = activeForks.slice(0, MAX_VISIBLE_FORKS);
  const overflowForks = activeForks.slice(MAX_VISIBLE_FORKS);

  const handleTabChange = (value: string) => {
    switchBranch(parentSessionId, value);
  };

  const handleStartRename = (fork: ForkMetadata) => {
    setRenamingForkId(fork.id);
    setRenameValue(fork.description);
  };

  const handleFinishRename = useCallback(async () => {
    if (renamingForkId && renameValue.trim()) {
      await renameFork(renamingForkId, renameValue.trim());
    }
    setRenamingForkId(null);
    setRenameValue('');
  }, [renamingForkId, renameValue, renameFork]);

  const handleDiscardConfirm = async () => {
    if (discardForkId) {
      await discardFork(discardForkId);
      setDiscardForkId(null);
    }
  };

  const truncateDescription = (desc: string) =>
    desc.length > 40 ? desc.slice(0, 40) + '...' : desc;

  return (
    <div className="mb-4">
      <Tabs value={activeBranch} onValueChange={handleTabChange}>
        <TabsList className="overflow-x-auto border-b border-border">
          {/* Main tab is always present */}
          <TabsTrigger value={parentSessionId}>Main</TabsTrigger>

          {/* Visible fork tabs */}
          {visibleForks.map((fork, i) => (
            <div key={fork.id} className="relative flex items-center">
              {renamingForkId === fork.id ? (
                <input
                  className="h-11 w-48 border-b-2 border-accent bg-transparent px-2 text-caption font-semibold text-text outline-none"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishRename();
                    if (e.key === 'Escape') {
                      setRenamingForkId(null);
                      setRenameValue('');
                    }
                  }}
                  autoFocus
                />
              ) : (
                <TabsTrigger value={fork.forkSessionId}>
                  Fork {i + 1}: {truncateDescription(fork.description)}
                </TabsTrigger>
              )}

              {/* Per-fork actions dropdown */}
              <ForkTabMenu
                fork={fork}
                onMerge={() => setMergeDialogForkId(fork.id)}
                onDiscard={() => setDiscardForkId(fork.id)}
                onRename={() => handleStartRename(fork)}
              />
            </div>
          ))}

          {/* Overflow dropdown for > 5 forks */}
          {overflowForks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {overflowForks.map((fork, i) => (
                  <DropdownMenuItem
                    key={fork.id}
                    onClick={() => switchBranch(parentSessionId, fork.forkSessionId)}
                  >
                    Fork {MAX_VISIBLE_FORKS + i + 1}: {truncateDescription(fork.description)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TabsList>
      </Tabs>

      {/* Merge dialog */}
      {mergeDialogForkId && (
        <MergeDialog
          open={!!mergeDialogForkId}
          onOpenChange={(open) => { if (!open) setMergeDialogForkId(null); }}
          forkId={mergeDialogForkId}
          onMerged={() => {
            setMergeDialogForkId(null);
            loadForks(parentSessionId);
          }}
        />
      )}

      {/* Discard confirmation dialog */}
      <DeleteConfirmationDialog
        open={!!discardForkId}
        onOpenChange={(open) => { if (!open) setDiscardForkId(null); }}
        title="Discard this fork?"
        description="The fork and its conversation history will be removed. This cannot be undone."
        confirmLabel="Discard"
        onConfirm={handleDiscardConfirm}
      />
    </div>
  );
}

/** Per-fork tab dropdown menu */
function ForkTabMenu({
  fork,
  onMerge,
  onDiscard,
  onRename,
}: {
  fork: ForkMetadata;
  onMerge: () => void;
  onDiscard: () => void;
  onRename: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-0.5 h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Actions for fork: ${fork.description}`}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onMerge}>
          <GitMerge className="mr-2 h-4 w-4" />
          Merge Fork
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDiscard}>
          <Trash2 className="mr-2 h-4 w-4" />
          Discard Fork
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
