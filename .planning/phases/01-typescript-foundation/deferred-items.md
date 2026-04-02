# Phase 01 Deferred Items

## Pre-existing `as any` casts outside plan scope

20+ files in packages/backend/src/ contain pre-existing `as any` casts that are NOT caused by Phase 01 changes:
- middleware/authorize.ts, middleware/validatePath.ts
- routes/auth.ts, routes/capabilities.ts, routes/commands.ts, routes/files.ts, routes/harmony.ts, routes/harmonyHealth.ts, routes/terminal.ts, routes/users.ts
- services/agentValidator.ts, services/capabilityRegistry.ts, services/gateCheckpoint.ts, services/harmonyDetector.ts, services/healingRecommendations.ts, services/healthScoreCalculator.ts, services/evolutionService.ts, services/fileWatcher.ts
- surfaces/CLIAdapter.ts, surfaces/MobileAdapter.ts, surfaces/SlackAdapter.ts, surfaces/VSCodeAdapter.ts
- ws/handler.ts
- schemas/api.ts

## Pre-existing `as SessionId` branded casts in sessions.ts

30+ occurrences of `as SessionId` in packages/backend/src/routes/sessions.ts could be replaced with `toSessionId()` for full FOUND-02 compliance.

## Pre-existing frontend TypeScript errors

packages/app has TypeScript errors in:
- bundleAnalyzer.ts (web-vitals API changes)
- electron/main.ts (app.isQuitting)
- Multiple test files (unused variables, type mismatches)
- ChainDAG/index.ts (missing export)

These require separate frontend cleanup.
