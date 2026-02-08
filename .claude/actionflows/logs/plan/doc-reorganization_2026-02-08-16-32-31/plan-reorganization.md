# Documentation Reorganization Execution Plan

## Overview

This plan reorganizes 172 .md files by moving 29 misplaced root files into a structured `docs/` hierarchy, consolidating 13 files into 6, relocating 3 existing docs/ files, updating cross-references, and creating a comprehensive INDEX.md. All moves use `git mv` to preserve history.

---

## Step 1: Create New Directory Structure

**Execute in order:**

```bash
# Create new docs/ subdirectories
mkdir -p docs/api
mkdir -p docs/architecture
mkdir -p docs/deployment
mkdir -p docs/guides
mkdir -p docs/setup
mkdir -p docs/status/checklists
mkdir -p docs/status/deliveries
mkdir -p docs/status/implementation
mkdir -p docs/status/phases
mkdir -p docs/testing
```

**Verification:** All directories exist before proceeding to Step 2.

---

## Step 2: Move Root-Level Files to docs/

### 2.1 API Documentation

```bash
git mv API_REFERENCE.md docs/api/API_REFERENCE.md
```

### 2.2 Build & Deployment

```bash
git mv BUILD.md docs/deployment/BUILD.md
```

### 2.3 Setup Guides

```bash
git mv SETUP_GUIDE.md docs/setup/SETUP_GUIDE.md
git mv MANUAL_INSTALL_STEPS.md docs/setup/MANUAL_INSTALL_STEPS.md
```

### 2.4 User Guides

```bash
git mv QUICK_START_REAL_TIME.md docs/guides/quick-start-real-time.md
git mv README_WEBSOCKET.md docs/guides/websocket-guide.md
```

### 2.5 Status Checklists

```bash
git mv IMPLEMENTATION_CHECKLIST.md docs/status/checklists/root-implementation-checklist.md
git mv VERIFICATION_CHECKLIST.md docs/status/checklists/verification.md
```

### 2.6 Delivery Reports

```bash
git mv DELIVERY_SUMMARY.md docs/status/deliveries/websocket-delivery.md
git mv FINAL_IMPLEMENTATION_REPORT.md docs/status/deliveries/testing-delivery.md
```

### 2.7 Phase Summaries

```bash
git mv PHASE_6_IMPLEMENTATION_SUMMARY.md docs/status/phases/phase-6.md
git mv PHASE9_FIXES_SUMMARY.md docs/status/phases/phase-9-bug-fixes.md
```

### 2.8 Implementation Documentation

```bash
git mv STEP_INSPECTOR_BUILD.md docs/status/implementation/step-inspector.md
```

### 2.9 Testing Documentation

```bash
git mv E2E_TEST_GUIDE.md docs/testing/E2E_TEST_GUIDE.md
git mv TESTING_INDEX.md docs/testing/INDEX.md
git mv INTEGRATION_TEST_SUMMARY.md docs/testing/integration-summary.md
git mv TEST_FILES_SUMMARY.md docs/testing/test-files-summary.md
```

**Count:** 20 files moved.

**Verification:** All source files removed from root, all destination files exist in docs/.

---

## Step 3: Relocate Existing docs/ Files

### 3.1 Architecture Documentation

```bash
git mv docs/ORCHESTRATOR_INTEGRATION.md docs/architecture/ORCHESTRATOR_INTEGRATION.md
```

### 3.2 User Guides

```bash
git mv docs/MULTI_USER_TESTING.md docs/guides/MULTI_USER_TESTING.md
```

### 3.3 Setup Templates

```bash
# Keep BOOTSTRAP_TEMPLATE.md in docs/setup/ (decision: relocate for better organization)
git mv docs/BOOTSTRAP_TEMPLATE.md docs/setup/BOOTSTRAP_TEMPLATE.md
```

**Count:** 3 files relocated within docs/.

**Verification:** No files remain in docs/ root except INDEX.md (to be created in Step 5).

---

## Step 4: Consolidate Related Files

### 4.1 Session Tree Implementation (4→1)

**Target:** `docs/status/implementation/session-tree.md`

**Source files:**
- IMPLEMENTATION_SUMMARY.md
- IMPLEMENTATION_WRITEUP.md
- SESSION_TREE_IMPLEMENTATION.md
- SESSION_TREE_QUICK_START.md

