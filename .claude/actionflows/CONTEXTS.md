# Context Routing

> Maps human intent directly to workbench contexts.

## Routing

Request -> Keyword Extraction -> Context Scoring -> Selection or Disambiguation

## Routable Contexts (7)

### work
**Purpose:** Active feature development, new code, and bug fixes
**Icon:** hammer
**Triggers:** implement, build, create, add feature, develop, code, write, generate, construct, design, fix bug, resolve issue, patch, debug, repair
**Flows:** code-and-review/, post-completion/, contract-format-implementation/, bug-triage/, design-to-code/, design-system-sync/

**Special Routing:**
- Contract format implementation (mentions "Format X.Y", files include `contract/`, keywords "system health parser") -> Always use `contract-format-implementation/` flow (4-step chain: parser, component, integration, validate). Single-step code chains are prohibited for contract work.
- Bug triage (mentions "bug", "broken", "not working", "error") -> Use `bug-triage/` flow for structured diagnosis and fix.
**Examples:**
- "implement user authentication"
- "build a dashboard component"
- "add export functionality"
- "create a new API endpoint"
- "fix the login bug"
- "debug the session timeout"

### explore
**Purpose:** Research, codebase exploration, learning, and code intelligence
**Icon:** magnifying glass
**Triggers:** explore, investigate, research, learn, understand, explain, how does, study, analyze, discover, story, narrative, chronicle, tale, dossier, intel, intelligence, monitor, watch, track, insight, analyze domain, code health, gather intel
**Flows:** doc-reorganization/, ideation/, story-of-us/, intel-analysis/
**Examples:**
- "explore the WebSocket implementation"
- "research best practices for state management"
- "how does the contract parser work"
- "investigate performance bottlenecks"
- "create an intel dossier for the auth system"
- "analyze the backend services"
- "gather intel on the frontend components"

### review
**Purpose:** Code reviews, audits, and quality checks
**Icon:** eye
**Triggers:** review, code review, audit, check quality, security scan, inspect, examine, validate, verify, UI audit, design audit, visual audit, layout audit, design drift
**Flows:** audit-and-fix/, test-coverage/, e2e-playwright/, ui-design-audit/, backwards-harmony-audit/, cli-integration-test/, contract-index/, contract-compliance-audit/
**Examples:**
- "review the auth implementation"
- "audit security vulnerabilities"
- "check code quality of backend routes"
- "inspect the database schema"
- "run E2E tests" / "playwright test" / "browser test"

### pm
**Purpose:** Project management, planning, and coordination
**Icon:** clipboard
**Triggers:** plan, roadmap, organize, track tasks, project management, priorities, schedule, coordinate, dissolve learnings, process learnings
**Flows:** planning/, learning-dissolution/
**Examples:**
- "plan the next sprint"
- "create a roadmap for Q2"
- "what are the current priorities"
- "organize upcoming tasks"
- "dissolve learnings" / "process learnings"

### settings
**Purpose:** Configuration, framework development, onboarding, and system management
**Icon:** gear
**Triggers:** configure, set up, change settings, create flow, create action, onboard me, framework health, setup, initialize, audit flows, flow drift, cleanup, housekeeping, tidy up, remove artifacts, health protocol, logging check, parser update, token migration
**Flows:** onboarding/, flow-creation/, action-creation/, action-deletion/, standards-creation/, framework-health/, contract-drift-fix/, flow-drift-audit/, cleanup/, design-token-migration/, health-audit-and-fix/, health-protocol/, parser-update/, logging-check/
**Examples:**
- "configure backend port"
- "create a new testing flow"
- "onboard me to ActionFlows"
- "check framework health"
- "audit flows" / "check flow drift"
- "clean up unused imports" / "housekeeping"
- "run health protocol"

### archive
**Purpose:** Historical sessions, searchable memory
**Icon:** archive box
**Triggers:** history, archived, past sessions, search history, old sessions, look back, completed sessions
**Flows:** (empty -- future phases will add flows)
**Examples:**
- "show me archived sessions"
- "search past conversations"
- "find old work on auth"

