/**
 * useFlowAnimations - Hook for coordinating flow visualization animations
 * Listens to WebSocket events and triggers node/edge animations
 */

import { useEffect, useRef, useCallback } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { SessionId, StepNumber } from '@afw/shared';
import { eventGuards } from '@afw/shared';

export interface AnimationQueueItem {
  type: 'node' | 'edge';
  stepNumber?: StepNumber;
  edgeId?: string;
  animation: string;
  timestamp: number;
}

export interface FlowAnimationCallbacks {
  onStepSpawned?: (stepNumber: StepNumber) => void;
  onStepStarted?: (stepNumber: StepNumber) => void;
  onStepCompleted?: (stepNumber: StepNumber) => void;
  onStepFailed?: (stepNumber: StepNumber) => void;
  onChainCompiled?: () => void;
  onChainRecompiled?: () => void;
}

const ANIMATION_STAGGER_DELAY = 100; // ms between simultaneous animations
const MAX_QUEUE_SIZE = 50;

/**
 * Hook to manage flow visualization animations based on WebSocket events
 */
export function useFlowAnimations(
  sessionId: SessionId | null,
  callbacks?: FlowAnimationCallbacks
) {
  const { onEvent } = useWebSocketContext();
  const animationQueue = useRef<AnimationQueueItem[]>([]);
  const processingQueue = useRef(false);
  const lastChainId = useRef<string | null>(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref up to date
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  /**
   * Add animation to queue with staggering support
   */
  const queueAnimation = useCallback((item: AnimationQueueItem) => {
    // Limit queue size to prevent memory issues
    if (animationQueue.current.length >= MAX_QUEUE_SIZE) {
      console.warn('Animation queue full, dropping oldest animation');
      animationQueue.current.shift();
    }

    animationQueue.current.push(item);

    // Start processing if not already running
    if (!processingQueue.current) {
      processAnimationQueue();
    }
  }, []);

  /**
   * Process animation queue with staggering
   */
  const processAnimationQueue = useCallback(() => {
    if (animationQueue.current.length === 0) {
      processingQueue.current = false;
      return;
    }

    processingQueue.current = true;
    const item = animationQueue.current.shift()!;

    // Trigger animation callback using ref to avoid stale closures
    if (item.type === 'node' && item.stepNumber) {
      switch (item.animation) {
        case 'spawn':
          callbacksRef.current?.onStepSpawned?.(item.stepNumber);
          break;
        case 'start':
          callbacksRef.current?.onStepStarted?.(item.stepNumber);
          break;
        case 'complete':
          callbacksRef.current?.onStepCompleted?.(item.stepNumber);
          break;
        case 'fail':
          callbacksRef.current?.onStepFailed?.(item.stepNumber);
          break;
      }
    }

    // Schedule next animation with stagger delay
    setTimeout(() => {
      processAnimationQueue();
    }, ANIMATION_STAGGER_DELAY);
  }, []);

  /**
   * Handle WebSocket events and trigger animations
   */
  useEffect(() => {
    if (!onEvent || !sessionId) return;

    const unsubscribe = onEvent((event) => {
      // Filter events for this session only
      if (event.sessionId !== sessionId) return;

      // Handle step events
      if (eventGuards.isStepSpawned(event)) {
        queueAnimation({
          type: 'node',
          stepNumber: event.stepNumber,
          animation: 'spawn',
          timestamp: Date.now(),
        });
      }

      if (eventGuards.isStepStarted(event)) {
        queueAnimation({
          type: 'node',
          stepNumber: event.stepNumber,
          animation: 'start',
          timestamp: Date.now(),
        });
      }

      if (eventGuards.isStepCompleted(event)) {
        queueAnimation({
          type: 'node',
          stepNumber: event.stepNumber,
          animation: 'complete',
          timestamp: Date.now(),
        });
      }

      if (eventGuards.isStepFailed(event)) {
        queueAnimation({
          type: 'node',
          stepNumber: event.stepNumber,
          animation: 'fail',
          timestamp: Date.now(),
        });
      }

      // Handle chain compilation events
      if (eventGuards.isChainCompiled(event)) {
        const currentChainId = event.chainId;

        // Detect recompilation (new chain after existing one)
        if (lastChainId.current && lastChainId.current !== currentChainId) {
          callbacksRef.current?.onChainRecompiled?.();
        } else {
          callbacksRef.current?.onChainCompiled?.();
        }

        lastChainId.current = currentChainId || null;
      }
    });

    return unsubscribe;
  }, [onEvent, sessionId, queueAnimation, callbacks]);

  /**
   * Clean up queue on unmount
   */
  useEffect(() => {
    return () => {
      animationQueue.current = [];
      processingQueue.current = false;
    };
  }, []);

  return {
    queueAnimation,
    queueSize: animationQueue.current.length,
  };
}
