# Learnings Registry

> Agent-surfaced learnings, logged by the orchestrator.

## Entries

### L001: Second-Opinion CLI fails on Windows when log folder doesn't exist
- **Date:** 2026-02-09
- **From:** second-opinion/ (haiku) during audit-and-fix/ chain
- **Issue:** CLI `--output` path targets a folder created by the agent via `create-log-folder`, but on Windows the CLI's `writeFile` throws ENOENT if the directory doesn't exist yet. Critique data survived in stderr but the report file was never written.
- **Root Cause:** The `create-log-folder` abstract action ran in the agent context, but the CLI is a separate Node process that doesn't inherit the agent's filesystem setup. The CLI assumes the output directory already exists.
- **Fix Options:**
  1. Add `mkdir -p` (or `fs.mkdir recursive`) inside the CLI before writing output
  2. Harden `create-log-folder` to verify directory exists before passing path to CLI
- **Status:** Closed (dissolved) — `packages/second-opinion/src/cli.ts` has `mkdir(dirname(args.outputPath), { recursive: true })` before writeFile

### L002: Deferred Field Implementation Creates Silent Behavior Gaps
- **Date:** 2026-02-09
- **From:** analyze/ (sonnet) during "Custom Prompt Button post-delivery analysis" chain
- **Issue:** Conversion logic in `useCustomPromptButtons` hardcodes `contexts: ['general']` without documenting the deferral, making the gap invisible to future developers
- **Root Cause:** Types and backend schema were implemented for `contextPatterns`, but the hook silently hardcoded a fallback instead of gracefully handling the missing UI input
- **Fix:** When deferring UI for optional fields, add explicit `// TODO: Implement {field} conversion when UI is added` at each hardcoded fallback site
- **Status:** Closed (dissolved) — Generic pattern documented in MEMORY.md § Spawn Prompt Discipline

### L003: Bundled Commits Obscure Feature Traceability
- **Date:** 2026-02-09
- **From:** analyze/ (sonnet) during "Custom Prompt Button post-delivery analysis" chain
- **Issue:** Commit title focused on infrastructure fix (`fix: WebSocket heartbeat keepalive`) instead of the primary feature (Custom Prompt Button), making the feature harder to discover in git history
- **Root Cause:** Multiple unrelated changes bundled into a single commit with wrong title emphasis
- **Fix:** Use `feat:` prefix for the primary feature as commit title. List infrastructure fixes as secondary bullets, or split into separate commits
- **Status:** Closed (lesson logged, no code fix needed)

### L004: Chrome MCP Profile Lock Blocks E2E Tests
- **Date:** 2026-02-10
- **From:** orchestrator during e2e-chrome-mcp/ chain execution
- **Issue:** Chrome DevTools MCP server fails with "browser already running" when another Chrome instance uses the same `chrome-devtools-mcp/chrome-profile` directory
- **Root Cause:** MCP server uses a single user data directory without isolation. Previous Claude Code sessions leave Chrome processes running
- **Fix:** Close all Chrome instances before running Chrome MCP tests. Consider `--isolated` flag or documenting prerequisite in test README
- **Status:** Closed (documented in test README)

### L005: Dashboard Chat Messages Are Frontend-Only State
- **Date:** 2026-02-10
- **From:** orchestrator during e2e-chrome-mcp/ test execution (Step 12)
- **Issue:** `GET /api/sessions/:id/chat` returns empty — user messages sent from the dashboard are stored in React state, not persisted to the backend chat API
- **Root Cause:** `POST /api/sessions/:id/input` queues input for the session but doesn't add it to the chat history endpoint. Chat display is managed by `useChatMessages` hook locally
- **Fix:** Not a bug — by design. E2E tests should verify message display in DOM, not backend chat API
- **Status:** Closed (test step marked `onFailure: 'continue'`)

### L006: New Sessions Appear in RECENT, Not ACTIVE
- **Date:** 2026-02-10
- **From:** orchestrator during e2e-chrome-mcp/ test execution (Step 6)
- **Issue:** Session created via `POST /api/sessions` gets status `pending`, which the sidebar sorts into "RECENT" section. Only `in_progress` sessions appear under "ACTIVE"
- **Root Cause:** Session status lifecycle: `pending` → `in_progress` (when chain starts). Dashboard sidebar groups by status, not creation time
- **Fix:** E2E assertions should check for either "ACTIVE" or "RECENT" section. Test updated accordingly
- **Status:** Closed (test assertion fixed)