### studio
**Purpose:** Component preview, layout testing, live renders, agent UI materialization
**Icon:** paintbrush
**Triggers:** preview, component preview, test layout, live render, studio, design, prototype, visual test, materialize UI
**Flows:** (empty -- Phase 9 will add flows)
**Examples:**
- "preview the new card component"
- "test this layout"
- "open studio"
- "prototype a dashboard view"

## Auto-Target Contexts (1)

These contexts receive content automatically -- not routed by user intent.

### system-health
**Purpose:** System health monitoring, violations, and remediations
**Icon:** heartbeat
**Routing:** Populated by system health detection, not user requests

## Manual-Only Context (1)

### editor
**Purpose:** Full-screen code editing
**Icon:** document
**Routing:** User opens manually, never orchestrator-routed

## Context-to-Flow Directory Mapping

| Context | Flow Directories | Rationale |
|---------|-----------------|-----------|
| work | project/ | Feature dev, new code, and bug fixes |
| explore | framework/ | Research, ideation, doc reorganization, code intelligence |
| review | project/, framework/ | QA flows (project/) + system health audit (framework/) |
| pm | framework/ | Planning and coordination |
| settings | settings/, maintenance/ | Framework configuration, flow/action creation, system management, cleanup |
| archive | (none yet) | Historical sessions and searchable memory |
| studio | (none yet) | Component preview and layout testing |

## Routing Guide

| Human Says | Context | Flow/Action |
|------------|---------|-------------|
| "implement X" / "add feature X" | work | code-and-review/ |
| "fix bug X" / "X is broken" | work | bug-triage/ |
| "refactor X" | work | code-and-review/ |
| "clean up X" / "remove artifacts" / "housekeeping" / "tidy up" / "delete leftovers" | settings | cleanup/ |
| "audit security" / "security scan" | review | audit-and-fix/ |
| "review PR" / "check quality" | review | audit-and-fix/ |
| "run tests" | -- | test/ (direct action) |
| "analyze X" / "explore X" | explore | analyze/ (direct action) |
| "create a new flow" | settings | flow-creation/ |
| "create a new action" | settings | action-creation/ |
| "check framework health" | settings | framework-health/ |
| "teach me ActionFlows" / "onboarding" | settings | onboarding/ |
| "review roadmap" / "what is next" | pm | planning/ (review mode) |
| "update roadmap" / "reprioritize" | pm | planning/ (update mode) |
| "plan X" | pm | plan/ (direct action) |
| "check test coverage" / "coverage gaps" | review | test-coverage/ |
| "audit system health" / "check contract" / "backwards audit" | review | backwards-harmony-audit/ |
| "implement format" / "format X.Y" / "contract parser" | work | contract-format-implementation/ |
| "test CLI" / "CLI integration tests" / "run CLI tests" | review | cli-integration-test/ |
| "run E2E tests" / "playwright test" / "browser test" / "E2E" | review | e2e-playwright/ |
| "behavioral contracts" / "component contracts" / "contract index" | review | contract-index/ |
| "audit contracts" / "contract compliance" / "contract drift" / "check contracts" | review | contract-compliance-audit/ |
| "I have an idea" / "brainstorm X" | explore | ideation/ |
| "let us think about X" / "ideation" | explore | ideation/ |
| "tell me a story" / "write the next chapter" | explore | story-of-us/ |
| "story of us" / "continue the story" | explore | story-of-us/ |
| "create dossier" / "intel on X" | explore | intel-analysis/ |
| "track domain X" / "gather intel" | explore | intel-analysis/ |
| "dissolve learnings" / "process learnings" / "learning retrospective" / "update docs from learnings" | pm | learning-dissolution/ |
| "audit flows" / "check flow drift" / "flow health deep scan" / "flow instructions audit" | settings | flow-drift-audit/ |
| "UI audit" / "design audit" / "visual drift" / "design drift" | review | ui-design-audit/ |
| "run health protocol" / "system health check" | settings | health-protocol/ |
| "update parser" / "parser out of sync" | settings | parser-update/ |
| "design token migration" / "replace hardcoded colors" | settings | design-token-migration/ |
| "preview component" / "test layout" / "open studio" | studio | (future flows) |
| "show archived sessions" / "search history" | archive | (future flows) |
