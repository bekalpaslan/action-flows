# Living Universe Rollout Strategy

Phased deployment plan for the Living Universe visualization layer, with rollback procedures and monitoring strategy.

---

## Overview

**Goal:** Safely transition users from classic workbench sidebar to Living Universe cosmic map interface.

**Approach:** Feature-flag-gated rollout with progressive enablement.

**Timeline:** 3 phases over 4 weeks

---

## Phase 1: Internal Testing (Week 1)

**Audience:** Development team + alpha testers (5-10 users)

**Flags Enabled:**
- ✅ `COSMIC_MAP_ENABLED: true`
- ✅ `COMMAND_CENTER_ENABLED: true`
- ✅ `SPARK_ANIMATION_ENABLED: true`
- ✅ `EVOLUTION_ENABLED: true`

**Goals:**
- Validate core navigation (zoom in/out, region clicks)
- Test onboarding flow UX
- Identify performance bottlenecks
- Verify E2E test stability

**Success Criteria:**
- [ ] 0 critical bugs
- [ ] < 5% E2E test flake rate
- [ ] Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Positive feedback from alpha testers

**Rollback Plan:**
If critical bugs emerge:
1. Set `COSMIC_MAP_ENABLED: false` in feature flag service
2. Redeploy with classic sidebar as default
3. Investigate and fix issues
4. Re-enable for Phase 1 users only

---

## Phase 2: Beta Release (Weeks 2-3)

**Audience:** Early adopters + opt-in users (20-30% of user base)

**Flags Enabled:**
- ✅ `COSMIC_MAP_ENABLED: true`
- ✅ `COMMAND_CENTER_ENABLED: true`
- ⬜ `SPARK_ANIMATION_ENABLED: false` (disabled for performance)
- ✅ `EVOLUTION_ENABLED: true`

**Goals:**
- Gather real-world usage data
- Validate performance at scale
- Collect user feedback (surveys, support tickets)
- Test evolution system with diverse workflows

**Announcement:**
```markdown
📢 **Beta Feature: Living Universe Cosmic Map**

We're testing a new visualization layer for ActionFlows. Try it now:
1. Go to Settings → Feature Flags
2. Enable "Cosmic Map"
3. Reload the page

Feedback? Use the DiscussButton in Settings or email support@actionflows.com
```

**Success Criteria:**
- [ ] < 2% rollback rate (users disabling cosmic map)
- [ ] Web Vitals stable across user base
- [ ] No increase in support ticket volume
- [ ] Positive sentiment in user feedback

**Rollback Plan:**
If degraded performance or negative feedback:
1. Announce feature flag toggle: "Prefer classic mode? Disable in Settings"
2. Monitor adoption rate for 3 days
3. If < 50% adoption, delay Phase 3 by 1 week
4. Fix issues and re-announce

---

## Phase 3: General Availability (Week 4)

**Audience:** All users (100% rollout)

**Flags Enabled:**
- ✅ `COSMIC_MAP_ENABLED: true`
- ✅ `COMMAND_CENTER_ENABLED: true`
- ✅ `SPARK_ANIMATION_ENABLED: true` (re-enabled after optimization)
- ✅ `EVOLUTION_ENABLED: true`

**Goals:**
- Full production rollout
- Monitor at scale
- Deprecate classic sidebar (flag remains for rollback)

**Announcement:**
```markdown
🌌 **Introducing: Living Universe**

ActionFlows now visualizes your workspace as a living universe. Navigate regions as stars, watch data flow as sparks, and unlock hidden areas through evolution.

New to the cosmic map? Check out the 3-step onboarding tour or visit our [User Guide](./docs/migration/USER_MIGRATION_GUIDE.md).

Prefer the classic interface? Toggle in Settings → Feature Flags.
```

**Success Criteria:**
- [ ] < 5% users disable cosmic map
- [ ] Web Vitals remain stable
- [ ] Positive user sentiment
- [ ] Support ticket volume normal

**Rollback Plan:**
If critical production issues:
1. Emergency hotfix: Set `COSMIC_MAP_ENABLED: false` globally
2. Announce rollback via in-app banner + email
3. Schedule postmortem + fix timeline
4. Re-enable after validation

---

## Feature Flag Management

### Backend Configuration
**File:** `packages/backend/src/services/featureFlagService.ts`

```typescript
const FEATURE_FLAGS: Record<FeatureFlagName, boolean> = {
  COSMIC_MAP_ENABLED: process.env.COSMIC_MAP_ENABLED === 'true',
  COMMAND_CENTER_ENABLED: process.env.COMMAND_CENTER_ENABLED === 'true',
  SPARK_ANIMATION_ENABLED: process.env.SPARK_ANIMATION_ENABLED === 'true',
  EVOLUTION_ENABLED: process.env.EVOLUTION_ENABLED === 'true',
};
```

### Per-User Overrides (Optional)
**File:** Same as above

```typescript
export function getFeatureFlagForUser(
  flagName: FeatureFlagName,
  userId: UserId
): boolean {
  // Phase 1: Alpha testers only
  const alphaUsers = ['user-alice', 'user-bob'];
  if (flagName === 'COSMIC_MAP_ENABLED' && !alphaUsers.includes(userId)) {
    return false;
  }

  return FEATURE_FLAGS[flagName];
}
```

### Frontend Override (localStorage)
Users can manually toggle via Settings → Feature Flags. Overrides backend defaults.

**File:** `packages/app/src/hooks/useFeatureFlag.ts`

