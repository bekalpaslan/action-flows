# Action Routing Metadata

> Structured metadata for all actions enabling intelligent discovery, routing decisions, and capability-based selection. This is the single source of truth for action capabilities, context affinities, and routing hints.

---

## Schema Definition

Each action has the following metadata:

```yaml
action: {action name, format: action-name/}
context_affinity: [{contexts where this action excels}]
capability_tags: [{what this action can do - discoverable keywords}]
scope_preference:
  single_file: {true|false}
  multi_file: {true|false}
  multi_package: {true|false}
confidence_threshold: {minimum confidence score: high|medium|low}
parallel_safe: {can this action run in parallel with others?}
dependencies: [{actions that should complete before this}]
output_types: [{contract formats this produces}]
triggers:
  keywords: [{words that should route here}]
  patterns: [{file glob patterns suggesting this action}]
  situations: [{scenarios where this action is valuable}]
routing_priority: {1-100, higher = prefer when scoring tied}
```

---

## Generic Actions

### analyze/

```yaml
action: analyze/
context_affinity: [explore, review, maintenance]
capability_tags: [metrics, pattern-detection, gap-analysis, drift-detection, inventory, dependency-analysis, coverage-analysis, impact-assessment]
scope_preference:
  single_file: false
  multi_file: true
  multi_package: true
confidence_threshold: medium
parallel_safe: true
dependencies: []
output_types: [Format 5.2 - Analysis Report]
triggers:
  keywords: [analyze, metrics, coverage, dependencies, structure, drift, inventory, impact, gaps, patterns, health, audit, scan]
  patterns: ["**/*.ts", "packages/**/src/**", "**/*.tsx", "docs/**"]
  situations:
    - need data before deciding
    - understand current state
    - gap detection
    - performance bottleneck investigation
    - architecture alignment check
routing_priority: 70
```

### audit/

```yaml
action: audit/
context_affinity: [review, maintenance]
capability_tags: [comprehensive-audit, security-audit, violation-detection, remediation, critical-finding-fixing]
scope_preference:
  single_file: false
  multi_file: true
  multi_package: true
confidence_threshold: high
parallel_safe: false
dependencies: []
output_types: [No contract output, produces audit logs]
triggers:
  keywords: [audit, security, vulnerabilities, compliance, health, comprehensive, scan, check, validate]
  patterns: ["packages/**/src/**", "**/*.ts", "**/*.tsx"]
  situations:
    - comprehensive security review needed
    - violation remediation
    - CRITICAL/HIGH findings require fixing
    - health check of entire codebase
routing_priority: 85
```

### brainstorm/

```yaml
action: brainstorm/
context_affinity: [work, explore]
capability_tags: [ideation, interactive-exploration, concept-generation, possibility-mapping, structured-brainstorm]
scope_preference:
  single_file: false
  multi_file: false
  multi_package: false
confidence_threshold: low
parallel_safe: true
dependencies: []
output_types: [Format 5.3 - Brainstorm Output]
triggers:
  keywords: [brainstorm, ideate, explore, discover, concept, possibility, option, creative, imagine, think]
  patterns: []
  situations:
    - early phase exploration
    - generating alternative approaches
    - interactive discovery with human feedback
    - concept refinement
routing_priority: 65
```

### code/

```yaml
action: code/
context_affinity: [work, maintenance]
capability_tags: [implementation, refactoring, bug-fixing, feature-development, code-modification]
scope_preference:
  single_file: true
  multi_file: true
  multi_package: true
confidence_threshold: high
parallel_safe: true (with file exclusivity per batch)
dependencies: [analyze/, plan/]
output_types: [Free-form changes.md]
triggers:
  keywords: [implement, build, fix, refactor, create, modify, update, write, add, change]
  patterns: ["packages/**/src/**/*.ts", "packages/**/src/**/*.tsx"]
  situations:
    - plan approved by human
    - clear implementation scope
    - bug reproduction confirmed
    - architecture decision made
routing_priority: 80
```

### code/backend/

