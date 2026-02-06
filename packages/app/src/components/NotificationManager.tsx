import { useEffect, useRef } from 'react'
import { useEvents } from '../hooks/useEvents'
import { useNotifications } from '../hooks/useNotifications'
import type { SessionId } from '@afw/shared'

interface NotificationManagerProps {
  sessionIds: SessionId[]
  enableStepFailures?: boolean
  enableChainCompletions?: boolean
}

/**
 * Background component that monitors events and shows desktop notifications
 * for important events (step failures, chain completions)
 */
export function NotificationManager({
  sessionIds,
  enableStepFailures = true,
  enableChainCompletions = true,
}: NotificationManagerProps) {
  const { showNotification } = useNotifications()
  const processedEvents = useRef(new Set<string>())

  // Listen to all sessions
  const allEvents = sessionIds.flatMap((sessionId) =>
    useEvents(sessionId, ['step_failed', 'chain_complete', 'session_ended'])
  )

  useEffect(() => {
    if (allEvents.length === 0) return

    // Process only new events
    allEvents.forEach((event) => {
      const eventKey = `${event.sessionId}-${event.timestamp}-${event.type}`

      if (processedEvents.current.has(eventKey)) {
        return
      }

      processedEvents.current.add(eventKey)

      // Show notification based on event type
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
          const data = (event as any).data || {}
          const sessionId = event.sessionId

          showNotification({
            title: 'Session Ended',
            body: `Session ${sessionId} has completed`,
            urgency: 'low',
          })
          break
        }
      }
    })
  }, [allEvents, showNotification, enableStepFailures, enableChainCompletions])

  return null // This is a background component
}