### L007: Code Agent Selector Naming Drift
- **Date:** 2026-02-10
- **From:** review/ (sonnet) during e2e-chrome-mcp/ chain
- **Issue:** Code agent used `conversation-panel__input` and `conversation-panel__send-btn` instead of actual CSS classes `chat-panel__input-field` and `chat-panel__send-btn`
- **Root Cause:** Agent inferred selector names from component names rather than reading actual CSS. Analysis report had correct names but code agent deviated
- **Fix:** Corrected selectors in `chrome-mcp-utils.ts`. Future: include actual CSS class names explicitly in code agent spawn prompt inputs
- **Status:** Closed (selectors corrected)

### L008: Agent writes flat file instead of nested path on Windows
- **Date:** 2026-02-10
- **From:** code/ agent during contract-fixes chain
- **Issue:** Agent used full absolute path as a flat filename (e.g., `D:ActionFlowsDashboard.claude...changes.md`) instead of creating nested directories. Result was a 3.5KB junk file at the project root.
- **Root Cause:** Agent's `Write` call used the absolute path as a single filename string without proper separator handling. Likely concatenated path segments without `/` or `\`.
- **Fix:** Deleted junk file. Correct version existed at proper nested path. Future: agents should use `_abstract/create-log-folder/` before writing, which ensures the directory tree exists.
- **Status:** Closed (junk file removed)

### L009: CRLF Line Endings Break JS Regex Multiline Anchors
- **Date:** 2026-02-10
- **From:** code/frontend/ (haiku) during contract-compliance-425-fix chain (Batch C)
- **Issue:** All 425 contract compliance tests failed. Root cause was CRLF (`\r\n`) line endings in `.contract.md` files on Windows. JS regex multiline mode (`^` and `$`) matches before `\n`, but CRLF introduces `\r` before `\n`, causing `$` to not match at the expected position and `^` to see `\r` as part of the line.
- **Root Cause:** Windows git `core.autocrlf=true` converts LF→CRLF on checkout. Contract test suite uses multiline regex patterns like `(?=^## [^#]|$)` that assume LF-only line endings.
- **Fix:** Converted all 100 contract files from CRLF→LF. Added `.gitattributes` rule (`*.contract.md text eol=lf`) to enforce LF on all platforms.
- **Status:** Closed (commit `646a360`)

### L010: Stale Failure Manifests Cause Batch Agent Misrouting
- **Date:** 2026-02-10
- **From:** code/frontend/ (haiku) Batch A during contract-compliance-425-fix chain
- **Issue:** Analysis agent generated a failure manifest with contract paths that no longer matched the codebase (contracts had been reorganized into subdirectories). Batch A agent found 0 of 9 referenced contracts at the specified paths and was blocked.
- **Root Cause:** Manifest was generated at analysis time but contract directory structure had been refactored. No validation step between manifest generation and batch dispatch.
- **Fix:** Future: Add path validation to manifest generation (verify all referenced files exist). Or have code agents glob for contracts by name rather than relying on absolute paths.
- **Status:** Closed (dissolved) — `actions/analyze/agent.md` § Path Validation now requires exist checks on manifest paths before finalizing

### L011: Parallel Batch Agents May Collide on Same File
- **Date:** 2026-02-10
- **From:** orchestrator observation during contract-compliance-425-fix chain
- **Issue:** Batch B and Batch D both modified `ChatPanel.contract.md`. Batch B expanded sections, Batch D reorganized Test Hooks. Since both ran in parallel, the last writer won.
- **Root Cause:** Batch assignments overlapped — ChatPanel was in both Batch B (Workbench+SessionPanel domain) and Batch D (remaining contracts including health selector fixes). No exclusive file locking between parallel agents.
- **Fix:** When partitioning work into parallel batches, ensure file-level exclusivity — no contract should appear in more than one batch. Use the manifest to deduplicate assignments before dispatching.
- **Status:** Closed (lesson logged, no data loss in this case)

