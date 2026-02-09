# Learnings from Registry API Implementation

## Issue
None — execution proceeded as expected.

## Root Cause
N/A

## Suggestion
N/A

## Fresh Eye Observations

### 1. Route Ordering Matters
The router processes routes in definition order. Specific static routes (`/packs`, `/stats`) MUST come before parameterized routes (`/:projectId/resolved`) to avoid the parameter catching them. This was corrected during implementation and serves as a good reminder for future route development.

### 2. RegistryStorage Already Existed
The RegistryStorage service was already implemented and thoroughly documented (lines 1-376), with support for:
- File-based persistence (atomic writes with temp files)
- Memory caching for performance
- Mutex-based write sequencing to prevent race conditions
- Pack installation/uninstallation with entry management

This suggests the registry system was well-planned before this phase, making implementation seamless.

### 3. LayerResolver Service Was Pre-Built
The LayerResolver service (lines 1-195) implements the full layer resolution algorithm:
- Core (priority 1) < Pack (priority 2) < Project (priority 3)
- Conflict detection and tracking
- Overridden entry detection
- Type-specific resolution (buttons, patterns)

This allowed the routes to focus purely on HTTP concerns without needing to implement the core logic.

### 4. Zod Validation Pattern
All routes in the codebase use Zod for validation. The pattern is:
1. Define schema at module level
2. Parse in route handler
3. Catch ZodError separately for 400 responses
4. Provide validation details in error response

This is critical for API usability.

### 5. Server Initialization Sequence
The server startup order matters:
1. Create Express app
2. Apply global middleware (CORS, auth, rate limit)
3. Mount routes
4. Start server
5. Initialize async services (like registry storage)

Registry storage initialization happens AFTER server listen to avoid blocking the port binding. Error handling exits the process if initialization fails.

### 6. Type-Driven Development
Using branded types from @afw/shared enforces correctness at the type level:
- `ProjectId`, `BehaviorPackId`, `RegistryEntryId`
- `RegistryEntry`, `ResolvedBehavior`, etc.

These prevent accidentally passing wrong types and provide self-documenting code.

### 7. Error Handling Strategy
The implementation distinguishes between:
- **Client errors (4xx)** — Invalid input, missing resources, conflicts
- **Server errors (5xx)** — Unexpected failures with logging

Each error type gets appropriate HTTP status and message.

## Recommendations for Future Work

1. **Endpoint Documentation** — Add OpenAPI/Swagger specs for these endpoints
2. **Client SDK** — Consider generating a TypeScript client from the API
3. **E2E Testing** — Test pack installation with actual entries
4. **Conflict Resolution UI** — Frontend component to resolve layer conflicts
5. **Performance** — Monitor registry initialization time as packs grow

## Code Metrics

- **Lines of Code** (registry.ts): 259
- **Endpoints**: 7
- **Zod Schemas**: 2
- **Error Codes**: 5 distinct types
- **Import Dependencies**: 6 external modules + services
- **TypeScript Errors**: 0
- **Build Time**: <100ms

## Testing Notes

Manual verification confirmed:
- Module loads without errors
- TypeScript compilation succeeds
- Route registration completes
- All imports resolve correctly
- No circular dependencies
- Type safety enforced throughout