```yaml
action: code/backend/
context_affinity: [work, maintenance]
capability_tags: [implementation, refactoring, bug-fixing, feature-development, backend-architecture]
scope_preference:
  single_file: true
  multi_file: true
  multi_package: true
confidence_threshold: high
parallel_safe: true (with file exclusivity per batch)
dependencies: [analyze/, plan/]
output_types: [Free-form changes.md]
triggers:
  keywords: [implement, build, fix, refactor, backend, api, route, middleware, schema, storage, service]
  patterns: ["packages/backend/src/**/*.ts", "packages/shared/src/**/*.ts"]
  situations:
    - backend implementation needed
    - Express routing work
    - Zod schema changes
    - Storage/database work
routing_priority: 85
```

### code/frontend/

```yaml
action: code/frontend/
context_affinity: [work, maintenance]
capability_tags: [implementation, refactoring, bug-fixing, feature-development, react-components]
scope_preference:
  single_file: true
  multi_file: true
  multi_package: true
confidence_threshold: high
parallel_safe: true (with file exclusivity per batch)
dependencies: [analyze/, plan/]
output_types: [Free-form changes.md]
triggers:
  keywords: [implement, build, fix, refactor, frontend, component, react, ui, interface, style, hook, context]
  patterns: ["packages/app/src/**/*.tsx", "packages/app/src/**/*.ts"]
  situations:
    - React component implementation
    - frontend bug fix
    - hook creation
    - UI/UX enhancement
routing_priority: 85
```

### commit/

```yaml
action: commit/
context_affinity: [work, maintenance]
capability_tags: [git-commit, version-control, change-recording]
scope_preference:
  single_file: false
  multi_file: true
  multi_package: true
confidence_threshold: medium
parallel_safe: false
dependencies: [code/, review/]
output_types: [No contract output]
triggers:
  keywords: [commit, push, git, version, save, finalize, merge]
  patterns: []
  situations:
    - code changes complete and reviewed
    - ready to persist changes to history
routing_priority: 50
```

### diagnose/

```yaml
action: diagnose/
context_affinity: [maintenance, explore]
capability_tags: [root-cause-analysis, violation-diagnosis, issue-detection]
scope_preference:
  single_file: false
  multi_file: true
  multi_package: true
confidence_threshold: high
parallel_safe: true
dependencies: [analyze/]
output_types: [Format 5.4 - Diagnosis Report]
triggers:
  keywords: [diagnose, root-cause, why, problem, issue, violation, failure]
  patterns: ["**/*"]
  situations:
    - why did harmony gate fail?
    - what caused the error?
    - trace root cause of issue
routing_priority: 75
```

### isolate/

```yaml
action: isolate/
context_affinity: [review, maintenance]
capability_tags: [quarantine-management, issue-isolation, remediation]
scope_preference:
  single_file: true
  multi_file: false
  multi_package: false
confidence_threshold: high
parallel_safe: false
dependencies: []
output_types: [Format 5.6 - Quarantine Record]
triggers:
  keywords: [isolate, quarantine, remove, disable, suppress, hide, block]
  patterns: []
  situations:
    - problematic code needs temporary quarantine
    - feature needs disabling
    - issue needs isolation
routing_priority: 60
```

### narrate/

```yaml
action: narrate/
context_affinity: [explore]
capability_tags: [narrative-generation, documentation, storytelling, chapter-writing]
scope_preference:
  single_file: false
  multi_file: true
  multi_package: false
confidence_threshold: low
parallel_safe: true
dependencies: [analyze/]
output_types: [No contract output]
triggers:
  keywords: [narrate, story, chapter, document, write, describe, explain]
  patterns: ["docs/**", "**/*.md"]
  situations:
    - document analysis findings as narrative
    - write chapter in documentation
    - poetic technical documentation
routing_priority: 40
```

### onboarding/

```yaml
action: onboarding/
context_affinity: [explore, settings]
capability_tags: [interactive-onboarding, questionnaire, user-education, setup-facilitation]
scope_preference:
  single_file: false
  multi_file: false
  multi_package: false
confidence_threshold: low
parallel_safe: true
dependencies: []
output_types: [No contract output]
triggers:
  keywords: [onboarding, learn, setup, tutorial, questionnaire, welcome, getting-started]
  patterns: []
  situations:
    - user is new to system
    - configuration wizard needed
    - educational walkthrough requested
routing_priority: 35
```

### plan/

