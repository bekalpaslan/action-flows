/**
 * Chain Compilation Detector
 * Detects Format 1.1 chain compilation patterns in message text
 */

import type { ChainId } from '@afw/shared';

export interface ChainCompilationInfo {
  /** Chain title from "## Chain: {title}" */
  title: string;
  /** Chain ID (must be provided from session.currentChain.id) */
  chainId: ChainId;
  /** Full chain compilation text */
  raw: string;
}

/**
 * Detect if a message contains a Format 1.1 chain compilation
 * Pattern: /^## Chain: (.+)$/m
 *
 * @param text - Message text to check
 * @returns true if chain compilation detected
 */
export function isChainCompilation(text: string): boolean {
  return /^## Chain: (.+)$/m.test(text);
}

/**
 * Extract chain compilation info from message text
 *
 * @param text - Message text containing chain compilation
 * @param chainId - Chain ID from session.currentChain.id
 * @returns ChainCompilationInfo or null if not a chain compilation
 */
export function extractChainCompilation(
  text: string,
  chainId?: ChainId
): ChainCompilationInfo | null {
  if (!isChainCompilation(text)) return null;

  const match = text.match(/^## Chain: (.+)$/m);
  if (!match) return null;

  // Chain ID must be provided from session context
  if (!chainId) {
    console.warn('[ChainDetector] Chain compilation detected but chainId not provided');
    return null;
  }

  return {
    title: match[1],
    chainId,
    raw: text,
  };
}
