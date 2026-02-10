# Code Changes: restructure-living-system

## Files Modified
| File | Change |
|------|--------|
| `.claude/actionflows/docs/LIVING_SYSTEM.md` | Added three foundational sections before "The 7 Layers": "The Framework", "The Orchestrator", and "Human Interaction" to provide context for readers encountering the document cold |

## Files Created
| File | Purpose |
|------|---------|
| None | Only modified existing documentation |

## Verification
- Type check: PASS (no markdown-related errors; existing frontend TypeScript errors are unrelated)
- Notes: Successfully restructured document with three new introductory sections (52 lines for Framework, 41 lines for Orchestrator, 26 lines for Human Interaction). Existing "The 7 Layers" section and all content after it remains unchanged. New sections match existing document voice (confident, clear, concrete) and provide on-ramp for readers unfamiliar with ActionFlows.

## Structure Changes

**Before:**
1. Opening ("What Makes It Living?")
2. The 7 Layers (immediate deep dive into architecture)
3. The Healing Cycle
4. The Growth Cycle
5. Layer Interactions
6. Key Principles
7. The Two Universes
8. See Also / Quick Start / The Soul

**After:**
1. Opening ("What Makes It Living?" — unchanged)
2. **NEW: The Framework** — Brief intro to ActionFlows as AI agent orchestration framework
3. **NEW: The Orchestrator** — How the router works (Request Reception Protocol, Sin Test, Chain Compilation, Delegation, Quick Triage)
4. **NEW: Human Interaction** — How humans work with the system (Chain Presentation, Human Gates, "It's a Sin" reset, Learnings Surface, One Question at a Time, Trust Through Transparency)
5. The 7 Layers (existing content — unchanged)
6. Everything else (existing content — unchanged)

## Key Content Added

- **The Framework** (1 paragraph) — What ActionFlows is and what makes it different from a task runner
- **The Orchestrator** (5 subsections) — Router not helper, Request Reception Protocol, Sin Test, Chain Compilation example, Delegation mechanism, Quick Triage exception
- **Human Interaction** (6 subsections) — Chain approval workflow, Human Gates, "It's a sin" reset command, Learnings Surface, One Question at a Time, Trust Through Transparency

All sections written concisely (30-50 lines each) to serve as on-ramp, not duplicate ORCHESTRATOR.md.