### L012: Flow Registration Without Instructions File Creates Orphans
- **Date:** 2026-02-10
- **From:** orchestrator observation during flow audit
- **Issue:** 4 flows (`cli-integration-test/`, `e2e-chrome-mcp/`, `contract-index/`, `contract-compliance-audit/`) were registered in FLOWS.md and CONTEXTS.md but never got `instructions.md` files created in `flows/`. The orchestrator can route to them but has no execution instructions.
- **Root Cause:** Flow registration was treated as a registry line edit (direct action), but creating the instructions file requires a code agent. The two steps were decoupled — the registry edit happened immediately, but the instructions creation was never queued as a follow-up. No validation exists to check that a registered flow has a corresponding instructions file.
- **Fix:** When registering a flow, ALWAYS queue a follow-up `flow-creation/` chain or quick-triage the instructions file in the same turn. Add a `framework-health/` check that validates all FLOWS.md entries have matching `instructions.md` files.
- **Status:** Closed (all 4 orphans fixed in commit 64697e5). Note: template-creation/ discovered as new orphan during 2026-02-14 health protocol.

### L013: Post-Chain Completion Gates Skipped Without Enforcement Checklist
- **Date:** 2026-02-11
- **From:** orchestrator self-observation during contract-reorganization chain
- **Issue:** After chain completed (7 steps, commit done), orchestrator skipped Gates 12-14: no INDEX.md entry, no LEARNINGS.md check, no flow candidate evaluation. Only Gate 11 (completion summary table) was executed.
- **Root Cause:** ORCHESTRATOR.md had "Next-Step Anticipation" as a single line ("auto-compile the follow-up chain") but no mandatory post-chain completion checklist. Gates 11-14 existed in GATE_STRUCTURE.md as documentation but had no prescriptive enforcement in the orchestrator's execution instructions.
- **Fix:** Added "### Post-Chain Completion Protocol (Mandatory)" to ORCHESTRATOR.md with 5-step numbered checklist (Gate 11 summary → Gate 12 INDEX.md → Gate 13 learnings → Gate 14 flow candidate → next-step anticipation). Includes "Critical" enforcement note.
- **Status:** Closed (ORCHESTRATOR.md updated)

### L014: Contract Restructuring — Move Content, Don't Leave Duplicates
- **Date:** 2026-02-11
- **From:** review/ (sonnet) during contract-reorganization chain
- **Issue:** After migrating Parse Inputs and Generate Output content to Input/Output Contract sections, two agent.md files (code/, plan/) still had redundant output format templates in their Steps sections.
- **Root Cause:** Migration moved content to new contract sections but didn't fully remove the originals from Steps subsections. Single-pass migration without deduplication check.
- **Fix:** Review agent removed the duplicates in review-and-fix mode. Future: when restructuring agent.md files, add a verification pass that checks for content appearing in both contract sections AND steps sections.
- **Status:** Closed (duplicates removed during review)

### L015: Requirements Validation Against Type Definitions
- **Date:** 2026-02-11
- **From:** code/frontend/ (sonnet) during Phase 5 Batch C implementation
- **Issue:** Requirements specified implementing themes for "squad" and "command" regions that don't exist in the system architecture. The actual 13 navigation targets are defined in `workbenchTypes.ts` as 9 stars + 3 tools + 1 harmony, not an arbitrary list including "squad" and "command".
- **Root Cause:** Requirements document was written before verifying the actual `WorkbenchId` type definitions in `packages/shared/src/workbenchTypes.ts`. Plan assumed 13 regions without validating against source of truth.
- **Fix:** When implementing cross-layer features (themes spanning backend types + frontend styles), always read the shared types first to verify the exact entities that need theming. Don't assume requirements are correct without validation against type definitions.
- **Status:** Closed (Batch C discovered all themes already implemented correctly per actual types)

### L016: Review Severity Classification Consistency
- **Date:** 2026-02-11
- **From:** second-opinion/ (qwen2.5-coder:7b) during Phase 5 final review
- **Issue:** Second opinion flagged a "missed issue" (returnTimeout cleanup) that was actually identified by the review as Finding #2, but with different severity interpretation. Review classified it as "non-critical" (low severity), second opinion argued it should be elevated as a "best practice improvement".
- **Root Cause:** Review and second opinion use slightly different criteria for severity classification. Review categorized it as low-severity based on component lifecycle (WorkbenchLayout rarely unmounts), second opinion focused on potential memory leak pattern regardless of frequency.
- **Fix:** For future reviews, clarify severity levels (CRITICAL/HIGH/MEDIUM/LOW) upfront in spawn prompts so second opinion uses consistent thresholds. Consider defining severity criteria in review/agent.md: CRITICAL=blocks production, HIGH=significant quality impact, MEDIUM=should fix, LOW=nice to have.
- **Status:** Closed (dissolved) — `actions/review/agent.md` § Severity Criteria now defines CRITICAL/HIGH/MEDIUM/LOW with explicit decision framework

