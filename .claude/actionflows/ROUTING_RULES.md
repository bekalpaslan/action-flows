# Routing Rules Registry

> Rule-based decision engine for intelligent action selection during Gate 4 (Chain Compilation). Rules are evaluated during orchestrator chain compilation to select the best action for a given context, scope, and keywords.

---

## Schema Definition

**Format:** YAML with strict validation via `packages/shared/src/routing/routingValidator.ts`

```yaml
rule_id: {unique identifier, format: RR001, RR002, etc.}
priority: {1-100, higher = checked first; breaks ties by score}
confidence: {high|medium|low, gates routing if score < threshold}
condition:
  context: [{contexts where rule applies, e.g., work, maintenance, review}]
  keywords: [{trigger keywords that suggest this action}]
  scope_patterns: [{optional file patterns like "packages/backend/**"}]
  input_types: [{optional input field requirements}]
action: {action to route to, format: action-name/}
fallback: {optional fallback action if primary unavailable}
rationale: {why this routing rule exists - human readable explanation}
```

### Precedence Rules

1. **Exact match** (context + keywords + scope) → Priority 90-100
2. **Partial match** (context + keywords OR context + scope) → Priority 50-89
3. **Fallback** (context only) → Priority 1-49

### Match Score Calculation

```
score = (keyword_match * 0.5) + (scope_match * 0.3) + (input_match * 0.2)
score = score * (priority / 100)

Final ranking: Sort by (score DESC, routing_priority DESC)
```

---

## Routing Rules

### RR001: Security-focused backend/shared review

```yaml
rule_id: RR001
priority: 95
confidence: high
condition:
  context: [review]
  keywords: [security, vulnerabilities, CVE, exploit, auth, permission, injection, xss, sql]
  scope_patterns: [packages/backend/**, packages/shared/**]
action: audit/
fallback: review/
rationale: |
  Security keywords + backend/shared scope = comprehensive audit needed.
  Generic review/ is insufficient for security issues. audit/ examines more
  thoroughly and produces actionable remediation suggestions.
```

### RR002: Performance analysis for multi-file scope

```yaml
rule_id: RR002
priority: 90
confidence: high
condition:
  context: [review, explore]
  keywords: [performance, optimization, slow, bottleneck, efficiency, metrics]
  scope_patterns: [packages/**/**, "**/*.test.ts"]
action: analyze/
fallback: review/
rationale: |
  Performance evaluation requires systematic analysis across files. analyze/
  has capability tags for metrics, pattern-detection, and performance gaps.
  Better choice than generic review/ for finding root causes.
```

### RR003: Architecture changes need comprehensive analysis

```yaml
rule_id: RR003
priority: 88
confidence: high
condition:
  context: [explore, review, maintenance]
  keywords: [architecture, refactor, design, structure, pattern, layer, boundary]
  scope_patterns: [packages/**/src/**, docs/**]
action: analyze/
fallback: review/
rationale: |
  Architecture work requires understanding current state before decisions.
  analyze/ excels at gap-analysis, drift-detection, and inventory. Use it
  to establish baseline before planning architectural refactors.
```

### RR004: Bug fixes in backend + tests

```yaml
rule_id: RR004
priority: 85
confidence: high
condition:
  context: [maintenance, work]
  keywords: [bug, fix, error, issue, crash, fail, broken, exception]
  scope_patterns: [packages/backend/**, "**/*.test.ts"]
action: code/backend/
fallback: code/
rationale: |
  Bug fixes in backend with tests = stack-specific implementation preferred.
  code/backend/ has Express+Zod patterns built-in. Faster and more correct
  than generic code/. Fallback to code/ if backend-specific context unavailable.
```

### RR005: Frontend implementation preferred over generic code/

```yaml
rule_id: RR005
priority: 85
confidence: high
condition:
  context: [work, maintenance]
  keywords: [implement, build, feature, component, create, add, develop]
  scope_patterns: [packages/app/src/**, "**/*.tsx"]
action: code/frontend/
fallback: code/
rationale: |
  Frontend scope with implementation keywords = use stack-specific code/frontend/.
  React+Vite patterns are baked in. Prefers React hooks, component patterns.
  Fallback to generic code/ if context unclear.
```

### RR006: Test suite creation/enhancement

```yaml
rule_id: RR006
priority: 80
confidence: high
condition:
  context: [work, maintenance]
  keywords: [test, testing, coverage, unit, integration, e2e, playwright, vitest]
  scope_patterns: ["**/*.test.ts", "**/*.spec.ts", "test/**"]
action: test/
fallback: code/
rationale: |
  Test keywords with test file patterns = dedicated test/ action.
  test/ knows testing patterns, frameworks, coverage goals. Better than
  asking code/ to write tests without test-specific guidance.
```

### RR007: Brainstorm for ideation context

```yaml
rule_id: RR007
priority: 82
confidence: high
condition:
  context: [work, explore]
  keywords: [brainstorm, ideate, explore, discover, concept, possibility, option]
action: brainstorm/
fallback: plan/
rationale: |
  Ideation keywords = route to brainstorm/ for interactive exploration.
  brainstorm/ facilitates structured ideation with user feedback loops.
  Fallback to plan/ if more directive planning is needed.
```

### RR008: Plan before code in work context

```yaml
rule_id: RR008
priority: 75
confidence: medium
condition:
  context: [work]
  keywords: [plan, design, architecture, approach, strategy, steps, workflow]
action: plan/
fallback: code/
rationale: |
  Planning phase before implementation. plan/ analyzes requirements,
  designs approach, breaks down steps. Fallback to code/ if human
  has already decided on approach.
```

### RR009: Audit entire package for violations

