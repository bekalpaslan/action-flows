# Immune System — Biological Defense Architecture

This document maps the ActionFlows immune system to biological immune system principles, showing how the framework protects itself from drift, contamination, and degradation.

---

## Overview

The ActionFlows immune system operates on three biological layers:
1. **Innate Immunity (Prevention)** — Pattern recognition and immediate response
2. **Adaptive Immunity (Detection)** — Learning from past infections and building defenses
3. **Homeostasis (Healing)** — Continuous health monitoring and self-repair

---

## Layer 1: Prevention (Innate Immunity)

**Components:** Gates 1-6, Agent Standards

### What It Catches
- Spawn prompt contamination (ad-hoc instructions bypassing agent.md)
- Contract drift before chain execution
- Invalid context routing
- Malformed chain compilation

### Mechanisms
- **Agent Standards:** Every agent reads agent.md first, ignores ad-hoc instructions
- **Gate 1-3:** Request intake, context routing, flow selection validation
- **Gate 4-6:** Chain compilation format, step boundary, execution start validation

---

## Layer 2: Detection (Adaptive Immunity)

**Components:** Gates 7-11, Harmony Detector, Health Calculator

### What It Catches
- Format deviations during execution
- Agent output violations
- Auto-trigger misfires
- Registry update failures

### Mechanisms
- **Gate 7-10:** Step execution, agent output, auto-trigger, second-opinion validation
- **Harmony Detector:** Real-time contract compliance checking
- **Health Calculator:** Aggregates violation counts into health score (0-100)

---

## Layer 3: Healing (Immunological Memory)

**Components:** Gates 12-14, Health Protocol, Learning Capture

### What It Catches
- Post-execution drift
- Accumulated learnings requiring dissolution
- Flow candidates from ad-hoc patterns

### Mechanisms
- **Gate 12-14:** Registry update, learning surface, completion validation
- **Health Protocol:** 7-phase immune response for critical violations
- **Learning Dissolution:** Converts learnings into permanent fixes (docs, agents, templates)

---

## Health Metrics

| Metric | Healthy | Degraded | Critical |
|--------|---------|----------|----------|
| Health Score | 90-100 | 70-89 | <70 |
| Violations (24h) | 0-2 | 3-5 | 6+ |
| Learning Backlog | 0-5 | 6-10 | 11+ |

---

## Anti-Patterns

### Autoimmune (False Positives)
Validator flags valid variance as drift. Fix: Distinguish contract-defined (sacred) vs. free-form (evolvable).

### Immunosuppression (Bypassed Defenses)
Orchestrator acts directly without spawning agents. Fix: Strict Sin Test.

### Chronic Infection (Unresolved Learnings)
LEARNINGS.md grows unbounded. Fix: Regular learning-dissolution runs.

---

## See Also
- `CONTRACT.md` — Contract-defined formats
- `LEARNINGS.md` — Active learnings
- `MEMORY.md` — Session-discovered patterns
