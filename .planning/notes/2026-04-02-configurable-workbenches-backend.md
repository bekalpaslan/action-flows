---
date: "2026-04-02 19:45"
promoted: false
---

Workbenches should be configurable — selected per workbench and reflected in the backend too. Not just frontend UI state — the backend should know which workbenches exist, their configuration, and their session mappings. This means a WorkbenchRegistry on the backend that stores workbench definitions (7 defaults + custom), config per workbench (personality, permissions, active flows), and syncs with frontend state. Phase 6 (Agent Sessions) and Phase 9 (Workbenches) both touch this. The backend WorkbenchRegistry was already proposed in the architecture research.
