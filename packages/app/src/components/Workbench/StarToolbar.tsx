import { useWorkbenchContext } from '../../contexts/WorkbenchContext';
import { useChatWindowContext } from '../../contexts/ChatWindowContext';
import { STAR_CONFIGS, type WorkbenchId } from '@afw/shared';
import './StarToolbar.css';

/**
 * WorkbenchToolbar - Fixed toolbar at the top of the workbench panel
 *
 * Contains:
 * - Title: Current workbench name
 * - Badge: N active sessions/tasks
 * - Actions: Chat toggle button, more button
 *
 * Structure (from layout-demo.html):
 * <div class="workbench-toolbar">
 *   <span class="title">Work</span>
 *   <div class="toolbar-actions">
 *     <button class="icon-btn" title="Toggle chat" onclick="toggleChat()">💬</button>
 *     <button class="icon-btn" title="More">⋯</button>
 *   </div>
 * </div>
 */
export function WorkbenchToolbar() {
  const { activeWorkbench } = useWorkbenchContext();
  const { toggleChat, isOpen: chatIsOpen } = useChatWindowContext();

  const WORKBENCH_CONFIGS = STAR_CONFIGS as unknown as Record<WorkbenchId, { label?: string }>;
  const workbenchConfig = WORKBENCH_CONFIGS[activeWorkbench];
  const workbenchTitle = workbenchConfig?.label || activeWorkbench;

  return (
    <div className="workbench-toolbar">
      <span className="workbench-toolbar__title">{workbenchTitle}</span>
      <div className="workbench-toolbar__actions">
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

// Backward compatibility export
export const StarToolbar = WorkbenchToolbar;
