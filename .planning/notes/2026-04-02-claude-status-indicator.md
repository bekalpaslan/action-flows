---
date: "2026-04-02 20:45"
promoted: false
---

Claude status indicator — account-level health beyond WebSocket connection status. Should show:
- Claude API reachable (yes/no)
- Account authenticated (valid API key / Claude account connected)
- Token budget remaining (if trackable via Agent SDK)
- Rate limit status (approaching limits?)
- Active session count vs max allowed

This is different from the existing WebSocket status (local connection) and the planned Phase 6 per-workbench session status (individual agent health). This is the top-level "is Claude available" indicator.

Natural home: Phase 6 (Agent Sessions & Status) — the SessionManager already needs to know if Claude is reachable before creating sessions. The status panel could include an account health section.