```yaml
action: plan/
context_affinity: [work, explore, maintenance]
capability_tags: [implementation-planning, requirements-analysis, design, architecture, task-breakdown]
scope_preference:
  single_file: false
  multi_file: true
  multi_package: true
confidence_threshold: high
parallel_safe: true
dependencies: [analyze/]
output_types: [No contract output]
triggers:
  keywords: [plan, design, architecture, approach, strategy, steps, workflow, roadmap, schedule]
  patterns: ["docs/**", "**/*.md"]
  situations:
    - need approach before implementation
    - architecture decision needed
    - task breakdown required
    - scope clarification
routing_priority: 75
```

### review/

```yaml
action: review/
context_affinity: [review, work, maintenance]
capability_tags: [quality-check, bug-detection, style-validation, contract-compliance, code-review]
scope_preference:
  single_file: true
  multi_file: true
  multi_package: true
confidence_threshold: low
parallel_safe: false
dependencies: [code/]
output_types: [Format 5.1 - Review Report]
triggers:
  keywords: [review, check, validate, inspect, examine, verify, quality, qa, test]
  patterns: ["**/*.ts", "**/*.tsx", "**/*.md"]
  situations:
    - code changes complete
    - PR ready for review
    - quality gate checkpoint
    - contract compliance check
routing_priority: 75
```

### test/

```yaml
action: test/
context_affinity: [work, maintenance, review]
capability_tags: [test-execution, test-suite-creation, coverage-analysis, test-debugging]
scope_preference:
  single_file: true
  multi_file: true
  multi_package: true
confidence_threshold: high
parallel_safe: true
dependencies: [code/]
output_types: [No contract output]
triggers:
  keywords: [test, testing, coverage, unit, integration, e2e, pytest, vitest, playwright]
  patterns: ["**/*.test.ts", "**/*.spec.ts", "test/**", "**/__tests__/**"]
  situations:
    - test suite needs creation
    - test coverage gap
    - test failure investigation
    - test suite enhancement
routing_priority: 70
```

### verify-healing/

```yaml
action: verify-healing/
context_affinity: [review, maintenance]
capability_tags: [post-healing-validation, gate-verification, healing-assessment]
scope_preference:
  single_file: false
  multi_file: true
  multi_package: true
confidence_threshold: high
parallel_safe: true
dependencies: []
output_types: [Format 5.5 - Healing Verification Report]
triggers:
  keywords: [verify, validate, healing, gate, after, post, confirm, check-healing]
  patterns: []
  situations:
    - validate gate healing effectiveness
    - confirm gate passes post-fix
    - healing assessment needed
routing_priority: 70
```

---

## Stack-Specific Code Actions

Stack-specific actions inherit metadata from generic `code/` with refinements:

| Action | Inherits From | Refinement |
|--------|---------------|-----------|
| `code/backend/` | `code/` | Scope patterns → backend only, triggers include Express/Zod keywords |
| `code/frontend/` | `code/` | Scope patterns → frontend only, triggers include React/Vite keywords |

---

## Stack-Specific Test Actions

### test/playwright/

```yaml
action: test/playwright/
context_affinity: [work, maintenance, review]
capability_tags: [browser-testing, e2e-testing, ui-testing, playwright-automation]
scope_preference:
  single_file: true
  multi_file: true
  multi_package: false
confidence_threshold: high
parallel_safe: true
dependencies: [code/frontend/]
output_types: [No contract output]
triggers:
  keywords: [test, playwright, browser, e2e, ui, automation, selenium, headless]
  patterns: ["test/**/*.spec.ts", "test/playwright/**"]
  situations:
    - E2E browser test needed
    - UI interaction testing
    - cross-browser compatibility testing
routing_priority: 80
```

---

## Code-Backed Actions

### second-opinion/

```yaml
action: second-opinion/
context_affinity: [review, explore]
capability_tags: [critique, quality-assessment, ollama-evaluation, alternative-perspective]
scope_preference:
  single_file: true
  multi_file: true
  multi_package: true
confidence_threshold: low
parallel_safe: true
dependencies: [code/, review/, audit/]
output_types: [No contract output]
triggers:
  keywords: [second-opinion, critique, review, feedback, ollama, alternative]
  patterns: []
  situations:
    - lightweight critique after code/review/audit
    - perspective validation
    - confidence building
routing_priority: 50
```

