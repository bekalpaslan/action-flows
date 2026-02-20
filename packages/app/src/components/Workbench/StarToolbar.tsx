import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import { STAR_CONFIGS } from '@afw/shared';
import './StarToolbar.css';

interface StarToolbarProps {
  activeSessionCount?: number;
}

/**
 * StarToolbar - Fixed toolbar at the top of the workbench panel
 *
 * Contains:
 * - Title: Current workbench name
 * - Badge: N active sessions/tasks
 * - Actions: Chat toggle button, more button
 *
 * Structure (from layout-demo.html):
 * <div class="star-toolbar">
 *   <span class="title">Work</span>
 *   <span class="badge">3 active</span>
 *   <div class="toolbar-actions">
 *     <button class="icon-btn" title="Toggle chat" onclick="toggleChat()">💬</button>
 *     <button class="icon-btn" title="More">⋯</button>
 *   </div>
 * </div>
 */
export function StarToolbar({ activeSessionCount = 0 }: StarToolbarProps) {
  const { activeWorkbench } = useWorkbenchContext();
  const { toggleChat, isOpen: chatIsOpen } = useChatWindowContext();

  const workbenchConfig = STAR_CONFIGS[activeWorkbench];
  const workbenchTitle = workbenchConfig?.label || activeWorkbench;

  return (
    <div className="star-toolbar">
      <span className="star-toolbar__title">{workbenchTitle}</span>
      {activeSessionCount > 0 && (
        <span className="star-toolbar__badge">{activeSessionCount} active</span>
      )}
      <div className="star-toolbar__actions">
        <button
          className="icon-btn"
          title={chatIsOpen ? 'Close chat' : 'Open chat'}
          onClick={toggleChat}
          aria-label={chatIsOpen ? 'Close chat panel' : 'Open chat panel'}
        >
          💬
        </button>
        <button
          className="icon-btn"
          title="More options"
          aria-label="More options"
        >
          ⋯
        </button>
      </div>
    </div>
  );
}
