---
date: "2026-04-02 18:40"
promoted: false
---

Add LLM abstraction layer to roadmap — wrap Agent SDK calls behind an interface so workbench sessions could be backed by any capable LLM (OpenAI, Google, local models). Graceful degradation when no agent available. Local-first conversation state. The abstraction sits between SessionManager and the Agent SDK — everything above the abstraction is LLM-agnostic. Could be a dedicated phase after Phase 6 (sessions) or folded into a future milestone. The actionflows framework (actions, flows, chains) is already LLM-agnostic in concept — the coupling is infrastructure (hooks, SDK), not philosophy.
