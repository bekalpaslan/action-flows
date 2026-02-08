# Orchestrator Contract Design — Executive Summary

**Plan Location:** D:/ActionFlowsDashboard/.claude/actionflows/logs/plan/orchestrator-contract-design_2026-02-08-21-35-00/plan.md

---

## What Was Designed

A formal specification system for all 17 orchestrator output formats, providing:

1. **TypeScript interfaces** for type-safe consumption
2. **Zod schemas** for runtime validation
3. **Regex patterns** for quick detection
4. **Parser implementations** for extraction
5. **Version system** for evolution support
6. **Harmony detection** for drift monitoring

---

## Key Architecture Decisions

### 1. Three-Level Parsing

| Level | Purpose | Tool |
|-------|---------|------|
| L1: Detection | "Is this format present?" | Regex patterns |
| L2: Extraction | "What are the fields?" | Zod schemas |
| L3: Consumption | "How do I render this?" | TypeScript interfaces |

### 2. Graceful Degradation

All parsed fields are **nullable**. If parsing fails:
- Dashboard shows fallback UI with raw text
- No crashes, no broken visualizations
- Harmony detection flags the issue

### 3. Progressive Enhancement

Contract supports incremental adoption:
- Phase 1: Infrastructure (types, version system)
- Phase 2: Priority parsers (chain, step formats)
- Phase 3: Backend integration (real-time parsing)
- Phase 4: Frontend integration (dashboard rendering)
- Phases 5-7: Expand coverage, validation, onboarding

### 4. Single Source of Truth

**Location:** `packages/shared/src/contract/`

**Structure:**
```
contract/
├── types/        # TypeScript interfaces (by category)
├── schemas/      # Zod validation schemas
├── patterns/     # Regex detection patterns
├── parsers/      # Parser implementations
├── guards.ts     # Type guards
└── README.md     # Usage docs
```

Backend and frontend import from this package — no duplicate definitions.

---

## Integration Points

### Backend: Real-Time Parsing

**Service:** `packages/backend/src/services/orchestratorParser.ts`

**Flow:**
1. Orchestrator produces output → WebSocket receives text
2. OrchestratorParser tries each parser in priority order
3. Matched format → emit typed event (chain:compiled, step:completed, etc.)
4. No match → emit orchestrator:unknown event
5. WebSocket broadcasts event to all clients

**Result:** Dashboard receives **structured data** instead of raw markdown.

### Frontend: Type-Safe Rendering

**Pattern:**
```typescript
// Component receives parsed data
function ChainTable({ chain }: { chain: ChainCompilationParsed }) {
  if (!chain.title || !chain.steps) {
    return <FallbackUI raw={chain.raw} />;
  }
  return <StructuredTable steps={chain.steps} />;
}
```

**Result:** Compile-time type safety, graceful degradation.

### Harmony Detection: Drift Monitoring

**Service:** `packages/backend/src/services/harmonyDetector.ts`

**Checks:**
1. Real-time: Detect unknown formats (parser returns null)
2. On-demand: Validate ORCHESTRATOR.md examples against parsers
3. Dashboard: Show harmony percentage (valid formats / total formats)

**Result:** Auto-flag when orchestrator output drifts from contract.

---

## 17 Contract Formats

### Priority 0 (Week 2 — Most Critical)
- **1.1 Chain Compilation Table** — Core visualization
- **2.1 Step Completion Announcement** — Real-time progress

### Priority 1 (Week 5)
- **5.1 Review Report** — Quality metrics
- **6.1 Error Announcement** — Recovery UI

### Priority 2 (Week 6)
- **2.2 Dual Output** — Second opinion display
- **4.1 Registry Update** — Live registry updates
- **3.2 Learning Surface** — Agent feedback loop

### Priority 3 (Week 7)
- **4.2 INDEX.md Entry** — Formalize existing parser
- **1.2 Chain Execution Start** — Status updates
- **5.2 Analysis Report** — Metrics display

### Priority 4 (Week 8)
- **3.3 Session Start Protocol** — Session metadata
- **1.4 Execution Complete** — Chain completion
- **2.3 Second Opinion Skip** — Edge case handling
- **4.3 LEARNINGS.md Entry** — Historical learnings
- **1.3 Chain Status Update** — Progress tracking

### Priority 5 (Deferred)
- **5.3 Brainstorm Transcript** — Read-only viewing
- **3.1 Human Gate** — No standardized format (free-form)
- **6.2 Department Routing** — Internal, not user-facing

---

## Version System

**Version Marker:**
```markdown
<!-- ActionFlows-Contract-Version: 1.0 -->
## Chain: Feature Implementation
...
```

**Constant:**
```typescript
export const CONTRACT_VERSION = '1.0';
```

**Evolution:**
- Increment version for breaking changes (1.0 → 2.0)
- Support old versions for 90 days minimum
- Parsers route by version (parseChainCompilationV1, V2, etc.)
- Harmony detection warns on version mismatches

---

## Contract Document (Human-Readable)

**Location:** `.claude/actionflows/CONTRACT.md`

**Contents:**
- What Is This? (philosophy)
- Format Catalog (all 17 formats with examples)
- Priority for Implementation (P0-P5)
- Contract Validation (automated checks)
- Breaking Changes (migration process)
- Contributing (adding new formats)