### L017: Composite Feature Flag Pattern for Global + Local Control
- **Date:** 2026-02-12
- **From:** second-opinion/ (haiku) during Phase 7 review
- **Pattern Discovery:** The DiscoveryContext implementation revealed a powerful pattern for combining global feature flags with local user toggles.
- **Implementation:** `const isDiscoveryActive = fogOfWarEnabled && discoveryEnabled;` where `fogOfWarEnabled` is a global feature flag (backend-controlled) and `discoveryEnabled` is a local user toggle (localStorage).
- **Benefits:** (1) Global rollout control - backend can disable feature for everyone, (2) User override - individual users can opt-out via localStorage, (3) Graceful degradation - feature respects both signals, (4) Future-proof - ready for backend-driven flags when needed.
- **Recommendation:** Document this as a standard pattern for future feature development. Can be extracted into a custom hook: `useCompositeFlag(featureFlag: keyof FeatureFlags, localToggle: boolean): boolean`
- **Status:** Closed (pattern identified and documented, available for reuse)

### L018: ResilientStorage Wrapper Eats New Optional Interface Methods
- **Date:** 2026-02-12
- **From:** E2E verification during gate trace persistence fix chain
- **Issue:** Added `set()/get()/keys()` to Storage interface + Redis adapter, but `ResilientStorage` wrapper (circuit breaker layer) didn't proxy them. Services check `'keys' in this.storage` — fails on ResilientStorage because it doesn't have the property, even though the underlying Redis adapter does.
- **Root Cause:** ResilientStorage implements Storage interface explicitly (every method listed). New optional methods aren't automatically proxied. The `in` operator checks the wrapper, not the wrapped object.
- **Fix:** Add proxy methods to ResilientStorage that check `this.primaryStorage.method` existence and delegate via `executeWithFallback`.
- **Prevention:** When adding new optional methods to Storage interface, always update: (1) Storage interface, (2) Redis adapter, (3) Memory adapter (if applicable), (4) **ResilientStorage proxy**. Checklist: interface → implementations → wrapper.
- **Status:** Closed (c8a059b)

### L019: "Implement" ≠ "Wire" — Hook Scripts Created But Never Registered
- **Date:** 2026-02-12
- **From:** Root cause analysis of 7 unregistered hooks
- **Issue:** 7 of 9 hook scripts in `packages/hooks/src/` were implemented across Phases 3, 6, 11, 12 but never registered in `.claude/settings.json`. Code existed on disk but never ran.
- **Root Cause (5 factors):**
  1. No phase plan ever included a "register hook in settings.json" task — tasks stopped at "write the file"
  2. Phase 6 docs showed correct settings.json config as a "deployment guide" but no task executed it
  3. Phase 12 designed a bootstrap script (`bootstrap-hooks.ts`) that was never built
  4. The Session Redesign commit (`e5b7f41`) wired only the 2 hooks it needed (SessionStart/End), not all available hooks
  5. ActionFlows framework (ORCHESTRATOR.md, FLOWS.md, ACTIONS.md, all 14 agent.md files) has zero concept of "hook wiring" — no flow, no action, no checklist step
- **Fix (Rule):** When any chain creates a hook script, the chain MUST include a final step: "Register hook in `.claude/settings.json` with correct event type, matcher, and command path." This is NOT optional — code that isn't registered doesn't exist.
- **Prevention Checklist:** Hook implementation = (1) Write `.ts` source, (2) Build to `dist/`, (3) Register in `.claude/settings.json`, (4) Verify hook fires. All 4 or it's not done.
- **Status:** Closed (all 7 hooks wired)

### L020: afw-input-inject Hook Requires Active Dashboard Session
- **Date:** 2026-02-12
- **From:** Live testing after wiring all hooks
- **Issue:** `afw-input-inject` (Stop hook) POSTs to `/sessions/:id/awaiting` using Claude Code's internal session ID, which doesn't exist in the backend unless the dashboard created the session first. Returns 404, spams stderr, and triggers a `UV_HANDLE_CLOSING` assertion crash on Windows (Node.js/libuv issue with rapid process exit after failed fetch).
- **Root Cause:** Hook assumes dashboard is actively managing sessions. Without a matching ActionFlows session in the backend, the endpoint 404s. The 30s long-poll also blocks Claude after every response.
- **Fix:** Unwired `afw-input-inject` from `.claude/settings.json`. Re-enable when dashboard is actively creating and managing sessions (i.e., user starts sessions from the dashboard UI, not just CLI).
- **Re-enable:** Add back to `Stop` hooks array in `.claude/settings.json` with `"timeout": 35`
- **Status:** Closed (dissolved) — `.claude/settings.json` now documents hook status with re-enable condition

