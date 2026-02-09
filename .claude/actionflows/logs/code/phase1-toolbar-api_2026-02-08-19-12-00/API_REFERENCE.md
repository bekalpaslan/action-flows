# Toolbar API Reference

## Base URL
```
POST/PUT/GET /api/toolbar/:projectId/...
```

## Endpoints

### 1. GET /api/toolbar/:projectId/config

Retrieve toolbar configuration for a project. Returns default config if none exists.

**Request:**
```bash
GET /api/toolbar/proj-123/config
```

**Response (200 OK):**
```json
{
  "maxSlots": 10,
  "slots": [
    {
      "buttonId": "btn-save",
      "pinned": true,
      "position": 0,
      "usageCount": 42,
      "lastUsed": 1707430320000
    },
    {
      "buttonId": "btn-run",
      "pinned": false,
      "position": 1,
      "usageCount": 28,
      "lastUsed": 1707430300000
    }
  ],
  "autoLearn": true,
  "showUsageCount": true
}
```

**Error Responses:**
```json
// 500 Internal Server Error
{
  "error": "Failed to fetch toolbar config",
  "message": "Error message details"
}
```

---

### 2. PUT /api/toolbar/:projectId/config

Update toolbar configuration for a project. Includes full validation.

**Request:**
```bash
PUT /api/toolbar/proj-123/config
Content-Type: application/json

{
  "maxSlots": 15,
  "slots": [
    {
      "buttonId": "btn-save",
      "pinned": true,
      "position": 0,
      "usageCount": 42,
      "lastUsed": 1707430320000
    }
  ],
  "autoLearn": true,
  "showUsageCount": true
}
```

**Response (200 OK):**
```json
{
  "maxSlots": 15,
  "slots": [...],
  "autoLearn": true,
  "showUsageCount": true
}
```

**Error Responses:**
```json
// 400 Bad Request - Invalid configuration
{
  "error": "Invalid configuration",
  "message": "Number of slots (15) exceeds maxSlots (10)"
}

// 400 Bad Request - Duplicate positions
{
  "error": "Invalid configuration",
  "message": "Duplicate slot position: 0"
}

// 400 Bad Request - Position out of range
{
  "error": "Invalid configuration",
  "message": "Slot position 15 exceeds maxSlots 10"
}

// 500 Internal Server Error
{
  "error": "Failed to update toolbar config",
  "message": "Error details"
}
```

---

### 3. POST /api/toolbar/:projectId/track

Track button usage and update toolbar state. Triggers auto-learning if enabled.

**Request:**
```bash
POST /api/toolbar/proj-123/track
Content-Type: application/json

{
  "buttonId": "btn-save",
  "sessionId": "session-456"
}
```

**Response (200 OK):**
```json
{
  "usageCount": 43,
  "sessionId": "session-456",
  "buttonId": "btn-save",
  "timestamp": 1707430400000
}
```

**What Happens:**
1. Finds or creates slot for buttonId
2. Increments usageCount
3. Updates lastUsed timestamp
4. If autoLearn is true:
   - Reorders unpinned slots by usage count
   - Uses lastUsed as tiebreaker
   - Preserves pinned slots
   - Trims excess slots if needed
5. Returns updated usage stats

**Error Responses:**
```json
// 400 Bad Request - Missing fields
{
  "error": "Validation error",
  "details": "buttonId is required"
}

// 500 Internal Server Error
{
  "error": "Failed to track button usage",
  "message": "Error details"
}
```

---

## Request Body Validation

### ToolbarConfig Schema
```typescript
{
  maxSlots: number (1-50, default: 10)
  slots: ToolbarSlot[] (default: [])
  autoLearn: boolean (default: true)
  showUsageCount: boolean (default: false)
}
```

### ToolbarSlot Schema
```typescript
{
  buttonId: string (1-100 chars, required)
  pinned: boolean (default: false)
  position: number (0-1000, required)
  usageCount: number (0+, default: 0)
  lastUsed: number (milliseconds since epoch, required)
}
```

### TrackButtonUsage Schema
```typescript
{
  buttonId: string (1-100 chars, required)
  sessionId: string (1-200 chars, required)
}
```

---

## Auto-Learning Algorithm

When a button is tracked and `autoLearn` is true:

1. **Find or Create Slot**
   - If button not in toolbar, create new slot at end

2. **Update Counters**
   - Increment usageCount by 1
   - Set lastUsed to current timestamp

3. **Reorder (Unpinned Slots Only)**
   - Sort by usageCount descending (most used first)
   - Use lastUsed as tiebreaker (most recent first)
   - Pinned slots keep their positions

4. **Trim If Needed**
   - If slots.length > maxSlots
   - Keep all pinned slots
   - Keep most-used unpinned slots
   - Remove least-used slots

5. **Reassign Positions**
   - Update all slot.position values (0 to maxSlots-1)

---

## Rate Limiting

- **GET:** General rate limit (shared with all API endpoints)
- **PUT:** Write rate limiter (stricter)
- **POST:** Write rate limiter (stricter)

Default: 100 requests per 15 minutes per IP

---

## Examples

### Example 1: Create New Toolbar

```bash
# 1. Get default config
curl -X GET http://localhost:3001/api/toolbar/proj-1/config

# Response shows empty slots with defaults
```

### Example 2: Track Button Usage

```bash
# 1. User clicks "Save" button
curl -X POST http://localhost:3001/api/toolbar/proj-1/track \
  -H "Content-Type: application/json" \
  -d '{"buttonId": "btn-save", "sessionId": "sess-1"}'

# Response:
# {
#   "usageCount": 1,
#   "sessionId": "sess-1",
#   "buttonId": "btn-save",
#   "timestamp": 1707430400000
# }

# 2. User clicks "Save" again
curl -X POST http://localhost:3001/api/toolbar/proj-1/track \
  -H "Content-Type: application/json" \
  -d '{"buttonId": "btn-save", "sessionId": "sess-2"}'

# Response shows usageCount: 2
```

### Example 3: Pin Frequently Used Button

```bash
# 1. Get current config
curl -X GET http://localhost:3001/api/toolbar/proj-1/config

# 2. Update config to pin the save button
curl -X PUT http://localhost:3001/api/toolbar/proj-1/config \
  -H "Content-Type: application/json" \
  -d '{
    "maxSlots": 10,
    "slots": [
      {
        "buttonId": "btn-save",
        "pinned": true,
        "position": 0,
        "usageCount": 42,
        "lastUsed": 1707430320000
      }
    ],
    "autoLearn": true,
    "showUsageCount": true
  }'
```

---

## Implementation Details

### Storage
- **Type:** In-memory Map (Phase 1)
- **Scope:** Per ProjectId
- **Persistence:** Not yet implemented (future phase)

### Type Safety
- All types imported from `@afw/shared`
- Branded types: ProjectId, ButtonId, Timestamp
- Full TypeScript strict mode

### Error Handling
- Sanitized error messages
- Comprehensive logging
- No sensitive data in responses

---

## Future Enhancements

1. **Persistence:** Save configs to Redis/Database
2. **WebSocket Events:** Broadcast toolbar changes
3. **Analytics:** Track usage trends per project
4. **Export:** Download toolbar configs as JSON
5. **Synchronization:** Sync configs across devices
6. **Templates:** Save toolbar presets as templates

