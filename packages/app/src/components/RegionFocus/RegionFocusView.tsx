/**
 * RegionFocusView - Dual-panel region focus container
 *
 * When user clicks a region star on cosmic map, this view provides:
 * - Left panel (65%): Workbench content slot (renders active workbench component)
 * - Right panel (35%): Chat panel slot (embeds SlidingChatWindow)
 * - Return to Universe button (top-left corner)
 *
 * This is the critical path for Phase 5 region navigation.
 */

import { type ReactNode } from 'react';
import type { WorkbenchId, SessionId } from '@afw/shared';
import { SlidingChatWindow } from '../SlidingChatWindow/SlidingChatWindow';
import { ChatPanel } from '../SessionPanel/ChatPanel';
import { useSessionContext } from '../../contexts/SessionContext';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import '../../styles/region-themes.css';
import './RegionFocusView.css';

export interface RegionFocusViewProps {
  /** Active workbench component to render in left panel */
  workbenchContent: ReactNode;

  /** Chat session ID for right panel (null = no chat) */
  chatSessionId: SessionId | null;

  /** Return to Universe button click handler */
  onReturnToUniverse: () => void;

  /** Active workbench ID for theming */
  workbenchId: WorkbenchId;
}

export function RegionFocusView({
  workbenchContent,
  chatSessionId,
  onReturnToUniverse,
  workbenchId,
}: RegionFocusViewProps) {
  const { getSession } = useSessionContext();
  const { closeChat } = useChatWindowContext();

  return (
    <div className={`region-focus region-focus--${workbenchId}`}>
      {/* Return to Universe button (top-left corner) */}
      <button
        className="region-focus__return"
        onClick={onReturnToUniverse}
        title="Return to cosmic map (Esc)"
        aria-label="Return to universe view"
      >
        ← Return to Universe
      </button>

      {/* Dual-panel layout */}
      <div className="region-focus__panels">
        {/* Left panel (65%): Workbench content slot */}
        <div className="region-focus__workbench">
          {workbenchContent}
        </div>

        {/* Right panel (35%): Chat panel slot */}
        <div className="region-focus__chat">
          <SlidingChatWindow embedded={true}>
            {chatSessionId !== null && (
              <ChatPanel
                sessionId={chatSessionId}
                session={getSession(chatSessionId)}
                showCloseButton={true}
                onClose={closeChat}
              />
            )}
          </SlidingChatWindow>
        </div>
      </div>
    </div>
  );
}
