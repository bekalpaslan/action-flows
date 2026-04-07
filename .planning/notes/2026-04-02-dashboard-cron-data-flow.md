---
date: "2026-04-02 21:00"
promoted: false
---

Dashboard widget data flow — widgets are NOT static. They're backed by scheduled Claude cron jobs.

Flow: User instruction → Agent creates widget + cron job → Cron fires on schedule → Claude executes fetch/process task → Result pushed via WebSocket to Dashboard workbench → Component re-renders with fresh data

Example: "Show me top 10 HN headlines, refresh every 30min"
1. Agent creates FeedList widget with initial data
2. Agent creates cron: every 30min, fetch HN API, extract top 10, push to dashboard channel
3. Cron fires → Claude runs fetch → WebSocket broadcasts to dashboard channel → FeedList updates

This makes Dashboard the most complete proof of the architecture — ties together: cron (CUSTOM-03) + agent execution (SESSION-01) + WebSocket (FOUND-03) + component library (DESIGN-02) + design system (DESIGN-01).

Each widget stores its cron job ID so it can be paused/resumed/deleted from the status panel. Widget configuration (data source, refresh interval, display options) is persisted in ~/.flows-os/dashboards/.
