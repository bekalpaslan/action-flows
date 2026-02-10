# Figma MCP Server Integration Research

**Aspect:** Figma MCP server capabilities and design system integration patterns
**Scope:** Web research + packages/mcp-server/ analysis
**Date:** 2026-02-09
**Agent:** analyze/

---

## Executive Summary

This report provides a comprehensive analysis of Figma's Model Context Protocol (MCP) server capabilities and integration patterns for design systems. Research reveals that Figma officially released an MCP server in late 2024/early 2025, enabling AI-powered design-to-code workflows with bidirectional sync capabilities. The technology is production-ready with multiple community implementations and emerging best practices.

**Key Finding:** Figma MCP integration can bridge the critical gap between design and code in ActionFlows Dashboard, enabling automated design token extraction, component mapping, and drift detection—all through a standardized protocol that aligns perfectly with our existing MCP architecture.

---

## 1. Figma MCP Server Ecosystem

### 1.1 Official Figma MCP Server

**Status:** Production-ready, officially supported by Figma
**Release:** November 2024 (protocol spec) → January 2025 (Figma server)
**Repository:** github.com/figma/mcp-server-guide

**Core Capabilities:**

1. **Frame-to-Code Generation**
   - Select any Figma frame and generate code (default: React + Tailwind)
   - Customizable output through natural language prompts
   - Leverages Code Connect for component mapping
   - Ideal for prototyping and rapid iteration

2. **Design Token Retrieval**
   - Extract variables (colors, spacing, typography, effects)
   - Retrieve styles applied to selections
   - Support for multiple modes/themes
   - Returns structured data for codegen

3. **Component Mapping (Code Connect)**
   - Maps Figma node IDs → codebase component paths
   - Returns `codeConnectSrc` (file location) and `codeConnectName` (component name)
   - Ensures generated code matches existing component library
   - Critical for design system consistency

4. **Layout & Hierarchy Data**
   - Extract structural information (flex, grid, positioning)
   - Retrieve component instances and their props
   - Access nested frame structures
   - Useful for responsive design implementation

**Access Methods:**
- **Desktop Server:** Requires Figma desktop app, uses local UNIX socket
- **Remote Server:** API-based, no desktop app required (requires Figma access token)
- **IDE Integration:** Works with VS Code Copilot, Cursor, Windsurf, Claude Code

### 1.2 Community MCP Servers

