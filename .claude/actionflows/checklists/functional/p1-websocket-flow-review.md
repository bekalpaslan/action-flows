# WebSocket Flow Review (P1 - High Priority)

## Purpose

Validate real-time WebSocket communication, event broadcast, client reconnection, and state synchronization. These items ensure clients receive live updates, handle disconnects gracefully, and maintain consistent state across multiple observers.

---

## Checklist

| # | Check | Pass Criteria | Severity |
|---|-------|---------------|----------|
| 1 | WebSocket Connection Establishment | Client establishes WebSocket connection to server on component mount. Connection URL and port are correct. Handshake completes successfully. Connection is logged/tracked on server. | **HIGH** |
| 2 | Authentication Handshake | WebSocket connection includes authentication token (JWT or session token) in handshake. Server validates token before accepting connection. Unauthenticated connections rejected with error code. Token is verified on each message. | **HIGH** |
| 3 | Real-Time State Updates | Client receives WebSocket events when session/chain/step state changes on server. Events contain complete updated state data. Events propagate within < 1 second on LAN. UI updates immediately upon event receipt. | **HIGH** |
| 4 | Session-Specific Event Routing | Events from one session only broadcast to clients subscribed to that session. Client subscriptions filtered by SessionId on server. No cross-session event leakage occurs. Event routing handles multiple subscribers correctly. | **HIGH** |
| 5 | Reconnection Logic | When client loses connection, reconnection is attempted automatically with backoff strategy. Backoff delays increase exponentially (1s, 2s, 4s, 8s, max 30s). Reconnection doesn't spam server. Reconnection UI state shown to user. | **HIGH** |
| 6 | Stale State Recovery | After reconnection, client receives full session state sync to recover lost updates. Full state sync includes all chains, steps, and metadata. Client state merged/replaced with server state without conflicts. No duplicate events processed. | **HIGH** |
| 7 | Multiple Client Observers | Multiple clients can connect and observe the same session simultaneously. All clients receive state updates when any client sends a command. Session state consistent across all connected clients. | **HIGH** |
| 8 | Event Ordering Preservation | Events from server are received in order (no out-of-order updates). Server timestamps or sequence numbers preserve event order. Client processes events sequentially, not in parallel. State never regresses to an earlier version. | **HIGH** |
| 9 | Server-Side Broadcast Targeting | Server broadcasts events only to clients subscribed to affected SessionId. Broadcast uses correct WebSocket message format. Event payload includes all necessary state data. No events lost due to broadcast failures. | **HIGH** |
| 10 | Connection Cleanup on Unmount | When client component unmounts, WebSocket connection is closed cleanly. Server removes client from subscriber list. No memory leaks or orphaned connections on client. Server-side subscribers cleaned up after disconnect. | **HIGH** |
| 11 | Heartbeat/Keep-Alive Mechanism | Server sends periodic heartbeat/ping to keep connection alive. Client responds with pong within timeout window. Stale connections detected and closed after no pong response. Heartbeat prevents proxy/firewall disconnects. | **HIGH** |
| 12 | Large Payload Handling | WebSocket messages with large payloads (e.g., step with large input/output) transmitted without timeout or truncation. Payloads may be paginated if exceeding threshold, with clear truncation indicators. Large payloads don't freeze UI. | **MEDIUM** |
| 13 | Error Event Surfacing | When an error occurs on server, error event is sent to connected clients. Error includes error code, message, and context (SessionId, ChainId, StepId if applicable). Client UI displays error in user-friendly manner. | **HIGH** |
| 14 | Connection Timeout Handling | If server does not receive client pong after heartbeat, connection closed. If client does not receive server heartbeat, reconnection triggered. Timeout values configurable and reasonable (> 30s). | **MEDIUM** |

---

## Notes

WebSocket is the primary communication channel for real-time updates. Connection reliability, state sync, and event delivery order are critical for a responsive dashboard. Test reconnection scenarios under network failure conditions.
