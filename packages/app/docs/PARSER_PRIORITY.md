# Parser Implementation Priority

**Last Updated:** 2026-02-09
**Audience:** Frontend developers implementing dashboard parsers

Formats are prioritized by implementation urgency and user value.

---

## Priority Levels

| Priority | Purpose | Implementation Urgency |
|----------|---------|----------------------|
| **P0** | Critical for core dashboard functionality (chain visualization, progress tracking) | MUST implement first |
| **P1** | High-value features (quality metrics, error recovery) | Implement early |
| **P2** | Second-opinion integration, live registry updates | Implement mid-term |
| **P3** | Historical data, status updates | Nice-to-have |
| **P4** | Session metadata, edge cases | Low priority |
| **P5** | Low-frequency or internal formats | Optional |

---

## Implementation Status

### P0 — Critical (Core Functionality)

- [x] **Format 1.1:** Chain Compilation Table
  - **Parser:** `parseChainCompilation`
  - **Components:** ChainVisualization, ChainTable, ProgressTracker
  - **Status:** IMPLEMENTED

- [x] **Format 2.1:** Step Completion Announcement
  - **Parser:** `parseStepCompletion`
  - **Components:** StepProgressBar, ExecutionLog
  - **Status:** IMPLEMENTED

---

### P1 — High-Value Features

- [x] **Format 5.1:** Review Report Structure
  - **Parser:** `parseReviewReport`
  - **Components:** ReviewReportViewer, FindingsTable, VerdictBanner
  - **Status:** IMPLEMENTED

- [ ] **Format 6.1:** Error Announcement
  - **Parser:** `parseErrorAnnouncement`
  - **Components:** ErrorModal, RecoveryOptionsPanel
  - **Status:** TODO (high priority for error recovery UX)

---

### P2 — Mid-Term Features

- [ ] **Format 2.2:** Dual Output (Action + Second Opinion)
  - **Parser:** `parseDualOutput`
  - **Components:** DualOutputViewer, ComparisonPanel
  - **Status:** TODO (second-opinion integration)

- [ ] **Format 3.2:** Learning Surface Presentation
  - **Parser:** `parseLearningSurface`
  - **Components:** LearningsCard, ApprovalDialog
  - **Status:** TODO (agent feedback loop)

- [ ] **Format 4.1:** Registry Update
  - **Parser:** `parseRegistryUpdate`
  - **Components:** RegistryLiveView, FileChangeIndicator
  - **Status:** TODO (live registry updates)

---

### P3 — Historical Data

- [ ] **Format 1.2:** Chain Execution Start
  - **Parser:** `parseChainExecutionStart`
  - **Components:** ExecutionTimeline, StartTimestamp
  - **Status:** TODO (historical tracking)

- [ ] **Format 1.4:** Execution Complete Summary
  - **Parser:** `parseExecutionComplete`
  - **Components:** SummaryCard, LogsLinkButton
  - **Status:** TODO (completion tracking)

- [ ] **Format 4.2:** INDEX.md Entry
  - **Parser:** `parseIndexEntry`
  - **Components:** ExecutionHistory, PastChainsTable
  - **Status:** TODO (read-only historical view)

- [x] **Format 5.2:** Analysis Report Structure
  - **Parser:** `parseAnalysisReport`
  - **Components:** AnalysisReportViewer, MetricsDisplay
  - **Status:** IMPLEMENTED

---

### P4 — Session Metadata

- [ ] **Format 1.3:** Chain Status Update
  - **Parser:** `parseChainStatusUpdate`
  - **Components:** MidChainProgressUpdate
  - **Status:** TODO (progress tracking)

- [ ] **Format 2.3:** Second Opinion Skip
  - **Parser:** `parseSecondOpinionSkip`
  - **Components:** SkipNotification
  - **Status:** TODO (second-opinion flow)

- [ ] **Format 4.3:** LEARNINGS.md Entry
  - **Parser:** `parseLearningEntry`
  - **Components:** PastLearningsViewer
  - **Status:** TODO (read-only historical view)

---

### P5 — Low-Frequency / Optional

- [ ] **Format 3.1:** Human Gate Presentation
  - **Parser:** NOT contract-defined (free-form)
  - **Components:** HumanGateDisplay (read-only markdown)
  - **Status:** NO PARSER NEEDED (display as-is)

- [ ] **Format 3.3:** Session-Start Protocol Acknowledgment
  - **Parser:** `parseSessionStartProtocol`
  - **Components:** SessionMetadataPanel
  - **Status:** FUTURE (not yet produced by orchestrator)

- [x] **Format 5.3:** Brainstorm Session Transcript
  - **Parser:** `parseBrainstormTranscript`
  - **Components:** BrainstormViewer (read-only)
  - **Status:** IMPLEMENTED

- [ ] **Format 6.2:** Context Routing Announcement
  - **Parser:** `parseContextRouting`
  - **Components:** RoutingIndicator
  - **Status:** IMPLEMENTED

---

## Next Priorities

**Immediate (Sprint 1):**
1. Format 6.1: Error Announcement — Critical for error recovery UX

**Short-Term (Sprint 2-3):**
2. Format 2.2: Dual Output — Second-opinion integration
3. Format 3.2: Learning Surface Presentation — Agent feedback loop
4. Format 4.1: Registry Update — Live registry updates

**Mid-Term (Sprint 4-6):**
5. Historical tracking formats (1.2, 1.4, 4.2, 4.3)
6. Status update formats (1.3, 2.3)

---

## Implementation Checklist

For each parser:

- [ ] TypeScript types exist in `@actionflows/shared/contract`
- [ ] Parser function implemented
- [ ] Type guard exists
- [ ] Unit tests written
- [ ] Dashboard component consumes parser output
- [ ] Graceful degradation tested (parsing failure)
- [ ] Harmony detection validates format
- [ ] Example added to Storybook (if applicable)

---

**Related:**
- Contract specification: `.claude/actionflows/CONTRACT.md`
- Code API reference: `packages/shared/src/contract/README.md`
