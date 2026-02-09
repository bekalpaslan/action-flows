# Test Results: all

## Summary
- **Passed:** 284
- **Failed:** 4
- **Skipped:** 0
- **Total Tests:** 288
- **Test Files:** 9 total (8 passed, 1 failed)
- **Coverage:** Not generated (test failure prevents coverage report)

## Failures

### Test File: src/storage/__tests__/redis.test.ts

**FAIL 1: should publish events to pub/sub channel on add**
- **Suite:** RedisStorage > Event Storage
- **File:** src/storage/__tests__/redis.test.ts:357:24
- **Assertion:** expected [] to have a length of 1 but got +0
- **Error:** Messages array is empty when expecting 1 item after pub/sub publish
- **Issue:** Pub/sub message delivery is not working as expected. The subscriber callback is not receiving messages from publish().

**FAIL 2: should subscribe and receive messages**
- **Suite:** RedisStorage > Pub/Sub
- **File:** src/storage/__tests__/redis.test.ts:1242:24
- **Assertion:** expected [] to include 'test-message'
- **Error:** Messages array is empty when expecting 'test-message'
- **Issue:** Pub/sub subscription callback is not being invoked when messages are published.

**FAIL 3: should handle multiple subscribers**
- **Suite:** RedisStorage > Pub/Sub
- **File:** src/storage/__tests__/redis.test.ts:1262:25
- **Assertion:** expected [] to include 'broadcast-message'
- **Error:** Multiple subscribers are not receiving published messages
- **Issue:** Both subscriber callbacks fail to receive messages from the same channel.

**FAIL 4: should only deliver to subscribed channels**
- **Suite:** RedisStorage > Pub/Sub
- **File:** src/storage/__tests__/redis.test.ts:1282:32
- **Assertion:** expected [] to include 'message-1'
- **Error:** Channel 1 subscriber array is empty when expecting 'message-1'
- **Issue:** Pub/sub routing by channel is not functioning - subscribers are not receiving channel-specific messages.

## Root Cause Analysis

**IDENTIFIED: Multiple Subscribers Per Channel Not Supported**

All 4 failures stem from a **critical design flaw in RedisStorage.subscribe()** (lines 675-689 in packages/backend/src/storage/redis.ts):

The problem:
- `subscriptionHandlers` Map uses channel name as key, allowing **only ONE handler per channel**
- When `subscribe(channel, callback1)` is called, then `subscribe(channel, callback2)` is called:
  - The second call **overwrites callback1 in the Map** (line 682)
  - The first handler is lost before it ever gets registered with the event listener
  - Only callback2 will ever receive messages

Why tests fail:
1. **Fail 1 & 2**: Single subscriber, but handler is overwritten before it gets attached
2. **Fail 3**: Two subscribers to same channel - second subscriber overwrites the first, so neither gets the message
3. **Fail 4**: Two channels with two subscribers - handlers overwrite each other in the Map

Additionally:
- Using `subClient.on('message', handler)` multiple times adds multiple listeners instead of managing them properly
- The handlers Map doesn't support the subscriber pattern that's being tested

**Solution**: Change handlers storage from `Map<string, handler>` to `Map<string, handler[]>` to support multiple subscribers per channel.

## Passing Test Suites (8 files)
- src/__tests__/confidenceScorer.test.ts: 19 tests ✓
- src/middleware/__tests__/errorHandler.test.ts: 14 tests ✓
- src/services/frequencyTracker.test.ts: 14 tests ✓
- src/storage/__tests__/memory.test.ts: 72 tests ✓
- src/storage/__tests__/filePersistence.test.ts: 39 tests ✓
- src/services/__tests__/fileWatcher.test.ts: 33 tests ✓

## Suggested Fixes

**Code Fix (packages/backend/src/storage/redis.ts):**

Line 89 - Change handlers storage:
```diff
- const subscriptionHandlers = new Map<string, (channel: string, message: string) => void>();
+ const subscriptionHandlers = new Map<string, Array<(channel: string, message: string) => void>>();
```

Lines 675-689 - Update subscribe() method:
```diff
async subscribe(channel: string, callback: (message: string) => void) {
  try {
    const handler = (subscribeChannel: string, message: string) => {
      if (subscribeChannel === channel) {
        callback(message);
      }
    };
-   subscriptionHandlers.set(channel, handler);
+   const handlers = subscriptionHandlers.get(channel) || [];
+   handlers.push(handler);
+   subscriptionHandlers.set(channel, handlers);
+
+   // Only subscribe once per channel
+   if (handlers.length === 1) {
+     subClient.on('message', handler);
+     await subClient.subscribe(channel);
+   } else {
+     subClient.on('message', handler);
+   }
    console.log(`[Redis] Subscribed to channel: ${channel}`);
  } catch (error) {
    console.error(`[Redis] Error subscribing to channel ${channel}:`, error);
  }
}
```

Lines 699-714 - Update disconnect() to iterate array:
```diff
- for (const [, handler] of subscriptionHandlers) {
+ for (const [, handlers] of subscriptionHandlers) {
+   for (const handler of handlers) {
      subClient.removeListener('message', handler);
+   }
```

## Execution Details
- **Framework:** Vitest 4.0.18
- **Backend Package:** @afw/backend
- **Test Duration:** 7.88s
- **Command:** pnpm -F @afw/backend test -- --coverage
