---
date: "2026-04-02 20:55"
promoted: false
---

Dashboard workbench widget components — 13 widgets extending the base 12-component library. Agents compose these from natural language instructions.

DATA DISPLAY:
- StatCard — single metric with label, value, trend arrow (up/down/flat), optional sparkline
- DataTable — sortable, filterable table with pagination. Agent fills rows from fetched data.
- FeedList — scrollable list of items (headlines, events, notifications) with timestamps and clickable links
- Chart — basic line/bar/area chart for time-series data (recharts or visx)

TIME WIDGETS:
- Countdown — deadline timer with label ("Sprint ends in 3d 14h")
- Clock — timezone-aware clock (for distributed teams)
- Timeline — vertical timeline of events with status markers

STATUS WIDGETS:
- StatusGrid — grid of service/system status indicators (green/yellow/red dots with labels)
- ProgressRing — circular progress indicator with percentage and label
- MeterBar — horizontal gauge (CPU usage, token budget, completion %)

CONTENT WIDGETS:
- EmbedFrame — iframe for embedding external content (dashboards, docs, tools)
- MarkdownBlock — rendered markdown content block (notes, summaries, daily briefs)
- LinkGrid — grid of quick-access links with icons (bookmarks, tools, repos)

Key constraint: agents compose these from natural language. "Show me a stat card with today's commit count" → agent renders <StatCard label="Commits Today" value={23} trend="up" />.

These need to be added to the component manifest so agents know they exist. Natural home: Phase 10 (Custom Workbenches) or a dedicated Dashboard workbench phase.
