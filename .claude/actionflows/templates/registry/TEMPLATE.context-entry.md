# Context Entry Template

**Purpose:** Template for adding new contexts to CONTEXTS.md registry
**Registry File:** `.claude/actionflows/CONTEXTS.md`
**Used By:** Orchestrator (routing), Dashboard (UI organization)

---

## Overview

CONTEXTS.md defines routing contexts that organize flows and determine how the orchestrator handles user requests. Each context has trigger keywords, associated flows, and special routing rules.

**Context Types:**
1. **Routable Contexts** — User requests route here based on trigger keywords
2. **Auto-Target Contexts** — Sessions move here automatically based on state
3. **Manual-Only Contexts** — User opens manually, never orchestrator-routed

---

## Format 1: Routable Context Entry

**Use when:** Creating a context that users can route to via natural language triggers

**Location in CONTEXTS.md:** Lines 11-89, under `## Primary Contexts (Routable)`

**Entry Structure:**

```markdown
### {context-name}
**Purpose:** {One sentence describing this context's domain}
**Icon:** {Emoji}
**Triggers:** {keyword1, keyword2, keyword3, ...}
**Flows:** {flow1/, flow2/, flow3/}
**Examples:**
- "{example user phrase 1}"
- "{example user phrase 2}"
- "{example user phrase 3}"
```

**Field Definitions:**

- **Context Name (H3 Header):** Lowercase, no spaces, no special characters (e.g., `work`, `maintenance`, `review`)
- **Purpose:** One-sentence description (< 100 chars) of what this context handles
- **Icon:** Single emoji representing the context (for UI display)
- **Triggers:** Comma-separated keywords that route requests to this context (no quotes)
- **Flows:** Comma-separated flow names (with trailing slashes) from FLOWS.md
- **Examples:** 3-5 quoted example phrases showing how users trigger this context

**Template:**

```markdown
### {context-name}
**Purpose:** {One-sentence purpose}
**Icon:** {Emoji}
**Triggers:** {trigger1, trigger2, trigger3}
**Flows:** {flow1/, flow2/, flow3/}
**Examples:**
- "{example phrase 1}"
- "{example phrase 2}"
- "{example phrase 3}"
```

**Example:**

```markdown
### work
**Purpose:** Active feature development and new code
**Icon:** 🔨
**Triggers:** implement, build, create, add feature, develop, code, write, generate, construct, design
**Flows:** code-and-review/, post-completion/, contract-format-implementation/
**Examples:**
- "implement user authentication"
- "build a dashboard component"
- "add a new API endpoint"
```

**Validation Rules:**
- Context name MUST be lowercase, no spaces
- Icon MUST be single emoji
- Triggers MUST be comma-separated keywords (no quotes, no punctuation)
- Flows MUST reference registered flows from FLOWS.md (with trailing slashes)
- Examples MUST be quoted user phrases (realistic requests)
- Examples should demonstrate trigger keyword usage

---

## Optional: Special Routing Rules

**Use when:** Context has conditional routing logic beyond simple keyword matching

**Location:** After the Examples field, before next context

**Structure:**

```markdown
**Special Routing:**
- {Condition description} → {Flow or action to use}
- {Another condition} → {Another flow}
```

**Example (from `work` context):**

```markdown
**Special Routing:**
- Contract format implementation (mentions "Format X.Y", files include `contract/`) → Always use `contract-format-implementation/` flow
```

**Common Special Routing Patterns:**
- File path conditions: `files include {pattern}` → `{specific-flow}/`
- Mention conditions: `mentions "{keyword}"` → `{specific-flow}/`
- Combined conditions: `{condition1} AND {condition2}` → `{flow}/`

---

## Format 2: Auto-Target Context Entry

**Use when:** Creating a context that sessions move to automatically (not user-triggered)

**Location in CONTEXTS.md:** Lines 91-103, under `## Auto-Target Contexts`

**Entry Structure:**

```markdown
### {context-name}
**Purpose:** {One-sentence purpose}
**Icon:** {Emoji}
**Routing:** {Automatic rule description}
```

**Field Definitions:**

- **Context Name (H3 Header):** Lowercase, no spaces
- **Purpose:** One-sentence description
- **Icon:** Single emoji
- **Routing:** Describes when sessions auto-move to this context

**Template:**

```markdown
### {context-name}
**Purpose:** {One-sentence purpose}
**Icon:** {Emoji}
**Routing:** {When sessions move here automatically}
```