**Consolidation strategy:**
1. Start with SESSION_TREE_IMPLEMENTATION.md as base (most comprehensive)
2. Merge IMPLEMENTATION_SUMMARY.md overview section at top
3. Integrate IMPLEMENTATION_WRITEUP.md technical details into relevant sections
4. Append SESSION_TREE_QUICK_START.md as "Quick Start" section at end
5. Add table of contents
6. Remove duplicate content (keep most detailed version)

**Commands:**
```bash
# Create consolidated file
cat > docs/status/implementation/session-tree.md <<'EOF'
# Session Tree Implementation

[Consolidated content from 4 source files - detailed consolidation performed by code agent]

## Overview
[From IMPLEMENTATION_SUMMARY.md]

## Architecture
[From SESSION_TREE_IMPLEMENTATION.md + IMPLEMENTATION_WRITEUP.md]

## Implementation Details
[From SESSION_TREE_IMPLEMENTATION.md + IMPLEMENTATION_WRITEUP.md]

## Quick Start
[From SESSION_TREE_QUICK_START.md]
EOF

# Remove source files
git rm IMPLEMENTATION_SUMMARY.md
git rm IMPLEMENTATION_WRITEUP.md
git rm SESSION_TREE_IMPLEMENTATION.md
git rm SESSION_TREE_QUICK_START.md
```

### 4.2 WebSocket Implementation (2→1)

**Target:** `docs/status/implementation/websocket.md`

**Source files:**
- WEBSOCKET_IMPLEMENTATION.md
- REAL_TIME_UPDATES.md

**Consolidation strategy:**
1. Use WEBSOCKET_IMPLEMENTATION.md as base
2. Merge REAL_TIME_UPDATES.md into "Real-Time Updates" section
3. Preserve all message type definitions and examples

**Commands:**
```bash
# Create consolidated file (code agent performs detailed merge)
# Move to target location
git mv WEBSOCKET_IMPLEMENTATION.md docs/status/implementation/websocket.md

# Merge content from REAL_TIME_UPDATES.md into websocket.md
# (Edit operation - code agent adds REAL_TIME_UPDATES content)

# Remove source file
git rm REAL_TIME_UPDATES.md
```

### 4.3 Hooks Implementation (2→1)

**Target:** `docs/status/implementation/hooks.md`

**Source files:**
- HOOK_IMPLEMENTATION_SUMMARY.md
- HOOK_COMPLETION_REPORT.md

**Consolidation strategy:**
1. Use HOOK_IMPLEMENTATION_SUMMARY.md as base
2. Append HOOK_COMPLETION_REPORT.md findings as "Completion Report" section
3. Preserve all hook configurations and examples

**Commands:**
```bash
# Move base file
git mv HOOK_IMPLEMENTATION_SUMMARY.md docs/status/implementation/hooks.md

# Merge HOOK_COMPLETION_REPORT.md content
# (Edit operation - code agent appends completion report)

# Remove source file
git rm HOOK_COMPLETION_REPORT.md
```

### 4.4 Phase 5 Summary (2→1)

**Target:** `docs/status/phases/phase-5-control-features.md`

**Source files:**
- PHASE_5_COMPLETE.md
- PHASE_5_IMPLEMENTATION_SUMMARY.md

**Consolidation strategy:**
1. Use PHASE_5_IMPLEMENTATION_SUMMARY.md as base (more detailed)
2. Merge completion checklist from PHASE_5_COMPLETE.md into "Completion Status" section
3. Preserve all feature descriptions and verification steps

**Commands:**
```bash
# Move base file
git mv PHASE_5_IMPLEMENTATION_SUMMARY.md docs/status/phases/phase-5-control-features.md

# Merge PHASE_5_COMPLETE.md checklist
# (Edit operation - code agent adds completion checklist)

# Remove source file
git rm PHASE_5_COMPLETE.md
```

**Total consolidations:** 13 files → 6 files (7 files removed).

**Verification:** All 6 consolidated files exist with merged content, all 13 source files removed.

---

## Step 5: Update Cross-References

### 5.1 README.md

**File:** `README.md` (root)

**Change:**
```diff
- See [API Reference](./API_REFERENCE.md) for detailed endpoint documentation.
+ See [API Reference](./docs/api/API_REFERENCE.md) for detailed endpoint documentation.
```

