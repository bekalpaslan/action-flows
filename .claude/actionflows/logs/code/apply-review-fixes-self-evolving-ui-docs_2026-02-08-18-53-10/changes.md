# Code Changes: Apply Review Fixes to Self-Evolving UI Docs

## Files Modified
| File | Change |
|------|--------|
| docs/FRD-SelfEvolvingUI.md | Fix #12: Added cross-reference note to Section 3 (Feature Philosophy) pointing to parent FRD.md Section 3 (Framework Philosophy) |
| docs/FRD-SelfEvolvingUI.md | Fix #8: Clarified QuickActionBar is session-scoped; persistent toolbar is a NEW component (PersistentToolbar.tsx); updated Key Features, Relationship to Existing Components, and feature catalog entries |
| docs/FRD-SelfEvolvingUI.md | Fix #10: Updated Phase 1 estimate from "2-3 weeks" to "3-4 weeks (includes ConversationPanel upgrade prerequisite)" |
| docs/SRD-SelfEvolvingUI.md | Fix #5: Added Section 2.0 "Common Types" with LayerSource + BehaviorPackId in selfEvolvingTypes.ts to avoid circular dependency between buttonTypes.ts and registryTypes.ts |
| docs/SRD-SelfEvolvingUI.md | Fix #17: Changed ButtonAction.commandType from `string` to `CommandTypeString` (from commands.ts) |
| docs/SRD-SelfEvolvingUI.md | Fix #6: Rewrote RegistryEntry.data as discriminated union: `{ type: 'button'; definition: ButtonDefinition } | { type: 'pattern'; definition: PatternDefinition } | { type: 'modifier'; definition: ModifierDefinition }` |
| docs/SRD-SelfEvolvingUI.md | Fix #7: Added import note for ProjectId (from projects.ts) and UserId/Timestamp (from types.ts) in FrequencyRecord |
| docs/SRD-SelfEvolvingUI.md | Fix #13: Added .js extension convention note in shared imports section of file tree |
| docs/SRD-SelfEvolvingUI.md | Fix #8 (SRD): Clarified QuickActionBar is session-scoped throughout; added PersistentToolbar.tsx as new project-scoped component in file tree, integration table, rendering section, Phase 1 steps, and conclusion |
| docs/SRD-SelfEvolvingUI.md | Fix #9: Added Step 0 prerequisite (ConversationPanel full message history upgrade) to Phase 1; adjusted phase timings (Phase 1: Weeks 1-4, Phase 2: Weeks 5-7, Phase 3: Weeks 8-10, Phase 4: Weeks 11-13) |
| docs/SRD-SelfEvolvingUI.md | Fix #10 (Storage): Added architecture recommendation for SelfEvolvingStorage composition pattern instead of extending main Storage interface with ~12 methods |
| docs/SRD-SelfEvolvingUI.md | Fix #11: Fixed critical path math -- changed from "~24 working days (4.8 weeks)" to "~25 working days (5 weeks)" and "~12 weeks" to "~13 weeks" consistently |
| docs/SRD-SelfEvolvingUI.md | Fix #14: Added `extends BaseEvent` to all 8 new WebSocket event type interfaces with explanatory note about inheriting eventId and user fields |
| docs/SRD-SelfEvolvingUI.md | Fix #15: Corrected sessionWindows.ts reference in integration table to routes/toolbar.ts with project-scoped note |
| docs/SRD-SelfEvolvingUI.md | Fix #16: Added note that extending Project interface with registry override fields requires additional Storage/API changes not in the step plan |
| docs/SRD-SelfEvolvingUI.md | Fix #18: Added "Shell command execution from Express server" entry to Section 8.3 Security Risks with mitigation (isolated worker, sanitized input, command allowlist) |
| docs/SRD-SelfEvolvingUI.md | Fix #19: Added Section 4.0 "Action Type Definitions" with explicit PatternAction and ModifierAction interfaces (ButtonAction already in Section 2.1) |
| docs/SRD-SelfEvolvingUI.md | Updated Appendix B type definitions to reflect new module (selfEvolvingTypes.ts) and additional types (PatternAction, ModifierAction) |
| docs/SRD-SelfEvolvingUI.md | Added Appendix C: Deferred Requirements listing 6 LOW-priority FRD requirements not in implementation plan (BTN-07, TBR-07, TBR-08, STR-07, FRQ-05, PAT-06) |

## Files Created
| File | Purpose |
|------|---------|
| (none) | No new files created |

## Verification
- Type check: SKIPPED (markdown files only)
- Notes: All 19 fixes from the review report and second opinion have been applied

## Fix Summary

### No-Change Fixes (already correct or second opinion disagreed):
- **Fix #1 (Finding #3):** Status markers -- second opinion disagreed with emoji requirement; kept plain "TODO" text as-is
- **Fix #4 (Finding #1):** Duplicate Executive Summary -- second opinion said keep BOTH sections; no change made

### Applied Fixes (17 total):
1. Fix #5 - LayerSource circular dependency (SRD: new Common Types section)
2. Fix #6 - RegistryEntry.data discriminated union (SRD)
3. Fix #7 - ProjectId import path note (SRD)
4. Fix #8 - QuickActionBar scope clarification (BOTH docs: PersistentToolbar.tsx)
5. Fix #9 - ConversationPanel prerequisite Step 0 (SRD)
6. Fix #10 - Storage composition pattern recommendation (SRD)
7. Fix #10b - Phase 1 estimate 3-4 weeks (FRD)
8. Fix #11 - Critical path math: 5 weeks consistently (SRD)
9. Fix #12 - Feature Philosophy cross-reference (FRD)
10. Fix #13 - ES module .js extension note (SRD)
11. Fix #14 - WebSocket events extend BaseEvent (SRD)
12. Fix #15 - sessionWindows.ts reference corrected (SRD)
13. Fix #16 - Project model extension Storage/API note (SRD)
14. Fix #17 - ButtonAction.commandType typed as CommandTypeString (SRD)
15. Fix #18 - Shell command security risk added (SRD)
16. Fix #19 - PatternAction + ModifierAction explicit interfaces (SRD)
17. Appendix C: Deferred Requirements traceability (SRD)