```typescript
const localOverride = localStorage.getItem(`flag-${flag}`);
if (localOverride !== null) {
  return localOverride === 'true';
}
```

---

## Monitoring Strategy

### Web Vitals Dashboard
**File:** `packages/app/src/hooks/useWebVitals.ts`

Metrics captured:
- **LCP** (Largest Contentful Paint): Cosmic map render time
- **FID** (First Input Delay): Region click responsiveness
- **CLS** (Cumulative Layout Shift): Onboarding tooltip stability

**View:** Settings → Performance → Web Vitals

**Alerts:**
- LCP > 3s → Investigate CosmicBackground canvas rendering
- FID > 150ms → Check ReactFlow event handlers
- CLS > 0.15 → Review onboarding tooltip positioning

### Backend Metrics
**Endpoint:** `GET /api/universe/metrics`

```json
{
  "totalRegions": 12,
  "visibleRegions": 8,
  "faintRegions": 4,
  "activeUsers": 42,
  "avgRenderTime": 850,
  "evolutionRate": 0.12
}
```

**Alerts:**
- `avgRenderTime > 2000ms` → Performance degradation
- `evolutionRate < 0.05` → Evolution gates too strict

### Error Tracking
**File:** `packages/app/src/utils/errorBoundary.tsx`

Catch cosmic map errors:
```typescript
if (error.componentStack.includes('CosmicMap')) {
  logError('COSMIC_MAP_ERROR', { error, userId, timestamp });
}
```

**Dashboard:** Monitor error rate in Sentry/LogRocket (if integrated)

### User Feedback
**Channels:**
- DiscussButton in Settings (triggers support ticket)
- GitHub Issues tagged `cosmic-map`
- Email: support@actionflows.com

**Review cadence:** Daily during Phase 1-2, weekly during Phase 3

---

## Rollback Procedures

### Emergency Rollback (< 5 minutes)
1. SSH into production server
2. Set env var: `export COSMIC_MAP_ENABLED=false`
3. Restart backend: `pnpm dev:backend` (or systemctl restart)
4. Announce via in-app banner

**Banner:**
```markdown
⚠️ **Cosmic Map Temporarily Disabled**

We've detected an issue and reverted to classic mode. Your data is safe.
We'll update you when the cosmic map is restored.
```

### Partial Rollback (User-level)
If specific users report issues:
1. Ask user to disable in Settings → Feature Flags
2. Investigate user-specific issue (browser, data state)
3. Fix and re-enable for that user

### Gradual Re-enablement
After rollback fix:
1. Re-enable for Phase 1 users (alpha testers)
2. Monitor for 24 hours
3. If stable, re-enable for Phase 2 users
4. If stable, re-enable for all users

---

## Success Metrics

### Adoption Rate
**Goal:** > 95% of users keep cosmic map enabled

**Measurement:**
```sql
SELECT
  COUNT(DISTINCT user_id) FILTER (WHERE cosmic_map_enabled = true) AS enabled_users,
  COUNT(DISTINCT user_id) AS total_users,
  (enabled_users::float / total_users) * 100 AS adoption_rate
FROM feature_flags;
```

### Performance
**Goal:** Web Vitals remain within thresholds

| Metric | Target | Threshold |
|--------|--------|-----------|
| LCP    | < 2.5s | Alert at 3s |
| FID    | < 100ms | Alert at 150ms |
| CLS    | < 0.1  | Alert at 0.15 |

### User Satisfaction
**Goal:** > 80% positive sentiment

**Survey (in-app after 1 week):**
```
How would you rate the new Living Universe cosmic map?
[ ] Love it (5)
[ ] Like it (4)
[ ] Neutral (3)
[ ] Dislike it (2)
[ ] Hate it (1)

Comments (optional): _____________
```

---

## Deprecation Timeline (Classic Sidebar)

**Phase 3 + 4 weeks:** Announce deprecation
```markdown
📅 **Classic Sidebar Deprecation Notice**

Starting in 8 weeks, the classic sidebar will be removed. The cosmic map will become the default (and only) interface.

Need help? See our [User Guide](./docs/migration/USER_MIGRATION_GUIDE.md).
```

**Phase 3 + 8 weeks:** Remove classic sidebar code
- Delete `packages/app/src/components/Sidebar/`
- Remove `COSMIC_MAP_ENABLED` feature flag
- Update onboarding to assume cosmic map

**Phase 3 + 12 weeks:** Archive classic sidebar docs
- Move to `docs/archive/CLASSIC_SIDEBAR.md`

---

## Postmortem Template

If rollback occurs, conduct a postmortem:

```markdown
# Cosmic Map Rollback Postmortem (YYYY-MM-DD)

## What Happened
[Brief description of the issue]

## Timeline
- HH:MM — Issue detected
- HH:MM — Rollback initiated
- HH:MM — Classic mode restored
- HH:MM — Root cause identified
- HH:MM — Fix deployed

## Root Cause
[Technical explanation]

## Impact
- Users affected: X
- Downtime: Y minutes
- Support tickets: Z

## Action Items
1. [ ] Fix root cause
2. [ ] Add regression test
3. [ ] Update monitoring alerts
4. [ ] Document learnings

## Learnings
[What we learned, how to prevent in future]
```

---

## Next Steps

- Read [User Migration Guide](./USER_MIGRATION_GUIDE.md)
- See [Developer Guide](./DEVELOPER_GUIDE.md) for customization
- Review [E2E Testing Guide](../testing/E2E_COSMIC_MAP.md)
