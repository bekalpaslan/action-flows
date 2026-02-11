# Context Routing

> Maps human intent directly to workbench contexts.

## Routing

Request → Keyword Extraction → Context Scoring → Selection or Disambiguation

## Routable Contexts (7)

### work
**Purpose:** Active feature development and new code
**Icon:** 🔨
**Triggers:** implement, build, create, add feature, develop, code, write, generate, construct, design
**Flows:** code-and-review/, post-completion/
**Examples:**
- "implement user authentication"
- "build a dashboard component"
- "add export functionality"
- "create a new API endpoint"

### maintenance
**Purpose:** Bug fixes, refactoring, and housekeeping
**Icon:** 🔧
**Triggers:** fix bug, resolve issue, patch, refactor, optimize, cleanup, improve performance, technical debt, debug, repair
**Flows:** bug-triage/, code-and-review/, cleanup/
**Examples:**
- "fix the login bug"
- "refactor the session storage"
- "optimize database queries"
- "cleanup unused imports"

### explore
**Purpose:** Research, codebase exploration, and learning
**Icon:** 🔍
**Triggers:** explore, investigate, research, learn, understand, explain, how does, study, analyze, discover
**Flows:** doc-reorganization/, ideation/
**Examples:**
- "explore the WebSocket implementation"
- "research best practices for state management"
- "how does the contract parser work"
- "investigate performance bottlenecks"

### review
**Purpose:** Code reviews, audits, and quality checks
**Icon:** 👁️
**Triggers:** review, code review, audit, check quality, security scan, inspect, examine, validate, verify
**Flows:** audit-and-fix/, test-coverage/
**Examples:**
- "review the auth implementation"
- "audit security vulnerabilities"
- "check code quality of backend routes"
- "inspect the database schema"

### settings
**Purpose:** Configuration, framework development, and onboarding
**Icon:** ⚙️
**Triggers:** configure, set up, change settings, create flow, create action, onboard me, framework health, setup, initialize
**Flows:** onboarding/, flow-creation/, action-creation/, framework-health/
**Examples:**
- "configure backend port"
- "create a new testing flow"
- "onboard me to ActionFlows"
- "check framework health"

### pm
**Purpose:** Project management, planning, and coordination
**Icon:** 📋
**Triggers:** plan, roadmap, organize, track tasks, project management, what's next, priorities, schedule, coordinate
**Flows:** planning/
**Examples:**
- "plan the next sprint"
- "create a roadmap for Q2"
- "what are the current priorities"
- "organize upcoming tasks"

### intel
**Purpose:** Code intelligence, living dossiers, domain monitoring
**Icon:** 🕵️
**Triggers:** dossier, intel, intelligence, monitor, watch, track, insight, analyze domain, code health, gather intel
**Flows:** intel-analysis/
**Examples:**
- "create an intel dossier for the auth system"
- "analyze the backend services"
- "track changes to the API routes"
- "gather intel on the frontend components"

## Auto-Target Contexts (2)

These contexts receive content automatically — not routed by user intent.

### archive
**Purpose:** Completed and historical sessions
**Icon:** 📦
**Routing:** Sessions move here automatically when completed

### harmony
**Purpose:** Violations, sins, and remediations
**Icon:** ❤️
**Routing:** Populated by harmony detection system, not user requests

## Manual-Only Context (1)

### editor
**Purpose:** Full-screen code editing
**Icon:** 📝
**Routing:** User opens manually, never orchestrator-routed

## Context-to-Flow Directory Mapping

| Context | Flow Directories | Rationale |
|---------|-----------------|-----------|
| work | project/ | Feature dev and new code |
| maintenance | project/ | Bug fixes and refactoring |
| explore | framework/ | Research, ideation, doc reorganization |
| review | project/, framework/ | QA flows (project/) + harmony audit (framework/) |
| settings | framework/ | Config and meta-framework |
| pm | framework/ | Planning and coordination |
| intel | project/ | Code intelligence and dossiers |

## Routing Guide

| Human Says | Context | Flow/Action |
|------------|---------|-------------|
| "implement X" / "add feature X" | work | code-and-review/ |
| "fix bug X" / "X is broken" | maintenance | bug-triage/ |
| "refactor X" | maintenance | code-and-review/ |
| "clean up X" / "remove artifacts" / "housekeeping" / "tidy up" / "delete leftovers" | maintenance | cleanup/ |
| "audit security" / "security scan" | review | audit-and-fix/ |
| "review PR" / "check quality" | review | audit-and-fix/ |
| "run tests" | — | test/ (direct action) |
| "analyze X" / "explore X" | explore | analyze/ (direct action) |
| "create a new flow" | settings | flow-creation/ |
| "create a new action" | settings | action-creation/ |
| "check framework health" | settings | framework-health/ |
| "teach me ActionFlows" / "onboarding" | settings | onboarding/ |
| "review roadmap" / "what's next" | pm | planning/ (review mode) |
| "update roadmap" / "reprioritize" | pm | planning/ (update mode) |
| "plan X" | pm | plan/ (direct action) |
| "check test coverage" / "coverage gaps" | review | test-coverage/ |
| "audit harmony" / "check contract" / "backwards harmony" | review | backwards-harmony-audit/ |
| "test CLI" / "CLI integration tests" / "run CLI tests" | review | cli-integration-test/ |
| "behavioral contracts" / "component contracts" / "contract index" | review | contract-index/ |
| "audit contracts" / "contract compliance" / "contract drift" / "check contracts" | review | contract-compliance-audit/ |
| "I have an idea" / "brainstorm X" | explore | ideation/ |
| "let's think about X" / "ideation" | explore | ideation/ |
| "create dossier" / "intel on X" | intel | intel-analysis/ |
| "track domain X" / "gather intel" | intel | intel-analysis/ |
| "dissolve learnings" / "process learnings" / "learning retrospective" / "update docs from learnings" | pm | learning-dissolution/ |
