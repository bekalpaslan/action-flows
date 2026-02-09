# Storage Extension Implementation Details

## Overview
This document provides detailed code snippets of all implemented storage methods.

## File: packages/backend/src/storage/index.ts

### New Type Definitions

```typescript
/**
 * Filter options for bookmarks queries
 */
export interface BookmarkFilter {
  category?: BookmarkCategory;
  since?: Timestamp;
  userId?: UserId;
  tags?: string[];
}

/**
 * Filter options for pattern queries
 */
export interface PatternFilter {
  patternType?: PatternType;
  minConfidence?: number;
  since?: Timestamp;
}
```

### Storage Interface Extensions

```typescript
// Frequency tracking
trackAction(actionType: string, projectId?: ProjectId, userId?: UserId): void | Promise<void>;
getFrequency(actionType: string, projectId?: ProjectId): FrequencyRecord | undefined | Promise<FrequencyRecord | undefined>;
getTopActions(projectId: ProjectId, limit: number): FrequencyRecord[] | Promise<FrequencyRecord[]>;

// Bookmarks
addBookmark(bookmark: Bookmark): void | Promise<void>;
getBookmarks(projectId: ProjectId, filter?: BookmarkFilter): Bookmark[] | Promise<Bookmark[]>;
removeBookmark(bookmarkId: string): void | Promise<void>;

// Patterns (detected)
addPattern(pattern: DetectedPattern): void | Promise<void>;
getPatterns(projectId: ProjectId, filter?: PatternFilter): DetectedPattern[] | Promise<DetectedPattern[]>;
```

## File: packages/backend/src/storage/memory.ts

### Storage Structure

```typescript
// Frequency tracking
frequencies: new Map(),
trackAction(actionType: string, projectId?: ProjectId, userId?: UserId) {
  const key = projectId ? `${projectId}:${actionType}` : actionType;
  const now = new Date().toISOString();
  const today = now.split('T')[0]; // ISO date string (YYYY-MM-DD)

  const record = this.frequencies.get(key);
  if (record) {
    // Update existing record
    record.count++;
    record.lastSeen = now as Timestamp;
    record.dailyCounts[today] = (record.dailyCounts[today] || 0) + 1;
  } else {
    // Create new record
    const newRecord: FrequencyRecord = {
      actionType,
      projectId,
      userId,
      count: 1,
      firstSeen: now as Timestamp,
      lastSeen: now as Timestamp,
      dailyCounts: { [today]: 1 },
    };
    this.frequencies.set(key, newRecord);
  }
},

getFrequency(actionType: string, projectId?: ProjectId) {
  const key = projectId ? `${projectId}:${actionType}` : actionType;
  return this.frequencies.get(key);
},

getTopActions(projectId: ProjectId, limit: number) {
  const results: FrequencyRecord[] = [];
  this.frequencies.forEach((record) => {
    if (record.projectId === projectId) {
      results.push(record);
    }
  });
  // Sort by count descending
  results.sort((a, b) => b.count - a.count);
  return results.slice(0, limit);
},
```

### Bookmark Implementation

```typescript
// Bookmarks
bookmarks: new Map(),
addBookmark(bookmark: Bookmark) {
  this.bookmarks.set(bookmark.id, bookmark);
},

getBookmarks(projectId: ProjectId, filter?: BookmarkFilter) {
  const results: Bookmark[] = [];
  this.bookmarks.forEach((bookmark) => {
    if (bookmark.projectId !== projectId) return;

    // Apply category filter
    if (filter?.category && bookmark.category !== filter.category) return;

    // Apply userId filter
    if (filter?.userId && bookmark.userId !== filter.userId) return;

    // Apply timestamp filter (since)
    if (filter?.since) {
      const bookmarkTime = new Date(bookmark.timestamp).getTime();
      const sinceTime = new Date(filter.since).getTime();
      if (bookmarkTime < sinceTime) return;
    }

    // Apply tags filter
    if (filter?.tags && filter.tags.length > 0) {
      const hasTag = filter.tags.some((tag) => bookmark.tags.includes(tag));
      if (!hasTag) return;
    }

    results.push(bookmark);
  });
  return results;
},

removeBookmark(bookmarkId: string) {
  this.bookmarks.delete(bookmarkId);
},
```

### Pattern Implementation