**Purpose:**
- Teaching material for onboarding questionnaire
- Reference for agents ("don't change these formats!")
- Specification for human operators

---

## Migration Timeline

| Phase | Duration | Goal | Deliverables |
|-------|----------|------|--------------|
| **1: Foundation** | Week 1 | Establish infrastructure | Contract structure, CONTRACT.md, version system |
| **2: Priority Formats** | Week 2 | Implement P0 parsers | Chain + step parsers with tests |
| **3: Backend** | Week 3 | Real-time parsing | OrchestratorParser service, WebSocket integration |
| **4: Frontend** | Week 4 | Dashboard rendering | ChainTable, StepTimeline, HarmonyStatus widgets |
| **5: Expand** | Weeks 5-8 | Implement P1-P4 parsers | All 17 formats covered |
| **6: Validation** | Week 9 | Comprehensive testing | Harmony:check command, integration tests |
| **7: Onboarding** | Week 10 | Questionnaire integration | Contract teaching, bootstrap wrapper |

**Total:** 10 weeks to full contract implementation.

---

## Success Criteria

### Week 2 (P0 Complete)
- [ ] Chain compilation format parses correctly
- [ ] Step completion format parses correctly
- [ ] Unit tests pass for both parsers
- [ ] TypeScript types exported from shared package

### Week 4 (Backend + Frontend)
- [ ] Real-time parsing in backend (OrchestratorParser service)
- [ ] WebSocket emits typed events (chain:compiled, step:completed)
- [ ] Dashboard renders ChainTable and StepTimeline
- [ ] Harmony status endpoint returns JSON

### Week 9 (All Formats)
- [ ] All 17 formats have parsers
- [ ] Harmony:check command validates ORCHESTRATOR.md
- [ ] Integration tests pass (orchestrator → parser → event → UI)
- [ ] Performance: 1000 messages/sec parsing speed

### Week 10 (Launch)
- [ ] Onboarding questionnaire teaches contract
- [ ] CONTRACT.md linked from ORCHESTRATOR.md
- [ ] Harmony detection runs automatically
- [ ] Dashboard shows harmony percentage meter

---

## Impact on Framework Harmony System

This contract is **Step 1 of 4** in the Framework Harmony System:

1. **Orchestrator Contract** (this plan) — Defines formats
2. **Onboarding Questionnaire** — Teaches formats to humans
3. **Harmony Detection** — Auto-flags drift from contract
4. **Philosophy Documentation** — Embeds harmony concept in docs

**How It Fits:**
- Contract = source of truth (manual definition)
- Questionnaire = human teaching layer (references contract)
- Harmony detection = auto-validation (uses contract parsers)
- Philosophy docs = explains the "why" (living software model)

---

## What code/ Agent Needs to Know

When implementing this plan:

### Phase 1 Tasks (Foundation)
1. Create directory structure: `packages/shared/src/contract/`
2. Create subdirectories: `types/`, `schemas/`, `patterns/`, `parsers/`
3. Create `version.ts` with CONTRACT_VERSION constant
4. Create empty files for all 17 formats (scaffolding)
5. Create `.claude/actionflows/CONTRACT.md` with full format specs
6. Update ORCHESTRATOR.md to reference contract

**Files to Create:**
- D:/ActionFlowsDashboard/packages/shared/src/contract/version.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/types/chainFormats.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/types/stepFormats.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/types/humanFormats.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/types/registryFormats.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/types/actionFormats.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/types/statusFormats.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/types/index.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/schemas/chainSchemas.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/schemas/stepSchemas.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/schemas/humanSchemas.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/schemas/registrySchemas.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/schemas/actionSchemas.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/schemas/statusSchemas.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/schemas/index.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/patterns/chainPatterns.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/patterns/stepPatterns.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/patterns/humanPatterns.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/patterns/registryPatterns.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/patterns/actionPatterns.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/patterns/statusPatterns.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/patterns/index.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/chainParser.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/stepParser.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/humanParser.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/registryParser.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/actionParser.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/statusParser.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/parsers/index.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/guards.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/index.ts
- D:/ActionFlowsDashboard/packages/shared/src/contract/README.md
- D:/ActionFlowsDashboard/.claude/actionflows/CONTRACT.md

**Exact Interface Definitions:**
See plan.md lines 430-640 for complete TypeScript interfaces for all 17 formats.

**Example Parser Pattern:**
See plan.md lines 823-910 for complete `parseChainCompilation()` implementation.

---

## References

- **Format Audit:** D:/ActionFlowsDashboard/.claude/actionflows/logs/analyze/orchestrator-format-audit_2026-02-08-21-30-00/report.md
- **Ideation Summary:** D:/ActionFlowsDashboard/.claude/actionflows/logs/ideation/framework-harmony-system_2026-02-08-21-10-43/summary.md
- **Detailed Plan:** D:/ActionFlowsDashboard/.claude/actionflows/logs/plan/orchestrator-contract-design_2026-02-08-21-35-00/plan.md
- **Existing Types:** D:/ActionFlowsDashboard/packages/shared/src/types.ts
- **Existing Events:** D:/ActionFlowsDashboard/packages/shared/src/events.ts
- **ORCHESTRATOR.md:** D:/ActionFlowsDashboard/.claude/actionflows/ORCHESTRATOR.md

---

**End of Summary**