**GLips/Figma-Context-MCP** (github.com/GLips/Figma-Context-MCP)
- Focus: Provide Figma layout context to AI coding agents
- Capabilities: Extract component structure, spacing, typography
- Known Issue: 429 rate limit errors reported (Issue #258)
- Use Case: Cursor IDE integration for context-aware coding

**southleft/figma-console-mcp** (github.com/southleft/figma-console-mcp)
- Tagline: "Your design system as an API"
- Capabilities: Extraction, creation, debugging
- Advanced: Supports design system manipulation via MCP tools
- Use Case: Automated design system management

**timholden/figma-design-system** (PulseMCP)
- Focus: Design system specific workflows
- Integration: Available through PulseMCP marketplace
- Status: Community-maintained

### 1.3 Our Current MCP Pattern

**Analysis of packages/mcp-server/src/index.ts:**

```typescript
// Current implementation uses @modelcontextprotocol/sdk v1.0.0
// Architecture: Server + StdioServerTransport
// Tools: check_commands, ack_command
// Pattern: Polling-based command check with acknowledgment
```

**Key Patterns We Already Use:**
1. **Server Setup:** Class-based with constructor-injected config
2. **Tool Definition:** ListToolsRequestSchema for tool listing
3. **Tool Execution:** CallToolRequestSchema for tool invocation
4. **Error Handling:** Graceful degradation with empty arrays on failure
5. **Transport:** StdioServerTransport for Claude Code integration
6. **Backend Communication:** RESTful API calls via node-fetch

**Integration Compatibility:**
- Same SDK version (1.0.0) as Figma MCP server
- Same transport layer (Stdio)
- Same error handling patterns (graceful degradation)
- Same JSON response structure

**Gap Analysis:**
- Current server: Control flow commands (dashboard → orchestrator)
- Figma server: Design data retrieval (Figma → AI agent)
- Both follow same architectural patterns → easy integration

---

## 2. Figma Design Tokens & Variables API

### 2.1 Variables System (2025/2026 State)

**Figma Variables** = Native design token system introduced in 2023, matured in 2024-2025

**Key Features:**
- **Multi-mode Support:** Light/Dark themes, brand variations, responsive breakpoints
- **Scoping:** Define where variables can be applied (component-level, file-level)
- **Code Syntax:** Preview tokens in developer-friendly format (CSS custom properties)
- **Token Types:** Color, number, string, boolean (covers 95% of design token use cases)
- **Aliasing:** Variables can reference other variables (semantic tokens → base tokens)
- **Collections:** Group related variables (e.g., "Color Tokens", "Spacing Scale")

**2025/2026 Updates:**
- **Expression Tokens** (rolling out): Conditional logic, math operations, context-driven computation
- **Enhanced Dev Mode:** Direct variable inspection, suggested variables, collections table
- **REST API Endpoints:** Query, create, update variables programmatically

**Dev Mode Integration:**
- Eliminates manual translation (4px → `var(--spacer-2)`)
- Provides variable details on hover
- Shows all local collections in variables table
- Displays applied variables in inspect panel

### 2.2 Design Tokens Export Pipeline

**Standard Architecture:** Export → Build → Ship

**Export Phase:**
1. **Source:** Figma Variables API (`GET /v1/files/:file_key/variables`)
2. **Format:** JSON structure with collections, modes, variables, resolved values
3. **Tools:**
   - Figma REST API (direct access)
   - Figma Plugins (Export Variables, Design Tokens, Tokens Studio)
   - Figma MCP server (via MCP tools)

**Build Phase:**
1. **Transformation:** JSON → Platform tokens (CSS, SCSS, Tailwind, Swift, XML)
2. **Tools:**
   - Style Dictionary (industry standard)
   - Token Transformer (Figma JSON → Style Dictionary format)
   - Custom Node.js scripts
3. **Configuration:** Define naming conventions, output formats, file structure

**Ship Phase:**
1. **Distribution:** npm packages, CDN, design system repository
2. **Consumption:** Import tokens into React components, stylesheets, native apps
3. **Documentation:** Auto-generate token docs with examples

**Token Structure Best Practices:**

```
Base Tokens (Raw Values)
├── color.blue.500: #0066FF
├── color.gray.100: #F5F5F5
└── space.16: 16px

Semantic Tokens (Aliases)
├── color.text.primary → color.gray.900
├── color.bg.surface → color.white
└── space.component.padding → space.16

Theme Modes
├── Light Mode: color.text.primary = #1A1A1A
└── Dark Mode: color.text.primary = #FFFFFF
```

**Platform Outputs:**

```css
/* CSS Variables */
:root {
  --color-text-primary: #1A1A1A;
  --space-component-padding: 16px;
}

[data-theme="dark"] {
  --color-text-primary: #FFFFFF;
}
```

```scss
/* SCSS Variables */
$color-text-primary: #1A1A1A;
$space-component-padding: 16px;
```

```swift
// Swift (iOS)
public enum ColorTokens {
    static let textPrimary = UIColor(hex: "1A1A1A")
}
```

### 2.3 Figma REST API Access

**Authentication:**
- Personal Access Tokens (PAT): User-scoped, easy to generate
- OAuth 2.0: App-scoped, per-user rate limits
- Both methods support full API access

**Key Endpoints:**

```
GET /v1/files/:file_key                          # File structure
GET /v1/files/:file_key/variables                # Variables & styles
GET /v1/files/:file_key/components               # Component definitions
GET /v1/files/:file_key/styles                   # Text/effect/paint styles
GET /v1/images/:file_key                         # Export images/assets
GET /v1/files/:file_key/nodes?ids=:node_ids      # Specific nodes
```

**Rate Limits (Updated Nov 2025):**
- Varies by plan tier (Starter, Professional, Organization, Enterprise)
- Varies by seat type (View, Collab, Dev, Full)
- OAuth apps: Per-user, per-plan, per-app tracking
- Algorithm: Leaky bucket with exponential backoff
- Error: 429 Too Many Requests (includes retry-after header)
- Figma reserves right to change limits

**Typical Limits:**
- Professional Plan: ~100-200 requests/hour (observed, not documented)
- Enterprise Plan: Higher limits (undisclosed)
- Images endpoint: More restrictive (~10-50 requests for CloudFront)

**Best Practices:**
- Cache responses aggressively
- Use webhooks to avoid polling
- Batch requests where possible
- Respect retry-after headers
- Consider Enterprise plan for high-volume automation

---

## 3. Figma-to-Code Pipeline Patterns

### 3.1 Token Extraction Tools

**Figma Token Exporter** (figma-tokens.com)
- **Type:** Web-based tool + Figma plugin
- **Input:** Figma access token + file ID
- **Output:** CSS, SCSS, SASS, Less, Stylus
- **Features:** Select collections, modes, syntax; lightweight interface
- **Best For:** Quick manual exports

**Export Variables Plugin** (Figma Community)
- **Type:** Figma plugin (in-app)
- **Input:** Active Figma file
- **Output:** CSS, SCSS, Tailwind config
- **Features:** Load tokens, select collections/modes, preview output
- **Best For:** Designer-friendly exports

**Variables to Tokens & Code Plugin** (Figma Community)
- **Type:** Figma plugin
- **Output:** Design Tokens JSON (W3C format) + code snippets
- **Features:** W3C Design Tokens Community Group spec compliance
- **Best For:** Standards-based token exchange

**Figma Extractor** (github.com/kataras/figma-extractor)
- **Type:** CLI tool
- **Output:** Markdown with CSS variables
- **Features:** Extracts design tokens and specifications
- **Best For:** AI-powered implementation (includes context for LLMs)

### 3.2 Build Tools

**Style Dictionary** (github.com/amzn/style-dictionary)
- Industry standard for token transformation
- Supports 10+ output formats (CSS, SCSS, JS, JSON, Swift, Kotlin, XML, etc.)
- Highly configurable with custom transforms, formats, filters
- Used by Salesforce, Adobe, Amazon, Microsoft

**Token Transformer** (github.com/tokens-studio/token-transformer)
- Converts Figma Tokens plugin JSON → Style Dictionary format
- Handles complex token structures (aliasing, theming)
- Required when using Tokens Studio plugin output

**Tokens Studio** (docs.tokens.studio)
- Advanced Figma plugin for token management
- Supports GitHub/GitLab sync, JSON storage
- More powerful than native Figma variables (pre-2025)
- Still relevant for teams needing git-based token workflows

### 3.3 Automation Workflows

**CI/CD Pipeline Pattern:**

```yaml
# Example: GitHub Actions workflow
name: Sync Figma Tokens

on:
  # Trigger 1: Figma webhook (file updated)
  repository_dispatch:
    types: [figma-file-updated]

  # Trigger 2: Manual trigger
  workflow_dispatch:

  # Trigger 3: Schedule (fallback)
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  extract-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Extract Figma tokens
        run: |
          curl "https://api.figma.com/v1/files/$FIGMA_FILE_KEY/variables" \
            -H "X-Figma-Token: $FIGMA_TOKEN" \
            -o tokens-raw.json

      - name: Transform tokens
        run: npx token-transformer tokens-raw.json tokens.json

      - name: Build platform tokens
        run: npx style-dictionary build

      - name: Commit changes
        run: |
          git config user.name "Figma Bot"
          git add design-tokens/
          git commit -m "chore: sync design tokens from Figma"
          git push

      - name: Create PR if changes
        run: gh pr create --title "Design tokens sync" --body "Auto-generated"
```

**Webhook Setup:**
1. Create webhook via Figma API: `POST /v2/webhooks`
2. Subscribe to events: `FILE_UPDATE`, `FILE_VERSION_UPDATE`, `LIBRARY_PUBLISH`
3. Configure endpoint: Your server receives POST with event data
4. Trigger CI/CD: Repository dispatch or direct pipeline trigger

**Real-World Example (Lyne Design System):**
- github.com/lyne-design-system/lyne-figma-listener
- Node.js server listening to Figma webhooks
- Auto-triggers icon build/deploy when library publishes
- Uses Travis CI for build pipeline

---

## 4. Bidirectional Sync & Drift Detection

### 4.1 Drift Detection Concepts

**Design Drift** = Discrepancy between design source (Figma) and implementation (code)

**Common Drift Scenarios:**
1. **Token Drift:** Color changed in Figma but hardcoded in CSS
2. **Component Drift:** Design updated but implementation not synced
3. **Layout Drift:** Spacing/sizing changed in Figma, not reflected in code
4. **Content Drift:** Copy/text differs between design and implementation

**Detection Methods:**

**Polling-Based:**
- Periodic API calls to Figma (e.g., every 6 hours)
- Compare fetched state with local state
- Flag differences for review
- **Pros:** Simple, reliable
- **Cons:** Delayed detection, API quota usage

**Webhook-Based:**
- Real-time notifications on Figma changes
- Immediate drift detection
- Trigger automated tests/builds
- **Pros:** Instant feedback, efficient
- **Cons:** Requires server infrastructure, webhook reliability

**Git-Based:**
- Commit Figma JSON to git on every change
- Use git diff to detect changes
- PR workflow for design updates
- **Pros:** Version control, audit trail
- **Cons:** Requires automation setup

### 4.2 Bidirectional Sync Tools

**Flusk** (flusk.dev)
- **Type:** AI agent for design-code sync
- **Direction:** Bidirectional (Figma ↔ Code)
- **Features:**
  - Maps design elements to code components
  - Detects divergence between design and code
  - Intelligent synchronization (not blind overwrite)
  - Prevents design drift via automated updates
- **Status:** Emerging tool (2025/2026)

**GitFig** (gitfig.com)
- **Type:** Bidirectional sync for design systems
- **Direction:** Figma ↔ GitHub
- **Features:**
  - Sync design tokens, variables, styles
  - Full Git workflows (branches, PRs, commits)
  - Divergence detection with conflict warnings
  - Prevents accidental overwrites
- **Best For:** Teams with git-centric workflows

**Styleframe** (styleframe.dev/figma)
- **Type:** Bidirectional token sync
- **Direction:** Codebase ↔ Figma
- **Features:**
  - CLI + Figma plugin
  - Runs in CI/CD pipelines
  - Auto-sync on every code change
  - No manual exports, no drift
- **Best For:** Continuous deployment environments

**Design System Sync Plugin** (Figma Community #1588064189860517649)
- **Type:** Figma plugin
- **Features:** Export tokens and components, changelog tracking
- **Best For:** Manual sync workflows with audit trail

**Figma-to-Frontend Automation (VK Team)**
- **Type:** Custom automation (article reference)
- **Approach:** Automated synchronization between Figma and frontend
- **Best For:** Large-scale enterprise design systems

### 4.3 Drift Prevention Strategies

**1. Single Source of Truth (SSOT)**
- **Figma as SSOT:** Design tokens defined in Figma, code consumes
- **Code as SSOT:** Tokens defined in code, synced to Figma (rare)
- **Shared SSOT:** Tokens in JSON repo, synced bidirectionally (GitFig approach)

**2. Automated Testing**
- Visual regression tests (Percy, Chromatic)
- Token validation tests (ensure CSS matches Figma)
- Component snapshot tests (detect unexpected changes)

**3. PR Integration**
- Link Figma files to GitHub PRs
- Figma's native GitHub integration
- Display design specs in code review
- Catch drift during review phase

**4. Continuous Monitoring**
- Dashboard showing sync status
- Alerts on detected drift
- Metrics: Last sync time, divergence count, affected components

**5. Developer Handoff Workflows**
- Use Figma Dev Mode for inspect
- Mark layers "Ready for Dev" → trigger webhook
- Track completion status (Completed, In Progress)
- `DEV_MODE_STATUS_UPDATE` webhook event (new in 2025)

---

## 5. MCP Tools for Design Systems

### 5.1 Recommended MCP Tool Suite

Based on research and our existing MCP patterns, here's a proposed tool suite for Figma integration:

#### Tool 1: `figma_get_file_structure`
**Purpose:** Retrieve file hierarchy and component inventory
**Inputs:** `file_key` (string), `node_ids` (optional array)
**Outputs:** JSON tree with nodes, components, instances
**Use Case:** Initial file discovery, component mapping

#### Tool 2: `figma_get_design_tokens`
**Purpose:** Extract variables and styles for token generation
**Inputs:** `file_key` (string), `collection_ids` (optional array), `mode` (optional string)
**Outputs:** Variables with values, styles, collections metadata
**Use Case:** Token extraction for CSS generation

#### Tool 3: `figma_generate_code_from_frame`
**Purpose:** Convert Figma frame to code (React, Vue, etc.)
**Inputs:** `file_key`, `node_id`, `framework` (optional), `component_mapping` (optional)
**Outputs:** Generated code string, dependencies list
**Use Case:** Rapid prototyping, frame-to-component conversion

#### Tool 4: `figma_get_component_props`
**Purpose:** Extract component properties and variants
**Inputs:** `file_key`, `component_id`
**Outputs:** Props schema, variants, default values
**Use Case:** Component API documentation, prop validation

#### Tool 5: `figma_detect_token_drift`
**Purpose:** Compare Figma variables with local token files
**Inputs:** `file_key`, `local_tokens_path` (string), `mode` (optional)
**Outputs:** Drift report (added, removed, modified tokens)
**Use Case:** CI/CD validation, sync verification

#### Tool 6: `figma_export_assets`
**Purpose:** Export images, icons, and graphics
**Inputs:** `file_key`, `node_ids`, `format` (svg/png/jpg), `scale`
**Outputs:** Asset URLs or base64-encoded data
**Use Case:** Icon library generation, asset optimization

#### Tool 7: `figma_update_code_connect`
**Purpose:** Update Code Connect mappings (bidirectional sync)
**Inputs:** `file_key`, `node_id`, `component_path`, `component_name`
**Outputs:** Success confirmation, mapping details
**Use Case:** Maintain Figma-code component mappings

#### Tool 8: `figma_validate_design_system`
**Purpose:** Audit design file for token usage, consistency
**Inputs:** `file_key`, `rules` (array of validation rules)
**Outputs:** Validation report (violations, warnings, stats)
**Use Case:** Design system governance, quality checks

### 5.2 Architecture for Figma MCP Server

**Option A: Extend Existing MCP Server**
```
packages/mcp-server/src/
├── index.ts                    # Main server (existing)
├── tools/
│   ├── commands.ts            # Existing: check_commands, ack_command
│   └── figma.ts               # New: Figma tools
├── clients/
│   ├── backend.ts             # Existing: ActionFlows backend client
│   └── figma.ts               # New: Figma API client
└── config.ts                  # Environment config (add FIGMA_TOKEN)
```

**Option B: Separate Figma MCP Server**
```
packages/mcp-server-figma/
├── src/
│   ├── index.ts               # Figma-specific MCP server
│   ├── tools/                 # Figma MCP tools
│   ├── figma-client.ts        # Figma API wrapper
│   └── cache.ts               # Response caching (rate limit mitigation)
├── package.json
└── tsconfig.json
```

**Recommendation:** Option A (extend existing server)
- **Rationale:**
  - Single MCP server config in Claude Code
  - Unified tool namespace (`check_commands`, `figma_get_tokens`)
  - Shared infrastructure (error handling, logging, config)
  - Easier maintenance
- **Trade-off:** Larger server, but we're only at 2 tools currently (plenty of headroom)

### 5.3 Implementation Patterns from Research

**Pattern 1: Rate Limit Mitigation (Cache-First)**
```typescript
class FigmaClient {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getFile(fileKey: string) {
    const cached = this.cache.get(fileKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data; // Serve from cache
    }

    const data = await this.fetchFromFigma(fileKey);
    this.cache.set(fileKey, { data, timestamp: Date.now() });
    return data;
  }
}
```

**Pattern 2: Graceful Degradation (Like Our Current Server)**
```typescript
async handleFigmaGetTokens(args: { file_key: string }) {
  try {
    const tokens = await this.figmaClient.getVariables(args.file_key);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ tokens }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Failed to fetch tokens',
          message: error instanceof Error ? error.message : 'Unknown error',
          file_key: args.file_key,
          tokens: [] // Graceful degradation
        }, null, 2)
      }]
    };
  }
}
```

**Pattern 3: Webhook Integration (Event-Driven)**
```typescript
// Backend receives Figma webhook
app.post('/api/webhooks/figma', async (req, res) => {
  const { event_type, file_key, timestamp } = req.body;

  if (event_type === 'FILE_UPDATE') {
    // Invalidate cache
    figmaCache.delete(file_key);

    // Emit WebSocket event to dashboard
    wsServer.broadcast({
      type: 'FIGMA_FILE_UPDATED',
      payload: { file_key, timestamp }
    });

    // Trigger drift detection (optional)
    await queueDriftDetection(file_key);
  }

  res.status(200).json({ acknowledged: true });
});
```

---

## 6. Limitations and Gotchas

### 6.1 Figma API Limitations

**Rate Limits:**
- ⚠️ **Unpredictable Limits:** Vary by plan/seat, not clearly documented
- ⚠️ **Images Endpoint:** Particularly restrictive (~10-50 requests)
- ⚠️ **429 Errors Common:** Community reports frequent rate limiting
- ✅ **Mitigation:** Aggressive caching, webhooks over polling, Enterprise plan

**API Coverage:**
- ⚠️ **No Write Access for Variables:** Can read but not modify variables via API
- ⚠️ **Limited Plugin API Capabilities:** Some data only accessible via REST API
- ⚠️ **Webhook Creation:** Must be done via API (no UI)
- ⚠️ **Webhook Delivery:** 3 retries with exponential backoff, then drops

**Data Access:**
- ⚠️ **File Permissions:** API respects Figma file permissions (may return 403)
- ⚠️ **Version History:** Can access versions but not detailed diffs
- ⚠️ **Comments:** Can read but threading/resolution state limited

### 6.2 MCP Server Limitations

**Transport Constraints:**
- ⚠️ **Stdio Transport:** All communication via stdin/stdout (no direct HTTP)
- ⚠️ **Logging Restrictions:** Must use stderr (console.error), not stdout (console.log)
- ⚠️ **Binary Data:** Base64 encoding required (increases payload size)

**Tool Design:**
- ⚠️ **Synchronous Feel:** MCP tools feel like functions but are async RPC calls
- ⚠️ **Error Handling:** Must return structured errors, can't throw (breaks protocol)
- ⚠️ **No Streaming:** Response must be complete (can't stream large files)

**Integration Challenges:**
- ⚠️ **Configuration:** Each AI agent (Claude Code, Cursor) has different MCP config
- ⚠️ **Discovery:** No automatic tool discovery (user must configure)
- ⚠️ **Versioning:** Breaking changes to tools require client updates

### 6.3 Design System Sync Gotchas

**Token Mapping Ambiguity:**
- ⚠️ **Naming Collisions:** Figma variable names may conflict with CSS reserved words
- ⚠️ **Case Sensitivity:** Figma allows "Button" and "button", CSS doesn't distinguish
- ⚠️ **Special Characters:** Figma names like "color/text/primary" → CSS `--color-text-primary`

**Mode/Theme Complexity:**
- ⚠️ **Multi-Mode Variables:** One Figma variable → multiple CSS variables (light/dark)
- ⚠️ **Mode Selection:** Must specify which mode to export (default not always clear)
- ⚠️ **Nested Modes:** Figma supports nested themes (Light → Accent → Blue), flat in CSS

**Aliasing Resolution:**
- ⚠️ **Circular References:** Figma allows, but breaks in CSS
- ⚠️ **Cross-Collection Aliases:** May not export correctly if collections split
- ⚠️ **Resolved vs Unresolved:** API returns both, must choose export strategy

**Component Mapping:**
- ⚠️ **Code Connect Requirement:** Component mapping requires manual setup (not auto-detected)
- ⚠️ **Variant Complexity:** Figma variants don't map 1:1 to React props
- ⚠️ **Instance Overrides:** Hard to detect if instance differs from main component

### 6.4 Bidirectional Sync Risks

**Conflict Resolution:**
- ⚠️ **Simultaneous Edits:** Designer updates Figma while developer updates code
- ⚠️ **Overwrite Risk:** Automated sync may overwrite manual changes
- ⚠️ **Merge Complexity:** No built-in merge strategy (first-write-wins vs last-write-wins)

**Feedback Loops:**
- ⚠️ **Infinite Sync:** Code update → Figma sync → webhook → code update (loop)
- ⚠️ **Timestamp Tracking:** Must track last sync time to avoid re-syncing same change
- ⚠️ **Idempotency:** Sync operations must be idempotent to handle retries

**Governance:**
- ⚠️ **SSOT Confusion:** If bidirectional, which is source of truth? (Spoiler: Neither)
- ⚠️ **Approval Workflows:** Automated sync bypasses human review
- ⚠️ **Rollback Difficulty:** Hard to undo automated syncs across systems

**Recommendation:** Start with unidirectional (Figma → Code), add bidirectional only if proven need.

---

## 7. Recommendations for ActionFlows Dashboard

### 7.1 Integration Architecture

**Phase 1: Read-Only Figma MCP Tools (Low Risk)**
1. Extend `packages/mcp-server` with Figma tools module
2. Implement 4 core tools:
   - `figma_get_file_structure`
   - `figma_get_design_tokens`
   - `figma_generate_code_from_frame`
   - `figma_detect_token_drift`
3. Add Figma API client with caching (5-min TTL)
4. Environment config: `FIGMA_ACCESS_TOKEN`, `FIGMA_CACHE_TTL`
5. Document in MCP server README

**Phase 2: Design System Automation (Medium Risk)**
1. Implement webhook receiver in backend (POST `/api/webhooks/figma`)
2. Cache invalidation on `FILE_UPDATE` events
3. Dashboard UI: "Sync Design Tokens" button (triggers MCP tool)
4. Log sync operations in ActionFlows logs (same pattern as chains)
5. Display sync status in dashboard (last sync time, drift count)

**Phase 3: Advanced Features (High Risk)**
1. Automated drift detection on schedule (cron job)
2. CI/CD integration (GitHub Actions workflow)
3. Token transformation pipeline (Figma JSON → Style Dictionary → CSS)
4. Component mapping (Code Connect setup)
5. Bidirectional sync (if needed)

### 7.2 MCP Tool Specifications

**Tool: figma_get_design_tokens**
```typescript
{
  name: 'figma_get_design_tokens',
  description: 'Extract design tokens (variables and styles) from a Figma file',
  inputSchema: {
    type: 'object',
    properties: {
      file_key: {
        type: 'string',
        description: 'Figma file key (from URL: figma.com/file/:file_key/...)'
      },
      collection_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Filter to specific variable collections'
      },
      mode: {
        type: 'string',
        description: 'Optional: Specific mode to export (e.g., "Light", "Dark")'
      },
      format: {
        type: 'string',
        enum: ['json', 'css', 'scss'],
        description: 'Output format (default: json)'
      }
    },
    required: ['file_key']
  }
}
```

**Tool: figma_detect_token_drift**
```typescript
{
  name: 'figma_detect_token_drift',
  description: 'Compare Figma variables with local design tokens and detect drift',
  inputSchema: {
    type: 'object',
    properties: {
      file_key: {
        type: 'string',
        description: 'Figma file key'
      },
      local_tokens_path: {
        type: 'string',
        description: 'Path to local token file (JSON, CSS, or SCSS)'
      },
      mode: {
        type: 'string',
        description: 'Figma mode to compare against (default: first mode)'
      }
    },
    required: ['file_key', 'local_tokens_path']
  }
}
```

### 7.3 Backend Integration Points

**New API Endpoints:**
```typescript
// packages/backend/src/routes/figma.ts

// Webhook receiver
POST /api/webhooks/figma
  Body: { event_type, file_key, file_name, timestamp, triggered_by }
  Response: { acknowledged: true }

// Sync status endpoint
GET /api/figma/sync-status
  Response: {
    last_sync: ISO8601,
    drift_count: number,
    synced_files: Array<{ file_key, file_name, last_sync }>
  }

// Manual sync trigger
POST /api/figma/sync
  Body: { file_key, mode? }
  Response: { job_id, status: 'queued' }
```

**WebSocket Events:**
```typescript
// packages/shared/src/events.ts

export type FigmaFileUpdatedEvent = {
  type: 'FIGMA_FILE_UPDATED';
  payload: {
    fileKey: string;
    fileName: string;
    timestamp: string;
  };
};

export type FigmaSyncCompleteEvent = {
  type: 'FIGMA_SYNC_COMPLETE';
  payload: {
    fileKey: string;
    mode: string;
    tokensAdded: number;
    tokensModified: number;
    tokensRemoved: number;
    driftDetected: boolean;
  };
};
```

### 7.4 Dashboard UI Enhancements

**New Panel: Design System Sync**
```tsx
// packages/app/src/components/panels/DesignSystemSyncPanel.tsx

<Panel title="Design System Sync" icon={<FigmaIcon />}>
  <SyncStatus
    lastSync={lastSync}
    driftCount={driftCount}
    syncedFiles={syncedFiles}
  />

  <Button onClick={handleSyncNow}>
    Sync Design Tokens
  </Button>

  {driftDetected && (
    <DriftAlert>
      {driftCount} tokens have diverged from Figma
      <Button variant="link" onClick={showDriftDetails}>
        View Details
      </Button>
    </DriftAlert>
  )}

  <FilesList>
    {syncedFiles.map(file => (
      <FileItem
        key={file.fileKey}
        fileName={file.fileName}
        lastSync={file.lastSync}
        onSync={() => handleSyncFile(file.fileKey)}
      />
    ))}
  </FilesList>
</Panel>
```

**Integration with Existing Panels:**
- SessionInfoPanel: Add "Design Sync" status chip
- EventStreamPanel: Show FIGMA_FILE_UPDATED events
- ChainLogPanel: Include Figma sync operations in execution logs

### 7.5 Configuration Example

**Claude Code MCP Config** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "actionflows-dashboard": {
      "command": "node",
      "args": ["D:/ActionFlowsDashboard/packages/mcp-server/dist/index.js"],
      "env": {
        "AFW_BACKEND_URL": "http://localhost:3001",
        "FIGMA_ACCESS_TOKEN": "figd_...",
        "FIGMA_CACHE_TTL": "300000"
      }
    }
  }
}
```

**Environment Variables** (`.env`):
```bash
# Existing
PORT=3001
REDIS_URL=redis://localhost:6379

# New: Figma Integration
FIGMA_ACCESS_TOKEN=figd_...
FIGMA_WEBHOOK_SECRET=whsec_...
FIGMA_CACHE_TTL=300000  # 5 minutes
FIGMA_RATE_LIMIT_MAX=100
FIGMA_RATE_LIMIT_WINDOW=3600000  # 1 hour
```

---

## 8. Example Use Cases

### Use Case 1: Design Token Sync
**Scenario:** Designer updates brand colors in Figma
**Flow:**
1. Designer publishes changes in Figma
2. Figma webhook → Backend `/api/webhooks/figma`
3. Backend emits `FIGMA_FILE_UPDATED` via WebSocket
4. Dashboard shows notification: "Design tokens updated"
5. User clicks "Sync Now" button
6. Orchestrator calls MCP tool: `figma_get_design_tokens`
7. MCP server fetches tokens from Figma API (cached for 5 min)
8. Tokens transformed to CSS variables
9. Updated CSS committed to repo
10. Dashboard shows sync complete with diff

**Benefit:** Zero-lag design-to-code pipeline, automated token updates

### Use Case 2: Component Scaffolding
**Scenario:** Build new component from Figma design
**Flow:**
1. Developer opens Figma file, selects frame (e.g., "LoginButton")
2. In Claude Code chat: "Generate React component from this Figma frame"
3. Claude calls MCP tool: `figma_generate_code_from_frame`
4. MCP server fetches frame data, generates React + Tailwind code
5. Claude inserts code into `packages/app/src/components/LoginButton.tsx`
6. Developer reviews, adjusts, tests
7. Commit: "feat: add LoginButton component from Figma design"

**Benefit:** Rapid prototyping, consistent design implementation

### Use Case 3: Drift Detection in CI
**Scenario:** Prevent design drift before merge
**Flow:**
1. Developer opens PR with UI changes
2. GitHub Actions workflow triggers
3. Workflow calls Figma MCP tool: `figma_detect_token_drift`
4. Tool compares PR's CSS with Figma variables
5. Drift detected: 3 colors hardcoded, should use tokens
6. PR check fails with comment: "Design drift detected, use tokens"
7. Developer fixes, uses `var(--color-primary)` instead of `#0066FF`
8. PR check passes, merge allowed

**Benefit:** Enforce design system compliance, prevent token drift

### Use Case 4: Design System Audit
**Scenario:** Audit Figma file for token usage
**Flow:**
1. Design system lead suspects inconsistent token usage
2. In Claude Code: "Audit Figma file for design system violations"
3. Claude calls MCP tool: `figma_validate_design_system` with rules:
   - All colors must be variables (no hex codes)
   - All spacing must use 8px grid (space tokens)
   - All typography must use text styles
4. MCP server scans Figma file, detects violations
5. Report generated: 12 hardcoded colors, 5 non-grid spacing values
6. Claude presents report with node IDs for manual fix
7. Designer fixes violations, republishes

**Benefit:** Design system governance, consistency enforcement

---

## 9. Next Steps

### Immediate Actions (This Week)
1. **Provision Figma Access Token:** Generate PAT with file read permissions
2. **Prototype Figma API Client:** Test rate limits, caching strategy
3. **Design MCP Tool Schema:** Finalize tool inputs/outputs
4. **Extend MCP Server:** Add Figma tools module (follow existing patterns)

### Short-Term (Next 2 Weeks)
1. **Implement Core Tools:** `figma_get_design_tokens`, `figma_get_file_structure`
2. **Add Backend Webhook Endpoint:** Receive Figma file update events
3. **WebSocket Integration:** Broadcast Figma events to dashboard
4. **Basic Dashboard UI:** Sync status panel, manual sync button

### Medium-Term (Next Month)
1. **Drift Detection:** Implement `figma_detect_token_drift` tool
2. **Token Transformation:** Figma JSON → CSS pipeline (Style Dictionary)
3. **CI/CD Workflow:** GitHub Actions for automated sync
4. **Documentation:** Figma MCP integration guide for team

### Long-Term (Next Quarter)
1. **Advanced Tools:** `figma_generate_code_from_frame`, `figma_validate_design_system`
2. **Component Mapping:** Code Connect setup for component library
3. **Bidirectional Sync:** Code → Figma (if needed)
4. **Enterprise Features:** Multi-file sync, team permissions, audit logs

---

## 10. Conclusion

Figma MCP integration represents a strategic opportunity to bridge the design-code gap in ActionFlows Dashboard. The technology is mature, well-documented, and production-ready. Our existing MCP server architecture provides a solid foundation for integration, requiring only incremental additions rather than architectural changes.

**Key Success Factors:**
1. ✅ Official Figma MCP server exists with proven capabilities
2. ✅ Our MCP patterns align with Figma's implementation
3. ✅ Community tools and best practices are well-established
4. ✅ Rate limit mitigation strategies are known and tested
5. ✅ Webhook-based automation enables real-time sync

**Primary Risks:**
1. ⚠️ Figma API rate limits (mitigated by caching, webhooks)
2. ⚠️ Token mapping complexity (mitigated by Style Dictionary)
3. ⚠️ Bidirectional sync conflicts (avoided by starting unidirectional)

**Recommended Approach:** Incremental rollout starting with read-only tools, progressing to automation, deferring bidirectional sync until proven need.

This research provides a comprehensive foundation for architectural discussions and implementation planning. The brainstorm agent should use this report to design the specific integration strategy, tool prioritization, and rollout timeline for ActionFlows Dashboard.

---

## Sources

1. [Figma Developer Docs - MCP Server Introduction](https://developers.figma.com/docs/figma-mcp-server/)
2. [Figma Help Center - Guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
3. [Figma Resource Library - What is Model Context Protocol (MCP)?](https://www.figma.com/resource-library/what-is-mcp/)
4. [Figma Blog - Introducing our MCP server](https://www.figma.com/blog/introducing-figma-mcp-server/)
5. [GitHub - GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP)
6. [GitHub - figma/mcp-server-guide](https://github.com/figma/mcp-server-guide)
7. [Figma Help Center - Guide to variables in Figma](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
8. [Design Systems Collective - Design System Mastery with Figma Variables](https://www.designsystemscollective.com/design-system-mastery-with-figma-variables-the-2025-2026-best-practice-playbook-da0500ca0e66)
9. [Figma Tokens - Figma Token Exporter](https://figma-tokens.com/)
10. [Design Systems Collective - Exporting Figma Variables to Code](https://www.designsystemscollective.com/exporting-figma-variables-to-code-a-step-by-step-workflow-3f793def100b)
11. [Tony Ward - Syncing Figma Variables to CSS Variables](https://www.tonyward.dev/articles/figma-variables-to-css-variables)
12. [GitHub - kataras/figma-extractor](https://github.com/kataras/figma-extractor)
13. [Flusk - AI agent for design-code sync](https://flusk.dev/)
14. [GitFig - Design Like a Developer](https://gitfig.com/)
15. [Styleframe - Figma Plugin](https://www.styleframe.dev/figma)
16. [Figma Developer Docs - Rate Limits](https://developers.figma.com/docs/rest-api/rate-limits/)
17. [Figma Developer Docs - Webhooks V2](https://developers.figma.com/docs/rest-api/webhooks/)
18. [Model Context Protocol - Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server)
19. [GitHub - modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
20. [Nearform - Implementing MCP: Tips, tricks and pitfalls](https://nearform.com/digital-community/implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls/)
