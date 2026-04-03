import { useRef, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  workbenchLabel: string;
  className?: string;
}

/**
 * Auto-growing textarea with send button for chat input.
 * Enter sends, Shift+Enter inserts newline (per UI-SPEC D-08).
 */
export function ChatInput({ value, onChange, onSend, disabled, workbenchLabel, className }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea fallback for browsers without field-sizing: content
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !disabled) {
          onSend();
        }
      }
    },
    [value, disabled, onSend]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const isSubmitDisabled = !value.trim() || disabled;

  const sendButton = (
    <Button
      variant="primary"
      size="icon"
      onClick={onSend}
      disabled={isSubmitDisabled}
      aria-label="Send message"
      className={cn(
        'shrink-0 h-9 w-9',
        'active:scale-95 transition-transform duration-75'
      )}
    >
      <SendHorizontal className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn('flex items-end gap-2 p-3 bg-surface-2 border-t border-border', className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Message ${workbenchLabel} agent...`}
        aria-label="Message input"
        disabled={disabled}
        rows={1}
        className={cn(
          'flex-1 rounded-md border border-border bg-[rgba(138,138,138,0.24)] text-text',
          'placeholder:text-text-muted transition-colors',
          'focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-glow-focus',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-none min-h-[40px] max-h-[160px] px-3 py-2 text-body',
          '[field-sizing:content]'
        )}
      />
      {disabled ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {sendButton}
            </TooltipTrigger>
            <TooltipContent>Connect to send messages</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        sendButton
      )}
    </div>
  );
}
