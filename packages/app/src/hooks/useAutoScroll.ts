import { useRef, useCallback } from 'react';
import type { RefObject } from 'react';

/** Scroll distance threshold (px) to detect user scroll-up */
const SCROLL_THRESHOLD = 100;

export interface AutoScrollResult {
  /** Attach to the message list's onScroll handler */
  handleScroll: () => void;
  /** Smoothly scroll to the bottom and reset unread count */
  scrollToBottom: () => void;
  /** Call when a new message arrives to decide whether to auto-scroll */
  onNewMessage: (isUserMessage: boolean) => void;
  /** Whether the user has scrolled up from the bottom */
  isUserScrolled: RefObject<boolean>;
  /** Number of unread messages since user scrolled up */
  unreadCount: RefObject<number>;
}

/**
 * Auto-scroll hook with user-scroll-up detection.
 * Uses a 100px threshold from the bottom to determine if the user has scrolled up.
 * When the user is scrolled up, new messages increment the unread count instead of auto-scrolling.
 *
 * @param messageListRef - Ref to the scrollable message list container
 */
export function useAutoScroll(
  messageListRef: RefObject<HTMLDivElement | null>
): AutoScrollResult {
  const isUserScrolled = useRef(false);
  const unreadCount = useRef(0);

  const handleScroll = useCallback(() => {
    const el = messageListRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceFromBottom > SCROLL_THRESHOLD) {
      isUserScrolled.current = true;
    } else {
      isUserScrolled.current = false;
      unreadCount.current = 0;
    }
  }, [messageListRef]);

  const scrollToBottom = useCallback(() => {
    const el = messageListRef.current;
    if (!el) return;

    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    isUserScrolled.current = false;
    unreadCount.current = 0;
  }, [messageListRef]);

  const onNewMessage = useCallback(
    (isUserMessage: boolean) => {
      if (isUserMessage || !isUserScrolled.current) {
        scrollToBottom();
      } else {
        unreadCount.current++;
      }
    },
    [scrollToBottom]
  );

  return {
    handleScroll,
    scrollToBottom,
    onNewMessage,
    isUserScrolled,
    unreadCount,
  };
}