### 5.2 docs/architecture/ORCHESTRATOR_INTEGRATION.md

**File:** `docs/architecture/ORCHESTRATOR_INTEGRATION.md`

**Change:**
```diff
- For API details, see [API_REFERENCE.md](API_REFERENCE.md)
+ For API details, see [API Reference](../api/API_REFERENCE.md)
```

### 5.3 docs/status/deliveries/websocket-delivery.md

**File:** `docs/status/deliveries/websocket-delivery.md` (formerly DELIVERY_SUMMARY.md)

**Change:**
```diff
- See [WEBSOCKET_IMPLEMENTATION.md](WEBSOCKET_IMPLEMENTATION.md) for technical details
+ See [WebSocket Implementation](../implementation/websocket.md) for technical details
```

### 5.4 docs/status/deliveries/testing-delivery.md

**File:** `docs/status/deliveries/testing-delivery.md` (formerly FINAL_IMPLEMENTATION_REPORT.md)

**Change:**
```diff
- See [INTEGRATION_TEST_SUMMARY.md](INTEGRATION_TEST_SUMMARY.md) for test results
+ See [Integration Test Summary](../../testing/integration-summary.md) for test results
```

### 5.5 Verify No Broken Links

**Search for references to moved files across all .md files:**
```bash
# Grep for references to moved root files
grep -r "API_REFERENCE.md" --include="*.md" .
grep -r "BUILD.md" --include="*.md" .
grep -r "SETUP_GUIDE.md" --include="*.md" .
grep -r "WEBSOCKET_IMPLEMENTATION.md" --include="*.md" .
grep -r "IMPLEMENTATION_SUMMARY.md" --include="*.md" .
# (Continue for all moved files)
```

**Fix any additional references discovered.**

**Verification:** No broken relative links remain, all cross-references point to new locations.

---

## Step 6: Create Documentation Index

### 6.1 Create docs/INDEX.md

**File:** `docs/INDEX.md`

**Content:**
```markdown
# Documentation Index

Complete guide to ActionFlows Dashboard documentation.

---

## Quick Links

- [Quick Start](../QUICK_START.md) — Get started in 5 minutes
- [API Reference](api/API_REFERENCE.md) — REST and WebSocket API documentation
- [Setup Guide](setup/SETUP_GUIDE.md) — Installation and configuration
- [Testing](testing/INDEX.md) — Test suite overview

---

## Documentation Structure

### API

- [API Reference](api/API_REFERENCE.md) — Complete REST and WebSocket API documentation

### Architecture

- [Orchestrator Integration](architecture/ORCHESTRATOR_INTEGRATION.md) — ActionFlows framework integration patterns

### Deployment

- [Build Guide](deployment/BUILD.md) — Production build and deployment instructions

### Guides

- [Multi-User Testing](guides/MULTI_USER_TESTING.md) — Testing with multiple concurrent users
- [Quick Start: Real-Time](guides/quick-start-real-time.md) — Real-time features quick start
- [WebSocket Guide](guides/websocket-guide.md) — WebSocket connection and messaging

### Setup

- [Bootstrap Template](setup/BOOTSTRAP_TEMPLATE.md) — Project bootstrap template
- [Manual Install Steps](setup/MANUAL_INSTALL_STEPS.md) — Manual installation procedure
- [Setup Guide](setup/SETUP_GUIDE.md) — Complete setup instructions

### Status

#### Checklists

- [Implementation Checklist](status/checklists/root-implementation-checklist.md) — Root-level implementation tracking
- [Verification Checklist](status/checklists/verification.md) — Verification procedures

#### Deliveries

- [Testing Delivery](status/deliveries/testing-delivery.md) — Testing implementation delivery report
- [WebSocket Delivery](status/deliveries/websocket-delivery.md) — WebSocket feature delivery report

#### Implementation

- [Hooks](status/implementation/hooks.md) — Git hooks implementation
- [Session Tree](status/implementation/session-tree.md) — Session tree feature implementation
- [Step Inspector](status/implementation/step-inspector.md) — Step inspector implementation
- [WebSocket](status/implementation/websocket.md) — WebSocket real-time updates implementation

#### Phases

- [Phase 5: Control Features](status/phases/phase-5-control-features.md) — Control feature implementation phase
- [Phase 6](status/phases/phase-6.md) — Phase 6 implementation summary
- [Phase 9: Bug Fixes](status/phases/phase-9-bug-fixes.md) — Bug fix phase summary

### Testing

- [Testing Index](testing/INDEX.md) — Test suite overview and organization
- [E2E Test Guide](testing/E2E_TEST_GUIDE.md) — End-to-end testing guide
- [Integration Test Summary](testing/integration-summary.md) — Integration test results
- [Test Files Summary](testing/test-files-summary.md) — Test file organization

---

## External Documentation

- Package-level READMEs: See packages/*/README.md
- Framework documentation: .claude/actionflows/README.md
- Claude Code hooks: packages/hooks/README.md
- MCP Server: packages/mcp-server/README.md

---

## Contributing

See [Contributing Guide](../CONTRIBUTING.md) for documentation standards and update procedures.

*Note: If CONTRIBUTING.md doesn't exist, this link will be created when that file is added.*
```