**Example:**

```markdown
### archive
**Purpose:** Completed and historical sessions
**Icon:** 📦
**Routing:** Sessions move here automatically when completed
```

**Validation Rules:**
- NO Triggers field (not user-routable)
- NO Flows field (no orchestrated flows here)
- NO Examples field (not triggered by user phrases)
- Routing field MUST describe automatic behavior

**Common Auto-Target Contexts:**
- **archive** — Completed sessions
- **system-health** — Contract drift/system health violations

---

## Format 3: Manual-Only Context Entry

**Use when:** Creating a context that users open manually (never orchestrator-routed)

**Location in CONTEXTS.md:** Lines 105-110, under `## Manual-Only Contexts`

**Entry Structure:**

```markdown
### {context-name}
**Purpose:** {One-sentence purpose}
**Icon:** {Emoji}
**Routing:** User opens manually, never orchestrator-routed
```

**Field Definitions:**

- **Context Name (H3 Header):** Lowercase, no spaces
- **Purpose:** One-sentence description
- **Icon:** Single emoji
- **Routing:** Always "User opens manually, never orchestrator-routed"

**Template:**

```markdown
### {context-name}
**Purpose:** {One-sentence purpose}
**Icon:** {Emoji}
**Routing:** User opens manually, never orchestrator-routed
```

**Example:**

```markdown
### editor
**Purpose:** Full-screen code editing
**Icon:** 📝
**Routing:** User opens manually, never orchestrator-routed
```

**Validation Rules:**
- NO Triggers field (not routable)
- NO Flows field (no flows here)
- NO Examples field (not triggered)
- Routing MUST be the standard manual-only phrase

**Common Manual-Only Contexts:**
- **editor** — Full-screen code editor
- **settings** — User preferences (if added)

---

## Supporting Tables

After adding a new routable context, update these reference tables in CONTEXTS.md:

### 1. Context-to-Flow Directory Mapping

**Location:** Lines 112-122

**Purpose:** Maps contexts to filesystem directories (organizational, not routing)

**Table Header:**
```markdown
| Context | Flow Directories | Rationale |
|---------|-----------------|-----------|
```

**Template:**
```markdown
| {context-name} | {directory1/}, {directory2/} | {One-sentence explanation} |
```

**Example:**
```markdown
| work | project/ | Feature dev and new code |
```

**When to Add:**
If context has dedicated flow directory in filesystem, add mapping. Otherwise skip.

---

### 2. Routing Guide Table

**Location:** Lines 124-156

**Purpose:** Quick reference showing example phrases and their routing

**Table Header:**
```markdown
| Human Says | Context | Flow/Action |
|------------|---------|-------------|
```

**Template:**
```markdown
| "{example phrase}" / "{variant phrase}" | {context-name} | {flow-name}/ |
```

**Example:**
```markdown
| "implement feature X" / "build component Y" | work | code-and-review/ |
```

**When to Add:**
Add 1-3 representative examples for the new context. Use ` / ` to separate phrase variants.

**Direct Action Pattern:**
If phrase routes directly to action (no flow), use:
```markdown
| "{phrase}" | — | {action}/ (direct action) |
```

---

## Cross-Registry Validation

**IMPORTANT:** When adding a new context, verify:

### 1. Flow References
All flows in **Flows:** field MUST exist in FLOWS.md.

**Example:**
```markdown
# CONTEXTS.md
### work
**Flows:** code-and-review/, post-completion/

# FLOWS.md (must contain)
| code-and-review/ | ... | ... |
| post-completion/ | ... | ... |
```

**Note:** If flows reference new actions, ensure those actions are also registered in ACTIONS.md before adding the flow to a context.

---

### 2. FLOWS.md Context Headers
Add corresponding H2 header in FLOWS.md for organizing flows.

**Example:**
```markdown
# CONTEXTS.md
### api
**Purpose:** API design and documentation
**Triggers:** api, endpoint, swagger, openapi

# FLOWS.md (add section)
## api

| Flow | Purpose | Chain |
|------|---------|-------|
| api-documentation/ | Generate OpenAPI specs | analyze → plan → code → review |
```

---

### 3. Unique Context Names
Context names MUST be globally unique across all context types.

**Invalid:**
```markdown
### work  (routable)
### work  (auto-target)  ❌ Duplicate!
```

---

## Insertion Guidelines