```typescript
// Patterns (detected)
patterns: new Map(),
addPattern(pattern: DetectedPattern) {
  this.patterns.set(pattern.id, pattern);
},

getPatterns(projectId: ProjectId, filter?: PatternFilter) {
  const results: DetectedPattern[] = [];
  this.patterns.forEach((pattern) => {
    if (pattern.projectId !== projectId) return;

    // Apply pattern type filter
    if (filter?.patternType && pattern.patternType !== filter.patternType) return;

    // Apply confidence filter
    if (filter?.minConfidence !== undefined && pattern.confidence < filter.minConfidence) return;

    // Apply timestamp filter (since)
    if (filter?.since) {
      const patternTime = new Date(pattern.detectedAt).getTime();
      const sinceTime = new Date(filter.since).getTime();
      if (patternTime < sinceTime) return;
    }

    results.push(pattern);
  });
  return results;
},
```

## File: packages/backend/src/storage/redis.ts

### Frequency Tracking (Redis)

```typescript
async trackAction(actionType: string, projectId?: ProjectId, userId?: UserId) {
  try {
    const key = `${keyPrefix}freq:${projectId ? `${projectId}:` : ''}${actionType}`;
    const now = new Date().toISOString();
    const today = now.split('T')[0]; // ISO date string (YYYY-MM-DD)

    // Get existing record or create new one
    const existing = await redis.get(key);
    let record: FrequencyRecord;

    if (existing) {
      record = JSON.parse(existing) as FrequencyRecord;
      record.count++;
      record.lastSeen = now as Timestamp;
      record.dailyCounts[today] = (record.dailyCounts[today] || 0) + 1;
    } else {
      record = {
        actionType,
        projectId,
        userId,
        count: 1,
        firstSeen: now as Timestamp,
        lastSeen: now as Timestamp,
        dailyCounts: { [today]: 1 },
      };
    }

    // Store updated record with TTL (30 days)
    await redis.setex(key, 2592000, JSON.stringify(record));
  } catch (error) {
    console.error(`[Redis] Error tracking action ${actionType}:`, error);
  }
},

async getFrequency(actionType: string, projectId?: ProjectId) {
  try {
    const key = `${keyPrefix}freq:${projectId ? `${projectId}:` : ''}${actionType}`;
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as FrequencyRecord) : undefined;
  } catch (error) {
    console.error(`[Redis] Error getting frequency for ${actionType}:`, error);
    return undefined;
  }
},

async getTopActions(projectId: ProjectId, limit: number) {
  try {
    // Get all frequency keys for this project
    const pattern = `${keyPrefix}freq:${projectId}:*`;
    const keys = await redis.keys(pattern);

    const results: FrequencyRecord[] = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        results.push(JSON.parse(data) as FrequencyRecord);
      }
    }

    // Sort by count descending
    results.sort((a, b) => b.count - a.count);
    return results.slice(0, limit);
  } catch (error) {
    console.error(`[Redis] Error getting top actions for ${projectId}:`, error);
    return [];
  }
},
```

### Bookmarks (Redis)

```typescript
async addBookmark(bookmark: Bookmark) {
  try {
    const key = `${keyPrefix}bookmark:${bookmark.id}`;
    const projectKey = `${keyPrefix}bookmarks:${bookmark.projectId}`;
    // Store bookmark with 30 day TTL
    await redis.setex(key, 2592000, JSON.stringify(bookmark));
    // Add to project index
    await redis.sadd(projectKey, bookmark.id);
    await redis.expire(projectKey, 2592000);
  } catch (error) {
    console.error(`[Redis] Error adding bookmark ${bookmark.id}:`, error);
  }
},

async getBookmarks(projectId: ProjectId, filter?: BookmarkFilter) {
  try {
    const projectKey = `${keyPrefix}bookmarks:${projectId}`;
    const bookmarkIds = await redis.smembers(projectKey);

    const results: Bookmark[] = [];
    for (const id of bookmarkIds) {
      const key = `${keyPrefix}bookmark:${id}`;
      const data = await redis.get(key);
      if (data) {
        const bookmark = JSON.parse(data) as Bookmark;

        // Apply category filter
        if (filter?.category && bookmark.category !== filter.category) continue;

        // Apply userId filter
        if (filter?.userId && bookmark.userId !== filter.userId) continue;

        // Apply timestamp filter (since)
        if (filter?.since) {
          const bookmarkTime = new Date(bookmark.timestamp).getTime();
          const sinceTime = new Date(filter.since).getTime();
          if (bookmarkTime < sinceTime) continue;
        }

        // Apply tags filter
        if (filter?.tags && filter.tags.length > 0) {
          const hasTag = filter.tags.some((tag) => bookmark.tags.includes(tag));
          if (!hasTag) continue;
        }

        results.push(bookmark);
      }
    }
    return results;
  } catch (error) {
    console.error(`[Redis] Error getting bookmarks for ${projectId}:`, error);
    return [];
  }
},

async removeBookmark(bookmarkId: string) {
  try {
    const key = `${keyPrefix}bookmark:${bookmarkId}`;
    const data = await redis.get(key);
    if (data) {
      const bookmark = JSON.parse(data) as Bookmark;
      const projectKey = `${keyPrefix}bookmarks:${bookmark.projectId}`;
      await redis.srem(projectKey, bookmarkId);
    }
    await redis.del(key);
  } catch (error) {
    console.error(`[Redis] Error removing bookmark ${bookmarkId}:`, error);
  }
},
```