**Verification:** INDEX.md created with all sections populated.

---

## Step 7: Verify Package-Level Docs Remain Untouched

**No changes to:**
- packages/app/README.md
- packages/backend/README.md
- packages/shared/README.md
- packages/mcp-server/README.md
- packages/hooks/README.md

**Verification:** All package READMEs remain in their original locations.

---

## Step 8: Verify Root Files Unchanged

**Keep in place:**
- QUICK_START.md (root-level quick start)
- README.md (main project README, only cross-references updated)
- LICENSE
- package.json
- tsconfig.json
- .gitignore
- etc.

**Do NOT create:**
- CONTRIBUTING.md (out of scope)
- CHANGELOG.md (out of scope)

**Verification:** Only documentation files moved, no project configuration files affected.

---

## Dependency Graph

```
Step 1 (create directories)
  ↓
Step 2 (move root files) — depends on Step 1
  ↓
Step 3 (relocate docs/ files) — depends on Step 1
  ↓
Step 4 (consolidate files) — depends on Step 2, Step 3
  ↓
Step 5 (update cross-refs) — depends on Step 2, Step 3, Step 4
  ↓
Step 6 (create INDEX.md) — depends on Step 2, Step 3, Step 4
  ↓
Step 7 (verify packages) — parallel with Step 8
Step 8 (verify root) — parallel with Step 7
```

**Critical path:** Steps 1→2→3→4→5→6

**Parallel final verification:** Steps 7 and 8

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Broken cross-references after moves | Medium | Step 5 comprehensive grep + manual verification |
| Lost content during consolidation | High | Manual review of each consolidation, preserve all unique content |
| Git history loss | Medium | Always use `git mv` and `git rm`, never raw filesystem operations |
| Stale references in external docs | Low | External tooling (.changes/, .agent/) out of scope, document this |
| INDEX.md becomes stale | Low | Add to CONTRIBUTING.md maintenance checklist |

---

## Rollback Plan

All operations use git commands. Rollback:
```bash
git reset --hard HEAD  # Before commit
git revert <commit>    # After commit
```

---

## Verification Checklist

After execution:

- [ ] All 29 root files moved to docs/ subdirectories
- [ ] All 3 existing docs/ files relocated
- [ ] All 13 source files consolidated into 6 target files
- [ ] All 7 source files removed via git rm
- [ ] All cross-references updated (no broken links)
- [ ] docs/INDEX.md created with complete map
- [ ] Package-level docs untouched
- [ ] Root project files untouched (except doc moves)
- [ ] `git status` shows only intended changes
- [ ] `pnpm type-check` passes (no broken imports)
- [ ] All markdown links verified with link checker

---

## Post-Execution Tasks

1. Commit with message:
   ```
   docs: reorganize documentation into structured docs/ hierarchy

   - Move 29 root .md files into docs/ subdirectories
   - Consolidate 13 files into 6 implementation/phase docs
   - Create comprehensive docs/INDEX.md
   - Update all cross-references
   - Preserve git history with git mv

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```

2. Update CONTRIBUTING.md (if it exists) with:
   - Documentation structure guidelines
   - INDEX.md maintenance instructions

3. Consider: Create .github/CODEOWNERS for docs/ if not present

---