---

## Confidence Thresholds

Thresholds gate routing when rule score falls below threshold:

- **high** — Score must be 0.8+ (80%)
  - Actions: `audit/`, `code/*`, `test/*`, `plan/`, `verify-healing/`
  - Use when wrong choice is costly

- **medium** — Score must be 0.5+ (50%)
  - Actions: `analyze/`, `commit/`, `review/`
  - Use when choice benefits from human discretion

- **low** — Score must be 0.0+ (always route)
  - Actions: `brainstorm/`, `onboarding/`, `narrate/`, `second-opinion/`
  - Use for discovery/learning actions

---

## Parallel Safety

**Parallel safe actions** can run in parallel with others:
- `analyze/`, `brainstorm/`, `code/*`, `test/*`, `diagnose/`, `narrate/`, `second-opinion/`, `verify-healing/`
- **Caveat:** `code/*` parallel execution requires **file exclusivity** — no two code/ agents work on same file

**Sequential actions** must run alone:
- `review/` — Sequential to avoid duplicate findings
- `commit/` — Must serialize to prevent merge conflicts
- `isolate/` — Must serialize to prevent concurrent quarantine

---

## Context Affinity Explanation

### work

Design and implement new features. Direct implementation work.

**Best actions:** `code/`, `code/backend/`, `code/frontend/`, `plan/`, `brainstorm/`, `test/`, `commit/`

### maintenance

Bug fixes, refactoring, technical debt. Improving existing code.

**Best actions:** `code/`, `analyze/`, `audit/`, `diagnose/`, `review/`, `test/`, `verify-healing/`

### explore

Research, learning, understanding. Discovery and analysis work.

**Best actions:** `analyze/`, `plan/`, `diagnose/`, `narrate/`, `brainstorm/`, `second-opinion/`

### review

Quality gates, code review, compliance checks.

**Best actions:** `review/`, `audit/`, `verify-healing/`, `second-opinion/`, `analyze/`

### settings

Configuration, framework development, orchestration changes.

**Best actions:** `plan/`, `analyze/`, `code/backend/`

### pm

Project management, planning, roadmapping.

**Best actions:** `plan/`, `analyze/`, `brainstorm/`

### intel

Intelligence gathering, requirements analysis, discovery.

**Best actions:** `analyze/`, `brainstorm/`, `diagnose/`, `plan/`

---

## Using This Metadata

### For Routing (ROUTING_RULES.md)

Reference `capability_tags` and `context_affinity` when designing rules:

```yaml
# Example: Use audit/ for security keywords because it has capability tag
rule_id: RR001
condition:
  keywords: [security, vulnerabilities]  # triggers.keywords from metadata
action: audit/  # has capability_tags: [security-audit, violation-detection]
```

### For Discovery UI (Phase 2)

Expose `capability_tags` and `context_affinity` to dashboard:

```typescript
const actions = loadMetadata();
actions.forEach(action => {
  // Show capability tags in action cards
  renderCard(action.action, action.capability_tags, action.context_affinity);
});
```

### For Signals (Phase 3)

Use `triggers.situations` to detect when mid-chain recompilation is needed:

```typescript
if (currentSituation in action.triggers.situations) {
  // Suggest recompilation with this action
}
```

---

## Maintaining Metadata

### When Adding New Action

1. Define action in ACTIONS.md
2. Add full metadata entry to ROUTING_METADATA.md
3. Verify `capability_tags` are distinct (no duplication with other actions)
4. Add `context_affinity` based on where action will be used
5. Set `confidence_threshold` based on cost of wrong routing
6. Run `pnpm run routing:validate` to verify

### When Modifying Action Scope

Update corresponding metadata entry's `scope_preference` and `triggers.patterns`

### Metadata Evolution

Keep metadata in sync with action capabilities. When action gains new capability:

1. Add capability tag to `capability_tags`
2. Add trigger words to `triggers.keywords`
3. Add example situations to `triggers.situations`
4. Update `routing_priority` if priority changed
5. Run validation

---

## See Also

- `ROUTING_RULES.md` — Rules that use this metadata
- `ACTIONS.md` — Action definitions (master list)
- `packages/shared/src/routing/routingValidator.ts` — Validation schemas