### L021: Contract Drift Reviews Need Field-Level Tracing, Not File-Level
- **Date:** 2026-02-12
- **From:** second-opinion/ (opus) during contract-drift-fix/ chain re-execution
- **Issue:** Primary review verified Zod schemas and CONTRACT.md alignment but missed 4 additional drift issues (Format 1.2 `timestamp` field, Format 1.4 `totalSteps`/`completedSteps`/`failedSteps` fields) because it only checked files listed in `changes.md` without tracing fields through all 4 layers (Spec → Type → Schema → Parser).
- **Root Cause:** File-centric review methodology checks "were these 7 files modified correctly?" instead of "for each field touched, is it aligned across all 4 layers?" Files `chainFormats.ts` and `chainParser.ts` were never examined, leaving Format 1.x type/parser gaps undetected.
- **Fix:** Update review/agent.md checklist: "For contract changes, use field-level verification matrix. For each modified field, verify alignment across: (1) CONTRACT.md spec, (2) TypeScript type definition, (3) Zod validation schema, (4) Parser implementation, (5) Regex pattern (if applicable)."
- **Impact:** Claimed 100% alignment was actually ~93% (12 of 16 issues fixed, 4 missed)
- **Status:** Closed (dissolved) — review/agent.md § Contract Change Verification already implements field-level tracing (lines 40-98)

### L022: Review Agents Should Verify Deployment Paths Before Marking Blockers
- **Date:** 2026-02-13
- **From:** second-opinion/ (opus) during contract-drift-prevention/ chain
- **Issue:** Primary review marked "TypeScript compilation errors in hooks package" as a critical deployment blocker, but second opinion verified the hook script runs perfectly via `npx tsx` without compilation. The hook has zero dependencies on sibling files with errors. This false blocker inflated the deployment complexity estimate from 1 chain to 3 chains.
- **Root Cause:** Review agent assumed the only deployment path was full `tsc` package build, without testing alternative execution methods (`tsx`, `ts-node`, `esbuild`). The hooks package builds all files together, but individual scripts with only stdlib imports can run independently.
- **Fix:** Add "deployment path verification" step to review/agent.md protocol for infrastructure that creates new entry points. Before marking compilation/runtime issues as blockers, test: (1) Direct execution via `tsx`/`ts-node`, (2) Standalone build via `esbuild`, (3) Dependencies on problematic sibling files. Document verified deployment path in review report.
- **Impact:** False blockers waste human review time and create incorrect deployment sequencing. In this case, the hook was ready to deploy immediately, not after 2 prerequisite chains.
- **Status:** Closed (dissolved) — `actions/review/agent.md` § step 3 now includes "Deployment paths" verification bullet

### L023: Immune System Architecture Maps to Biological Immunity (3-Layer Model)
- **Date:** 2026-02-13
- **From:** analyze/ (sonnet) during vision-alignment-audit chain
- **Issue:** The immune system components were implemented incrementally without a unifying mental model, making it unclear which layer a new feature belongs to.
- **Discovery:** The 14-gate checkpoint architecture naturally maps to biological immune systems:
  1. **Prevention Layer** (Gates 1-6, agent standards) → Innate immunity — stops violations before they happen
  2. **Detection Layer** (Gates 7-11, harmony detector, health calculator) → Adaptive immunity — identifies violations in real-time
  3. **Healing Layer** (Gates 12-14, health-protocol, learning capture) → Immunological memory — fixes violations and prevents recurrence
- **Application:** When adding new immune system features, classify them by layer. Gate validators → Detection. Agent standards → Prevention. Learning capture → Healing.
- **Recommendation:** Document this 3-layer model in `docs/living/IMMUNE_SYSTEM.md` as the architectural foundation.
- **Status:** Closed (dissolved) — `.claude/actionflows/docs/living/IMMUNE_SYSTEM.md` created with 3-layer biological model, health metrics, and anti-patterns

