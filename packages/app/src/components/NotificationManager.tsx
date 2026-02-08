import { useEffect, useRef } from 'react'
import { useWebSocketContext } from '../contexts/WebSocketContext'
import { useNotifications } from '../hooks/useNotifications'
import type { SessionId, WorkspaceEvent } from '@afw/shared'

interface NotificationManagerProps {
  sessionIds: SessionId[]
  enableStepFailures?: boolean
  enableChainCompletions?: boolean
}

const WATCHED_TYPES = new Set(['step_failed', 'chain_complete', 'session_ended'])

/**
 * Background component that monitors events and shows desktop notifications
 * for important events (step failures, chain completions)
 *
 * NOTE: Cannot use useEvents() in a loop — that violates Rules of Hooks
 * because the number of hook calls changes when sessionIds.length changes.
 * Instead we subscribe/unsubscribe directly via the WebSocket context.
 */
export function NotificationManager({
  sessionIds,
  enableStepFailures = true,
  enableChainCompletions = true,
}: NotificationManagerProps) {
  const { showNotification } = useNotifications()
  const { subscribe, unsubscribe, onEvent } = useWebSocketContext()
  const processedEvents = useRef(new Set<string>())

  // Subscribe to all watched sessions
  useEffect(() => {
    sessionIds.forEach((id) => subscribe(id))
    return () => {
      sessionIds.forEach((id) => unsubscribe(id))
    }
  }, [sessionIds, subscribe, unsubscribe])

  // Listen for events from all watched sessions
  useEffect(() => {
    if (!onEvent) return

    const sessionSet = new Set(sessionIds)

    const handleEvent = (event: WorkspaceEvent) => {
      if (!sessionSet.has(event.sessionId as SessionId)) return
      if (!WATCHED_TYPES.has(event.type)) return

      const eventKey = `${event.sessionId}-${event.timestamp}-${event.type}`
      if (processedEvents.current.has(eventKey)) return
      processedEvents.current.add(eventKey)

      switch (event.type) {
        case 'step_failed': {
          if (!enableStepFailures) return
          const data = (event as any).data || {}
          const stepNumber = data.stepNumber || data.step || '?'
          const action = data.action || 'step'
          const error = data.error || 'Unknown error'

          showNotification({
            title: `Step #${stepNumber} Failed`,
            body: `Action: ${action}\nError: ${error}`,
            urgency: 'critical',
          })
          break
        }

        case 'chain_complete': {
          if (!enableChainCompletions) return
          const data = (event as any).data || {}
          const chainTitle = data.title || 'Chain'
          const totalSteps = data.totalSteps || 0
          const duration = data.duration || 0

          showNotification({
            title: `Chain Complete: ${chainTitle}`,
            body: `Completed ${totalSteps} steps in ${Math.round(duration / 1000)}s`,
            urgency: 'normal',
          })
          break
        }

        case 'session_ended': {
          showNotification({
            title: 'Session Ended',
            body: `Session ${event.sessionId} has completed`,
            urgency: 'low',
          })
          break
        }
      }
    }

    const unregister = onEvent(handleEvent)
    return () => { unregister() }
  }, [sessionIds, onEvent, showNotification, enableStepFailures, enableChainCompletions])

  return null // This is a background component
}
