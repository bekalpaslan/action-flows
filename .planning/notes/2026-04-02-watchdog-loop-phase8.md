---
date: "2026-04-02 18:35"
promoted: false
---

Watchdog/health loop for Phase 8 (Neural Validation & Safety): a recurring loop that checks agent work in progress, reviews codebase state (type-check, build, tests), flags drift (design system violations, stale terminology), and reports health. Implementation options: Claude Code /loop for frequent checks, cron for nightly audits, Settings workbench UI for dashboard. This IS the nervous system running on a schedule, complementing the per-file-write hooks.