```yaml
rule_id: RR009
priority: 78
confidence: high
condition:
  context: [review, maintenance]
  keywords: [audit, comprehensive, scan, check, validate, entire, health, status]
  scope_patterns: [packages/**, "**/*.ts", "**/*.tsx"]
action: audit/
fallback: review/
rationale: |
  Audit keywords with broad scope = comprehensive audit/ needed.
  audit/ can remediate issues, not just report. Handles CRITICAL/HIGH findings.
  review/ is insufficient for comprehensive health checks.
```

### RR010: Default maintenance context routing

```yaml
rule_id: RR010
priority: 40
confidence: low
condition:
  context: [maintenance]
  keywords: []
action: analyze/
fallback: review/
rationale: |
  Fallback rule for maintenance context without specific keywords.
  analyze/ to understand current state before deciding on code changes.
  Low priority/confidence; only used if no other rules match.
```

---

## Validation Rules

All rules are validated by `pnpm run routing:validate`:

1. **rule_id format** — Must match `RR\d{3}` (RR001, RR002, etc.)
2. **priority** — Must be integer 1-100
3. **confidence** — Must be `high|medium|low`
4. **action format** — Must end with `/` (e.g., `code/backend/`)
5. **fallback format** — If present, must end with `/`
6. **context list** — Each must be valid: `work|maintenance|explore|review|settings|pm|intel`
7. **No circular routing** — Rule A → B and B → A is invalid
8. **Rationale** — Must be non-empty string

---

## Routing Algorithm (Orchestrator Gate 4)

```python
def select_action(context, keywords, scope):
    # 1. Load all routing rules from ROUTING_RULES.md
    rules = load_routing_rules()

    # 2. Filter rules applicable to this context
    applicable_rules = [r for r in rules if context in r.condition.context]

    # 3. Score and rank rules
    scored_rules = []
    for rule in applicable_rules:
        keyword_match = len([k for k in rule.condition.keywords if k in keywords])
        keyword_score = (keyword_match / max(len(rule.condition.keywords), 1)) * 0.5

        scope_match = 0
        if scope and rule.condition.scope_patterns:
            for pattern in rule.condition.scope_patterns:
                if glob_match(scope, pattern):
                    scope_match = 0.3
                    break

        input_match = 0  # Placeholder for input_types matching

        total_score = (keyword_score + scope_match + input_match) * (rule.priority / 100)

        if total_score > 0:
            scored_rules.append((total_score, rule))

    # 4. Sort by score (desc), then rule priority (desc)
    scored_rules.sort(key=lambda x: (x[0], x[1].priority), reverse=True)

    # 5. Check confidence threshold
    if scored_rules:
        score, rule = scored_rules[0]
        metadata = load_action_metadata(rule.action)

        # Verify confidence meets threshold
        threshold_score = {
            'high': 0.8,
            'medium': 0.5,
            'low': 0.0
        }[rule.confidence]

        if score >= threshold_score:
            return rule.action, score, rule
        else:
            return rule.fallback or get_context_default(context), score, rule

    # 6. Fallback to context default
    return get_context_default(context), 0, None

def get_context_default(context):
    defaults = {
        'work': 'code/',
        'maintenance': 'code/',
        'explore': 'analyze/',
        'review': 'review/',
        'settings': 'plan/',
        'pm': 'plan/',
        'intel': 'analyze/',
    }
    return defaults.get(context, 'code/')
```

---

## Adding New Rules

### Before Adding a Rule

1. **Check for circular routing** — Ensure no rule creates routing cycles
2. **Verify action exists** — Action must be in ACTIONS.md
3. **Test with real examples** — Will this rule help routing in practice?

### Rule Template

```yaml
rule_id: RRXXX
priority: {50-100 depending on match type}
confidence: {high|medium|low}
condition:
  context: [{applicable contexts}]
  keywords: [{trigger keywords}]
  scope_patterns: [{optional patterns}]
action: {destination action/}
fallback: {optional fallback action/}
rationale: {Clear explanation of why this rule exists}
```

### Example: Adding a rule for database work

```yaml
rule_id: RR011
priority: 85
confidence: high
condition:
  context: [work, maintenance]
  keywords: [database, schema, migration, query, sql, data, model]
  scope_patterns: [packages/backend/src/schemas/**, packages/backend/src/storage/**]
action: code/backend/
fallback: code/
rationale: |
  Database work in backend scope = use stack-specific code/backend/.
  Patterns for schemas, queries, storage are expected.
```

---

## Monitoring & Evolution

### Routing Metrics

Log routing decisions in `.claude/actionflows/logs/routing/`:

- `gate-4-decisions.log` — All Gate 4 routing decisions with rule matched, score, confidence
- `routing-mismatches.log` — Cases where rule selected suboptimal action (manual annotation)
- `rule-effectiveness.log` — Aggregated stats: how often each rule is used, how helpful

### Rule Effectiveness Criteria

After 30 days of use, evaluate each rule:

- **Usage frequency** — How often does this rule match?
- **Confidence accuracy** — How often does the selected action prove correct?
- **Fallback rate** — How often does orchestrator fall back to fallback/ action?

Update or remove rules that:
- Never match (remove)
- Match but select wrong action consistently (refine conditions)
- Have too many fallbacks (lower priority or split into two rules)

---

## See Also

- `ROUTING_METADATA.md` — Action capability profiles for confidence decisions
- `packages/shared/src/routing/routingValidator.ts` — Zod schemas for validation
- `packages/shared/src/routing/routingAlgorithm.ts` — Scoring + decision logic
- `ORCHESTRATOR.md` § Gate 4 — How rules are applied during chain compilation