### Step 1: Choose Context Type
- **Routable** — User triggers via keywords (most common)
- **Auto-Target** — Sessions move automatically
- **Manual-Only** — User opens manually

### Step 2: Determine Context Name
- Lowercase, no spaces
- Single word preferred (e.g., `work`, `review`, `settings`)
- Multi-word: use hyphen (e.g., `code-intel`, `api-design`)

### Step 3: Gather Trigger Keywords
For routable contexts, brainstorm 8-12 trigger keywords:
- Action verbs (implement, build, create)
- Domain nouns (feature, component, endpoint)
- Synonyms (code, write, develop)

### Step 4: Identify Flows
List flows that belong to this context. Flows should share:
- Similar intent (all feature dev, all QA, etc.)
- Common trigger patterns
- Cohesive user mental model

### Step 5: Write Examples
Create 3-5 realistic user phrases showing:
- Different trigger keyword usage
- Variety of request styles
- Common use cases

### Step 6: Update Supporting Tables
- Add Context-to-Flow Directory Mapping entry (if applicable)
- Add 1-3 Routing Guide examples

---

## Example: Adding a New Context

**Scenario:** Creating an "api" context for API design and documentation.

**Step 1: Routable Context Entry**

```markdown
### api
**Purpose:** API design, documentation, and endpoint management
**Icon:** 🔌
**Triggers:** api, endpoint, swagger, openapi, rest, graphql, documentation, spec, schema
**Flows:** api-documentation/, endpoint-design/, schema-validation/
**Examples:**
- "generate OpenAPI spec for the backend"
- "design a new REST endpoint for user profiles"
- "validate GraphQL schema against database"
- "document the authentication API"
```

**Step 2: Context-to-Flow Directory Mapping**

```markdown
| Context | Flow Directories | Rationale |
|---------|-----------------|-----------|
| work | project/ | Feature dev and new code |
| api | api/ | API design and documentation |
| settings | settings/, maintenance/ | Bug fixes, config, and housekeeping |
```

**Step 3: Routing Guide Examples**

```markdown
| Human Says | Context | Flow/Action |
|------------|---------|-------------|
| "generate API docs" / "create OpenAPI spec" | api | api-documentation/ |
| "design new endpoint" / "add API route" | api | endpoint-design/ |
```

**Step 4: FLOWS.md Update**

Add H2 section in FLOWS.md:

```markdown
## api

| Flow | Purpose | Chain |
|------|---------|-------|
| api-documentation/ | Generate OpenAPI specs from routes | analyze → plan → code → review → commit |
| endpoint-design/ | Design and implement new API endpoints | plan → code/backend → test → review |
| schema-validation/ | Validate API schemas against implementation | analyze → audit → plan → code |
```

---

## Icon Selection Guidelines

Choose emojis that are:
- **Recognizable** — Commonly associated with the domain
- **Distinct** — Visually different from other context icons
- **Single character** — No compound emojis

**Common Icon Choices:**

| Context Type | Icons | Examples |
|--------------|-------|----------|
| Development | 🔨 ⚙️ 🛠️ 💻 | work, code-intel |
| QA/Review | 🔍 ✅ 🧪 📋 | review, audit |
| Documentation | 📚 📝 📄 📖 | explore, docs |
| Planning | 🎯 📊 🗺️ 🎨 | pm, design |
| API/Integration | 🔌 🔗 🌐 📡 | api, integrations |
| Settings | 🧹 🔧 ⚠️ 🩹 | maintenance, cleanup |
| Archive | 📦 🗃️ 📁 | archive |

---

## Supporting Files Checklist

After adding a context entry to CONTEXTS.md, ensure:

- ✅ All flows in **Flows:** field exist in FLOWS.md
- ✅ H2 section added to FLOWS.md for new context
- ✅ Trigger keywords are diverse and comprehensive
- ✅ Examples demonstrate realistic use cases
- ✅ Context-to-Flow Directory Mapping updated (if applicable)
- ✅ Routing Guide table updated with examples
- ✅ Icon is single emoji and visually distinct

---

## Cross-References

- **Registry File:** `.claude/actionflows/CONTEXTS.md`
- **Related Templates:** `TEMPLATE.action-entry.md`, `TEMPLATE.flow-entry.md`
- **Flows Registry:** `.claude/actionflows/FLOWS.md`
- **Actions Registry:** `.claude/actionflows/ACTIONS.md`