### L024: Output Protection ≠ Input Protection — "Rebellious Instructions" Gap
- **Date:** 2026-02-13
- **From:** analyze/ (sonnet) during vision-alignment-audit chain
- **Issue:** Vision statement says "if instructions to agents are changed to be rebellious and hide that fact, immune system detects it." Reality: system only detects OUTPUT violations (wrong format), not INPUT violations (mutated instructions).
- **Root Cause:** Architecture designed around contract validation (output), not instruction integrity (input). Agent.md files are trusted implicitly as source of truth — no checksum registry, no spawn audit trail, no behavioral monitoring.
- **Attack Vector:** Modify agent.md mid-chain → orchestrator spawns with mutated instructions → agent executes rebelliously → NO violation detected until output fails contract.
- **Gap Analysis:**
  - ✅ Output protection: 100% (16 format parsers, contract validation, missing field detection)
  - ❌ Input protection: 0% (no checksums, no audit, no behavioral signatures)
- **Proposed 4th Layer:** Add **Input Validation Layer** with:
  1. Agent.md checksum registry (hash at session start, verify at each spawn)
  2. Spawn prompt audit log (compare prompt against agent.md source of truth)
  3. Behavioral signature profiles (expected tool patterns per action type)
  4. Filesystem watcher (detect mid-session agent.md modifications)
- **Impact:** 65% alignment on Element 7 ("detects rebellious instructions") — PRIMARY gap in vision alignment.
- **Status:** Partially addressed — agentIntegrityService.ts created (item 1: checksum registry). Items 2-4 remain open. See L026.

### L025: Systemic Type-to-Schema Drift Across Contract Formats
- **Date:** 2026-02-13
- **From:** audit/ (opus) during backwards-harmony-audit chain
- **Issue:** 8 of 18 contract formats have Zod validation schemas whose fields don't match their TypeScript type definitions. Core formats affected: 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3. Additionally, StatusString enum has a critical split: `'in_progress'` (core types, frontend, storage) vs `'running'` (contract Zod schema).
- **Root Cause:** TypeScript types and Zod schemas were created or evolved independently without cross-layer verification. No automated enforcement ensures schema fields match type fields. Each layer was validated independently but never cross-checked at the field level.
- **Fix:**
  1. **Immediate:** Fix StatusString enum split — normalize `'running'` → `'in_progress'` in Zod schemas to match core types
  2. **Structural:** Add build-step type assertion (`type AssertEqual<T, U> = T extends U ? U extends T ? true : false : false`) that verifies each Zod schema's `z.infer<>` type is assignable to/from the corresponding TypeScript interface
  3. **Process:** Add type-schema alignment check to `pnpm type-check` or `pnpm harmony:enforce`
- **Impact:** Harmony score 38/100. Drift is currently dormant (frontend receives pre-parsed data via WebSocket, never uses contract parsers directly). Becomes live issue if strict schema enforcement is enabled on the parsing pipeline.
- **Status:** Closed (d863952 + 87952e0) — Schemas aligned, 17/18 type guards active, 59/59 tests passing. 1 remaining: _check_StepCompletion (nextStep type mismatch)

### L026: Health Protocol Reveals Infrastructure Decay + Gate Coverage Gaps
- **Date:** 2026-02-14
- **From:** health-protocol/ flow (Eyes agents, qwen2.5-coder:7b + qwen3:14b)
- **Issue:** First health-protocol run surfaced 4 issues: (P1) Backend wouldn't start — pnpm 8.0.0 incompatible with Node.js 24.13.1, `npx tsx` double-resolving node_modules. (P2) L012 orphan flows all fixed, but new orphan template-creation/ discovered. (P3) 5 of 14 gates had no explicit validation methods (5, 8, 10, 11, 14). (P4) L024 — zero input protection for agent.md files (no checksum verification before spawn).
- **Root Cause:** (P1) packageManager field pinned to old version, never updated when Node.js upgraded. (P2) Flow registration without instructions.md creates ghost entries. (P3) Gate checkpoint service was built incrementally — newer gates never got explicit validators. (P4) Trust model assumed agent.md files are immutable — no runtime verification mechanism existed.
- **Fix:** (P1) Updated packageManager to pnpm@10.29.3, changed npx tsx → tsx in scripts. (P2) Closed L012, noted template-creation/ orphan. (P3) Added validateGate5/8/10/11/14 methods to gateCheckpoint.ts. (P4) Created agentIntegrityService.ts with SHA-256 checksums and singleton pattern.
- **Status:** Open (healing applied, pending commit and backend restart verification)
