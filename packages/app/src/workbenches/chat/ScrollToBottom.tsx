import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ScrollToBottomProps {
  visible: boolean;
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

/**
 * Floating scroll-to-bottom button with unread count badge.
 * Appears when user scrolls up from the bottom of the message list.
 */
export function ScrollToBottom({ visible, unreadCount, onClick, className }: ScrollToBottomProps) {
  if (!visible) return null;

  return (
    <div className={cn('absolute bottom-4 right-4 z-10 animate-fade-in', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClick}
                aria-label={`Scroll to bottom, ${unreadCount} new messages`}
                className="rounded-full w-8 h-8 bg-surface-3 border border-border shadow-md"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <Badge
                  variant="accent"
                  size="sm"
                  className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 min-w-[18px] flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>Scroll to new messages</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
