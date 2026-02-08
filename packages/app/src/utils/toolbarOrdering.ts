/**
 * Toolbar Ordering Utility
 * Persistent toolbar ordering logic based on usage frequency and pinned status
 * Implements SRD Section 2.3 Toolbar State Persistence
 */

import type { ToolbarSlot, ButtonDefinition, ButtonId } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

/**
 * Sort toolbar slots by frequency and pinned status.
 *
 * Ordering rules:
 * 1. Pinned buttons always come first (sorted by position within pinned)
 * 2. Non-pinned buttons sorted by usageCount (descending)
 * 3. Tie-breaker: lastUsed timestamp (more recent first)
 *
 * @param slots - Array of toolbar slots to sort
 * @returns Sorted array (new array, does not mutate input)
 */
export function sortToolbarSlots(slots: ToolbarSlot[]): ToolbarSlot[] {
  return [...slots].sort((a, b) => {
    // 1. Pinned first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    // 2. Within pinned: sort by position
    if (a.pinned && b.pinned) {
      return a.position - b.position;
    }

    // 3. Within non-pinned: sort by usageCount descending
    if (a.usageCount !== b.usageCount) {
      return b.usageCount - a.usageCount;
    }

    // 4. Tie-breaker: lastUsed (more recent first)
    // Convert ISO 8601 timestamps to comparable numbers
    const aTime = new Date(a.lastUsed).getTime();
    const bTime = new Date(b.lastUsed).getTime();
    return bTime - aTime;
  });
}

/**
 * Get the top N buttons to display in the toolbar.
 *
 * @param slots - All toolbar slots (will be sorted)
 * @param maxSlots - Maximum number of slots to return
 * @returns Top N slots after sorting
 */
export function getVisibleSlots(slots: ToolbarSlot[], maxSlots: number): ToolbarSlot[] {
  const sorted = sortToolbarSlots(slots);
  return sorted.slice(0, maxSlots);
}

/**
 * Find suggested buttons that aren't in the toolbar yet.
 * These are high-frequency buttons that the user might want to pin.
 *
 * @param allButtons - All available button definitions
 * @param currentSlots - Currently configured toolbar slots
 * @returns Button definitions that could be suggested (not yet in toolbar)
 */
export function getSuggestedButtons(
  allButtons: ButtonDefinition[],
  currentSlots: ToolbarSlot[]
): ButtonDefinition[] {
  const currentButtonIds = new Set(currentSlots.map(s => s.buttonId));

  // Find buttons not in toolbar
  return allButtons.filter(b => !currentButtonIds.has(b.id));
}

/**
 * Create a new toolbar slot for a button.
 *
 * @param buttonId - The button to add
 * @param existingSlots - Current slots (to determine position)
 * @param pinned - Whether to pin the new slot
 * @returns New ToolbarSlot
 */
export function createSlot(
  buttonId: ButtonId,
  existingSlots: ToolbarSlot[],
  pinned: boolean = false
): ToolbarSlot {
  const maxPosition = existingSlots.reduce((max, s) => Math.max(max, s.position), -1);

  return {
    buttonId,
    pinned,
    position: maxPosition + 1,
    usageCount: 0,
    lastUsed: brandedTypes.currentTimestamp(),
  };
}

/**
 * Increment usage count for a button slot.
 *
 * @param slots - Current slots
 * @param buttonId - Button that was used
 * @returns Updated slots array (new array, does not mutate input)
 */
export function trackButtonUsage(
  slots: ToolbarSlot[],
  buttonId: ButtonId
): ToolbarSlot[] {
  return slots.map(slot => {
    if (slot.buttonId === buttonId) {
      return {
        ...slot,
        usageCount: slot.usageCount + 1,
        lastUsed: brandedTypes.currentTimestamp(),
      };
    }
    return slot;
  });
}

/**
 * Update pinned status of a slot.
 *
 * @param slots - Current slots
 * @param buttonId - Button to update
 * @param pinned - New pinned status
 * @returns Updated slots array (new array, does not mutate input)
 */
export function updatePinnedStatus(
  slots: ToolbarSlot[],
  buttonId: ButtonId,
  pinned: boolean
): ToolbarSlot[] {
  return slots.map(slot => {
    if (slot.buttonId === buttonId) {
      return { ...slot, pinned };
    }
    return slot;
  });
}

/**
 * Reorder slots by updating positions.
 * Useful when user manually drags slots to new positions.
 *
 * @param slots - Current slots
 * @param newOrder - Array of buttonIds in desired order
 * @returns Updated slots with new positions (does not mutate input)
 */
export function reorderSlots(slots: ToolbarSlot[], newOrder: ButtonId[]): ToolbarSlot[] {
  const slotMap = new Map(slots.map(s => [s.buttonId, s]));

  return newOrder
    .map((buttonId, index) => {
      const slot = slotMap.get(buttonId);
      if (slot) {
        return { ...slot, position: index };
      }
      return null;
    })
    .filter((slot): slot is ToolbarSlot => slot !== null);
}

/**
 * Remove a button from the toolbar.
 *
 * @param slots - Current slots
 * @param buttonId - Button to remove
 * @returns Updated slots without the removed button
 */
export function removeSlot(slots: ToolbarSlot[], buttonId: ButtonId): ToolbarSlot[] {
  return slots.filter(s => s.buttonId !== buttonId);
}

/**
 * Calculate toolbar statistics for UI display.
 *
 * @param slots - Toolbar slots to analyze
 * @returns Statistics object
 */
export interface ToolbarStats {
  totalButtons: number;
  pinnedCount: number;
  unpinnedCount: number;
  mostUsedButtonId: ButtonId | null;
  totalUsage: number;
  averageUsagePerButton: number;
}

export function calculateToolbarStats(slots: ToolbarSlot[]): ToolbarStats {
  const pinnedCount = slots.filter(s => s.pinned).length;
  const totalUsage = slots.reduce((sum, s) => sum + s.usageCount, 0);

  let mostUsedButtonId: ButtonId | null = null;
  let maxUsage = -1;

  for (const slot of slots) {
    if (slot.usageCount > maxUsage) {
      maxUsage = slot.usageCount;
      mostUsedButtonId = slot.buttonId;
    }
  }

  return {
    totalButtons: slots.length,
    pinnedCount,
    unpinnedCount: slots.length - pinnedCount,
    mostUsedButtonId,
    totalUsage,
    averageUsagePerButton: slots.length > 0 ? totalUsage / slots.length : 0,
  };
}
