import { useMemo } from 'react';
import type { ButtonDefinition, ButtonContext, SessionId } from '@afw/shared';
import { detectContext } from '../../utils/buttonContextDetector';
import { InlineButtonItem } from './InlineButtonItem';
import './InlineButtons.css';

interface InlineButtonsProps {
  /** The message content to detect context from */
  messageContent: string;
  /** Session ID for action routing */
  sessionId: SessionId;
  /** Available button definitions (will be filtered by context) */
  buttons: ButtonDefinition[];
  /** Optional: override detected context */
  overrideContext?: ButtonContext;
  /** Callback when a button action is triggered */
  onAction?: (button: ButtonDefinition) => void;
}

/**
 * Horizontal button row that renders below Claude response messages.
 * Integrates with context detector to filter relevant buttons.
 *
 * Features:
 * - Auto-detects response context (code-change, error-message, question-prompt, etc.)
 * - Filters buttons to show only those matching the detected context
 * - Sorts buttons by priority (lower = higher priority)
 * - Responsive wrapping on small screens
 * - Graceful handling of empty state (no matching buttons)
 */
export function InlineButtons({
  messageContent,
  sessionId,
  buttons,
  overrideContext,
  onAction,
}: InlineButtonsProps) {
  // 1. Detect context from message content (or use override)
  const detectedContext = useMemo(() => {
    if (overrideContext) {
      return overrideContext;
    }
    return detectContext(messageContent).context;
  }, [messageContent, overrideContext]);

  // 2. Filter buttons by matching context
  const filteredButtons = useMemo(() => {
    return buttons
      .filter(
        (button) =>
          button.enabled && button.contexts.includes(detectedContext)
      )
      // 3. Sort by priority (lower = higher priority)
      .sort((a, b) => a.priority - b.priority);
  }, [buttons, detectedContext]);

  // 4. Handle empty state (no matching buttons = don't render)
  if (filteredButtons.length === 0) {
    return null;
  }

  // 5. Render horizontal button row
  return (
    <div className="inline-buttons-container">
      {filteredButtons.map((button) => (
        <InlineButtonItem
          key={button.id}
          button={button}
          sessionId={sessionId}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