### Patterns (Redis)

```typescript
async addPattern(pattern: DetectedPattern) {
  try {
    const key = `${keyPrefix}pattern:${pattern.id}`;
    const projectKey = `${keyPrefix}patterns:${pattern.projectId}`;
    // Store pattern with 30 day TTL
    await redis.setex(key, 2592000, JSON.stringify(pattern));
    // Add to project index
    await redis.sadd(projectKey, pattern.id);
    await redis.expire(projectKey, 2592000);
  } catch (error) {
    console.error(`[Redis] Error adding pattern ${pattern.id}:`, error);
  }
},

async getPatterns(projectId: ProjectId, filter?: PatternFilter) {
  try {
    const projectKey = `${keyPrefix}patterns:${projectId}`;
    const patternIds = await redis.smembers(projectKey);

    const results: DetectedPattern[] = [];
    for (const id of patternIds) {
      const key = `${keyPrefix}pattern:${id}`;
      const data = await redis.get(key);
      if (data) {
        const pattern = JSON.parse(data) as DetectedPattern;

        // Apply pattern type filter
        if (filter?.patternType && pattern.patternType !== filter.patternType) continue;

        // Apply confidence filter
        if (filter?.minConfidence !== undefined && pattern.confidence < filter.minConfidence) continue;

        // Apply timestamp filter (since)
        if (filter?.since) {
          const patternTime = new Date(pattern.detectedAt).getTime();
          const sinceTime = new Date(filter.since).getTime();
          if (patternTime < sinceTime) continue;
        }

        results.push(pattern);
      }
    }
    return results;
  } catch (error) {
    console.error(`[Redis] Error getting patterns for ${projectId}:`, error);
    return [];
  }
},
```

## Usage Examples

### Tracking Actions
```typescript
// Track an action
await storage.trackAction('button-click', projectId, userId);

// Get frequency for action
const freq = await storage.getFrequency('button-click', projectId);
console.log(`Action count: ${freq?.count}`);

// Get top 10 actions for project
const topActions = await storage.getTopActions(projectId, 10);
```

### Managing Bookmarks
```typescript
// Add bookmark
const bookmark: Bookmark = {
  id: 'bm-123' as BookmarkId,
  sessionId: sessionId,
  messageIndex: 5,
  messageContent: 'The response was helpful',
  category: 'useful-pattern',
  explanation: 'Demonstrates pattern matching',
  timestamp: new Date().toISOString() as Timestamp,
  userId: userId,
  projectId: projectId,
  tags: ['pattern', 'matching']
};
await storage.addBookmark(bookmark);

// Query bookmarks with filters
const patterns = await storage.getBookmarks(projectId, {
  category: 'useful-pattern',
  tags: ['pattern'],
  since: '2024-01-01T00:00:00Z' as Timestamp
});

// Remove bookmark
await storage.removeBookmark('bm-123');
```

### Managing Patterns
```typescript
// Add detected pattern
const pattern: DetectedPattern = {
  id: 'pat-123' as PatternId,
  projectId: projectId,
  patternType: 'frequency',
  confidence: 0.95 as ConfidenceScore,
  description: 'High frequency button click pattern',
  actionType: 'button-click',
  relatedBookmarkIds: ['bm-123' as BookmarkId],
  detectedAt: new Date().toISOString() as Timestamp,
  lastSeen: new Date().toISOString() as Timestamp
};
await storage.addPattern(pattern);

// Query patterns with filters
const frequencyPatterns = await storage.getPatterns(projectId, {
  patternType: 'frequency',
  minConfidence: 0.8
});
```
