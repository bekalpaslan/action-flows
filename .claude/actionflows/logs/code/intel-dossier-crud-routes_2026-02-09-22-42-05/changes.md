# Intel Dossier CRUD Routes Implementation

## Summary

Successfully implemented Steps 4 and 5 from the Intel Dossier plan: Dossier CRUD routes and Suggestion Box routes.

## Files Created

### 1. `packages/backend/src/routes/dossiers.ts`

New Express router for Intel Dossier management with the following endpoints:

- **POST /api/dossiers** - Create new dossier
  - Validates with `createDossierSchema`
  - Generates `DossierId` via `createDossierId()`
  - Sets `createdAt`/`updatedAt` to ISO strings
  - Initializes `analysisCount=0`, `status='idle'`, `layoutDescriptor=null`, `history=[]`, `error=null`
  - Returns 201 Created

- **GET /api/dossiers** - List all dossiers
  - Returns `{ dossiers, count }`

- **GET /api/dossiers/:id** - Get dossier by ID
  - Returns dossier or 404 if not found

- **PUT /api/dossiers/:id** - Update dossier metadata
  - Updates `name`, `targets`, `context`
  - Updates `updatedAt` timestamp
  - Uses `writeLimiter` middleware
  - Validates with `updateDossierSchema`

- **DELETE /api/dossiers/:id** - Delete dossier
  - Returns 404 if not found
  - Uses `writeLimiter` middleware

- **GET /api/dossiers/:id/history** - Get dossier history entries
  - Returns `{ dossierId, count, history }`

- **POST /api/dossiers/:id/analyze** - Trigger analysis
  - Sets `status='analyzing'`
  - Updates `updatedAt`
  - Increments `analysisCount`
  - Clears `error` field
  - Returns 202 Accepted
  - **Phase 1**: Just status update, no agent spawning
  - Checks for existing analysis and returns 409 if already analyzing (unless `force=true`)
  - Uses `writeLimiter` middleware
  - Validates with `triggerAnalysisSchema`

### 2. `packages/backend/src/routes/suggestions.ts`

New Express router for Widget Suggestion management with the following endpoints:

- **GET /api/suggestions** - List all suggestions
  - Returns suggestions sorted by frequency descending
  - Returns `{ count, suggestions }`

- **GET /api/suggestions/:id** - Get suggestion by ID
  - Returns suggestion or 404 if not found

- **POST /api/suggestions** - Create suggestion
  - Validates with `createSuggestionSchema`
  - **Smart deduplication**: If matching `needed` widget type already exists, increments frequency instead of creating duplicate
  - Generates `SuggestionId` via `createSuggestionId()`
  - Sets initial `frequency=1` for new suggestions
  - Sets `type='widget_suggestion'`
  - Returns `{ created, incremented, suggestion }` to indicate what action was taken
  - Uses `writeLimiter` middleware

- **DELETE /api/suggestions/:id** - Dismiss/delete suggestion
  - Returns 404 if not found
  - Uses `writeLimiter` middleware

- **POST /api/suggestions/:id/promote** - Mark as promoted
  - **Phase 1**: Returns info only, no actual widget creation
  - Returns success message with `nextSteps` array describing Phase 2 behavior
  - Uses `writeLimiter` middleware

## Files Modified

### `packages/backend/src/index.ts`

1. **Imports added:**
   - `import dossiersRouter from './routes/dossiers.js';`
   - `import suggestionsRouter from './routes/suggestions.js';`

2. **Routes mounted:**
   - `app.use('/api/dossiers', dossiersRouter);`
   - `app.use('/api/suggestions', suggestionsRouter);`

## Implementation Details

### Patterns Followed

- **Express Router pattern** - Consistent with existing route files (sessions.ts, etc.)
- **Async/await** - All storage operations wrapped with `Promise.resolve()` to handle both sync and async storage
- **Zod validation** - All POST/PUT routes use `validateBody` middleware with schemas from `schemas/api.ts`
- **Rate limiting** - All write operations (POST/PUT/DELETE) use `writeLimiter` middleware
- **Error handling** - All routes use try/catch with `sanitizeError()` for safe error messages
- **Branded types** - Uses `DossierId`, `SuggestionId` from `@afw/shared`
- **Factory functions** - Uses `createDossierId()`, `createSuggestionId()` for ID generation
- **Logging** - Console logs for all mutations with descriptive messages
- **HTTP status codes** - Proper codes (201 Created, 202 Accepted, 404 Not Found, 409 Conflict, 500 Internal Server Error)

### Storage Interface Usage

Routes correctly use the Storage interface methods:
- `storage.getDossier(id)`
- `storage.setDossier(dossier)`
- `storage.listDossiers()`
- `storage.deleteDossier(id)`
- `storage.getSuggestion(id)`
- `storage.listSuggestions()`
- `storage.addSuggestion(suggestion)`
- `storage.deleteSuggestion(id)`
- `storage.incrementSuggestionFrequency(id)`

All methods wrapped with `Promise.resolve()` to support both MemoryStorage (sync) and RedisStorage (async).

### Phase 1 Limitations

Both route files include Phase 1 limitations as specified:

1. **Dossier Analysis** - `/api/dossiers/:id/analyze` only marks status, doesn't spawn agents
2. **Suggestion Promotion** - `/api/suggestions/:id/promote` returns info only, doesn't create widgets

These will be implemented in Phase 2.

## Verification

Type check passed successfully:
```
pnpm -F @afw/backend type-check
```

No TypeScript errors.

## Next Steps (for Phase 2)

1. Implement actual analysis agent spawning in `/api/dossiers/:id/analyze`
2. Implement widget creation in `/api/suggestions/:id/promote`
3. Add WebSocket broadcasts for dossier status changes
4. Add WebSocket broadcasts for suggestion frequency updates
