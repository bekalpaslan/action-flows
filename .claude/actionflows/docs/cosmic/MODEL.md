# The Cosmic Model

**Produced from an interactive brainstorm session with the human on 2026-02-11.**

---

## Overview

The ActionFlows Dashboard Living Universe operates as a coherent cosmic model. The universe has 6 entity types that work together to create an integrated experience where exploration, work, review, and governance all happen in the same spatial plane.

The cosmic map IS the main dashboard. There is no separate "dashboard view." You navigate by zooming in and out. This document defines what exists in that space and how it all works together.

---

## The Six Entity Types

| Entity | Visual | Description |
|--------|--------|-------------|
| **Harmony** | The void/background | The space itself. Has its own workbench (click empty space). Shows gate logs, contract violations. |
| **Stars** | Glowing bodies | Workbenches. 8 framework defaults + user-created customs. Zoom in → interior replaces the cosmic map. Zoom out → back to map. |
| **Moons** | Orbiting bodies | Data sources. Orbit their parent star. External APIs, log feeds, databases. |
| **Gates** | Checkpoints in space | Framework tools. Data flows through them, leaving traces. Contract enforcement points. |
| **Tools** | Inside stars | Capabilities embedded in workbenches. Not their own stars. Editor, canvas, coverage. |
| **Sparks** | Moving particles | Agents executing work. Visible in the space while active. |

---

## Navigation Model

### The Map Is the Dashboard

- The cosmic map is the main view of the universe
- There is no separate "dashboard screen" — the map IS the interface
- Stars are workbenches positioned on the map
- The human navigates by zooming in and out

### Zoom as Navigation

- **Click a star** → Zoom in → Star interior appears (replaces the cosmic map in the same panel)
- **Zoom out** → Back to the cosmic map view
- **Click empty space** → Harmony workbench (shows gate logs, contract violations)
- **Same panel, different depths** — All workbenches use the same main panel. Zoom level changes what you see.

### Moons and Orbits

- Moons orbit their parent star on the cosmic map
- They represent data sources feeding the star's interior
- Examples: External APIs, log feeds, databases, file watchers
- Users can see what data sources a workbench is connected to by observing its orbiting moons

### State Signaling from the Map

- A star's visual state on the cosmic map communicates its internal state BEFORE you enter
- Example: MAINTENANCE glows amber when degraded, calling you to investigate
- Example: REVIEW brightens when PRs pile up, signaling work waiting
- The map itself is a status dashboard

---

## Framework Default Stars (8)

Framework default stars exist at Big Bang. They are fundamental for the system to function. Every new universe starts with these eight.

### 1. WORK — The Hearth

**The feeling:** You zoom in and it feels like coming home. Your desk in the universe.

Your active sessions glow like embers — the ones you're in the middle of. Conversations you've had with the orchestrator are here, scrollable, searchable. It's warm. This is YOUR space.

**What you do here:**
- Pick up where you left off in previous sessions
- Browse every chain you've ever run
- Search and review past results
- Organize by time and project
- Watch active chains execute in real time

**Ambient state:**
- Idle embers (nothing active) — quiet, warm
- Blazing forge (chains running right now) — energy and motion

**Workbench style:** Personal, warm, lived-in. This is the heart of the system.

---

### 2. MAINTENANCE — The Observatory

**The feeling:** Clinical. Precise. A monitoring station, not a lingering place.

You zoom in and see the health of the system laid out like vital signs. Green pulses mean healthy. Amber means degraded. Red means something broke.

**What you do here:**
- Check system status at a glance
- Identify failures and degradation
- Monitor resource usage and performance
- See alerts and warnings
- Act on critical issues

**Ambient state:**
- Green (healthy) — you check, see green, zoom back out quickly
- Amber (degraded) — the star glows amber on the map, calling you to investigate
- Red (broken) — active alert, demanding attention

**Workbench style:** Utilitarian. Dashboard tiles. Vital signs. You don't linger here — you visit with purpose.

---

### 3. EXPLORE — The Cartographer's Table

**The feeling:** You zoom in and see the territory mapped out. Your codebase as landscape.

Files are terrain. Directories are regions. You navigate, search, discover. This is where you understand what exists before you change it.

**What you do here:**
- Map the codebase landscape
- Navigate file hierarchies
- Search and discover components
- Read file structures
- Understand relationships and dependencies
- Plan before you act

**Ambient state:**
- Calm, analytical, deliberate
- You're building mental models
- Exploration isn't urgent — it's thoughtful

**Workbench style:** An unrolled map. You can dive into any file, see its structure, understand its context.

---

### 4. REVIEW — The Tribunal

**The feeling:** Weighty. Decisions happen here. A place of judgment.

You zoom in and see the work of others (or agents) laid out for judgment. Diffs side by side, changes highlighted.

**What you do here:**
- Examine proposed changes
- Approve or reject work
- Request modifications
- Judge quality and correctness
- Make decisions

**Ambient state:**
- Stack of cases waiting → star glows brighter on the map
- All cases cleared → star dims
- Work waiting = visual signal = "come here"

**Workbench style:** Formal. Side-by-side diffs. Comments and decisions. Every PR is a case being tried.

---

### 5. SETTINGS — The Loom

**The feeling:** Mechanical. Gears and levers. Essential but not exciting.

You zoom in and see the knobs and dials of the universe. Theme, shortcuts, backend connections, preferences.

**What you do here:**
- Configure appearance (theme, layout)
- Set keyboard shortcuts
- Connect backend services
- Set preferences and defaults
- Shape how the universe responds to you

**Ambient state:**
- Static, waiting
- Only changes when you change it
- On the map: a quiet star, always there, rarely visited
- But when you need it, you know exactly where it is

**Workbench style:** Configuration UI. Forms and toggles. Mechanical and precise.

---

### 6. PM — The War Table

**The feeling:** Strategic. Looking at the big picture. The campaign before the battle.

You zoom in and see the campaign laid out. Tasks, milestones, priorities. What's done, what's in progress, what's blocked.

**What you do here:**
- View project roadmap
- Track task progress
- Manage priorities
- See completion percentages
- Understand the march of the project

**Ambient state:**
- Progress bars and completion percentages
- Satisfying movement: cards flowing from "todo" → "in progress" → "done"
- Strategic perspective on the whole system

**Workbench style:** Project management. Cards, timelines, milestones. The bridge between intention and execution.

---

### 7. ARCHIVE — The Vault

**The feeling:** Like entering a library. Still, undisturbed, rich with memory.

Every completed session, every finished chain is stored and indexed here. Searchable, filterable, restorable.

**What you do here:**
- Find historical sessions
- Restore past work
- Review what was done weeks ago
- Search by project, tag, date
- Mine the system's memory

**Ambient state:**
- Quiet, still
- Nothing is happening here
- This is where the universe stores its long-term memory
- The more you use the system, the richer this star becomes

**Workbench style:** Library. Archive browser. Search and retrieval. The system's institutional memory.

---

### 8. RESPECT — The Guardian

**The feeling:** Vigilant. Watchful. A quiet sentinel.

You zoom in and see boundaries. Spatial rules, layout constraints, component territories. This star watches for violations.

**What you do here:**
- Review spatial rules and constraints
- See boundary violations highlighted
- Understand layout physics
- Monitor component territories
- Ensure visual harmony

**Ambient state:**
- Green (boundaries respected) → everything glows, no problems
- Red (violations) → red markers appear at the exact location of the breach
- Quiet when healthy, demanding when violated

**Workbench style:** Safety monitor. Visual rule enforcement. When you break something visually, this star shows you where and how.

---

## Harmony — The Space Between

### Not a Star

Harmony is not a destination like the eight stars. It is the void itself. The cosmic background that all stars float in. The atmosphere of the universe.

### The Workbench in the Void

Click on empty space between the stars and the cosmic map dissolves into a workbench that shows:

- **Gate logs** — Traces of data flowing through contract checkpoints
- **Contract violations** — Where the rules of the universe were broken
- **Data flow visualization** — The invisible currents connecting stars
- **Compliance dashboards** — Health of all gate contracts

### Ambient Presence

- **Healthy harmony is invisible** — You never notice it. Everything works, the space is clear.
- **Degraded harmony makes the space flicker** — Something's wrong. The background radiation is showing.
- **You don't visit often** — But you notice when something's wrong.

### Harmony Is Both Atmosphere and Destination

Harmony has a full workbench with real functionality (gate log viewer, violation browser, compliance dashboards). It's both:
- The background radiation of the universe (always present, mostly unnoticed)
- A real place you can enter to diagnose problems and understand data flows

---

## Custom Stars (User-Created Workbenches)

### The User's Extension Layer

Beyond the eight framework defaults, users can create custom stars. These are new destinations in the cosmic map, representing new workbenches for specialized purposes.

### INTEL — The Spy Glass (Demo Star)

The framework ships INTEL as an example of extensibility. It demonstrates:

**What INTEL does:**
- Zoom in and find dossiers
- Structured intelligence reports about your codebase
- Analytics about patterns, architecture, dependencies
- Analytical, not operational — you come here to understand, not to act

**The Demo Element:**
- INTEL has a **source moon** — an external data feed orbiting the star
- This showcases that custom stars can reach OUTSIDE the universe for data
- Users can use INTEL as a template for their own custom stars
- Users could delete it, evolve it, or ignore it

**Architectural Value:**
- INTEL proves the extensibility model
- It shows that the cosmic model isn't closed — users can add new stars
- The demo is deliberately evolve-able, not sacred

---

## Tools (Embedded in Stars, Not Their Own Stars)

Tools are capabilities available inside workbenches. They are not destinations — they are instruments used within the spaces you visit.

### Framework Default Tools

**Editor** (Framework default)
- The framework's default pencil
- Available inside any star that needs code editing
- Not a destination, an instrument
- Used by WORK (edit session notes), EXPLORE (read files), and custom stars

**Canvas** (Custom tool)
- A live preview playground
- Could be embedded in any star that needs visual rendering
- Ships as a demo but isn't required by the framework
- Example: A star for visualizing flows could embed the canvas

**Coverage** (Tool)
- Reads contract compliance data from gate logs
- Used by HARMONY background layer
- Used by RESPECT to highlight violations
- Any star that cares about contracts can request coverage data

### Tool Attachment Model

- Tools are NOT stars — they don't appear on the cosmic map
- Tools are UI components embedded in a star's interior workbench
- A star can request any tool at zoom time
- Same tool can be used by multiple stars

---

## Gates — Data Flow Checkpoints

### What Gates Are

Gates are framework tools that:
- Sit in the cosmic space (visible on the map, not inside stars)
- Watch data flowing between stars and external sources
- Enforce contracts and rules
- Leave traces in Harmony (the gate log)

### Visual Presence

- Gates appear as checkpoints in the cosmic space
- They're visible on the cosmic map (between stars or at the boundary to external data)
- Not meant to be entered like stars — they're infrastructure
- But they can be inspected from Harmony

### Data Flow Tracking

- When data flows through a gate (star calling an external API, moons feeding data, agents reporting results), the gate records it
- These traces accumulate in the Harmony workbench as gate logs
- Humans can view this flow history to understand system behavior

### Contract Enforcement

- Gates validate that data flowing through them respects contracts
- When violations occur, RESPECT marks them on the map and Harmony logs them
- The framework ensures data integrity through these checkpoints

---

## Sparks — Agents Executing

### What Sparks Are

Sparks are agents actively executing work. They are visible in the cosmic space as moving particles or animated bodies.

### Visibility and Duration

- Sparks appear in the space while active — you can watch them move and execute
- When an agent completes its work, the spark vanishes
- Multiple sparks can exist simultaneously (parallel execution)
- Sparks might orbit their parent star or move between stars

### User Interaction

- Sparks are visible status indicators
- You can potentially watch, pause, or cancel an executing spark
- They communicate "something is happening right now"
- The universe feels alive when sparks are moving

---

## Architectural Principles

### 1. The Map IS the Dashboard

There is no separate "dashboard view." The cosmic map is the main view and it is the only main view.

All navigation happens through zoom, pan, and click on map entities (stars, moons, harmony).

### 2. Zoom Is Navigation

There is no "open a modal" or "change to a different screen." Zoom changes what you see in the same panel.

- Zoom in on a star → see its interior (workbench)
- Zoom out → back to the cosmic map
- Consistent spatial metaphor for the entire system

### 3. Workbenches Can Contain Anything

The framework doesn't dictate workbench content. A workbench interior can be:

- An iframe with custom HTML/React
- A list of logs
- A health dashboard with tiles
- An editor
- A project management board
- A file browser
- Anything

The framework provides the zoom infrastructure and workbench lifecycle. Content is user-defined.

### 4. Framework Defaults vs User Creation

- **8 stars exist at Big Bang** — These are fundamental. The framework won't function without them.
- **Everything else is added later** — Custom stars, custom tools, custom moons, user preferences all build on top of the defaults.
- **Users have full sovereignty** — Users can modify, delete, or replace even defaults.

### 5. Stars Signal from the Map

Before you zoom in, the star's visual state tells you what you'll find:

- **MAINTENANCE glowing amber** → Something degraded, worth investigating
- **REVIEW glowing bright** → PRs waiting, work pending
- **WORK pulsing active** → Chains executing right now
- **ARCHIVE growing richer** → System learning and remembering

Visual feedback at distance (on the map) invites navigation without forcing it.

### 6. Data Flows Through Harmony

The space between stars isn't empty. Data flows through it:

- Stars send requests and receive responses
- Moons feed data to their parent stars
- Agents (sparks) move through the space executing chains
- All of this passes through gates, leaving traces in Harmony

The universe is alive with invisible currents. Harmony lets you see them when you need to diagnose.

### 7. Moons Show Data Connections

By looking at the cosmic map, you can see what data sources feed each star:

- Orbiting moons = connected data sources
- No moons = standalone workbench
- Rich orbit = many data connections
- Visible data relationships without entering the star

---

## Implementation Considerations

### Rendering the Cosmic Map

The cosmic map is the primary view. It requires:

- Real-time rendering of stars (workbenches), moons (data sources), gates (checkpoints), and sparks (agents)
- Zoom/pan navigation with smooth transitions
- Click detection on entities (stars to zoom in, moons for details, harmony for background)
- Visual state indication (glow, color, animation) for star status
- Moon orbital mechanics (visual, not necessarily physics-based)

### Zoom Transitions

- Smooth zoom animation from map to star interior
- Transition time should feel natural, not jarring
- On zoom out, the workbench should smoothly become the map again
- Same panel used for both views (no separate DOM elements)

### State Management

- Each star maintains its own internal workbench state
- Moons track data source connections
- Gates log all data flows (persisted in Harmony)
- Sparks have lifecycle (created, active, completed, removed)
- Harmony aggregates all gate logs and violations

### User Customization

- Users can create new stars (custom workbenches)
- Users can delete or modify stars
- Users can attach moons to stars (data source configuration)
- Users can configure tools within workbenches
- User modifications persist and are sovereign

---

## Narrative and Feel

### The Universe Is Alive

The cosmic model isn't a metaphor bolted on top of a traditional UI. It's the actual structure. Every entity has purpose. Every visual signal means something. The space itself conveys information.

### Exploration Invites Mastery

New users see the cosmic map and intuitively understand the high-level structure. Eight glowing stars. They zoom in to discover what each does. Over time, the universe becomes familiar, habitable, customizable.

### Work Feels Natural

You work in WORK (the Hearth), review in REVIEW (the Tribunal), understand in EXPLORE (the Cartographer's Table). Each star has its own atmosphere, its own rhythm. Work doesn't feel like filling out a form — it feels like moving through a space you understand.

### System Health Is Visible

You don't have to dig into logs to know something's wrong. The cosmic map shows you. MAINTENANCE glows amber. A gate's violation is marked. Harmony flickers. You see the system's heartbeat without thinking about it.

### Growth Over Time

Your ARCHIVE grows. Custom stars appear on the map. The universe evolves with you. It doesn't feel static — it feels like it's learning alongside you.

---

## Quick Reference: Cosmic Entities

| Entity | Count | Visual | Purpose | Entry Point |
|--------|-------|--------|---------|------------|
| **Stars** | 8 default + N custom | Glowing bodies | Workbenches (destinations) | Zoom in |
| **Moons** | Varies | Orbiting bodies | Data sources | Connected to parent star |
| **Gates** | Varies | Checkpoints | Contract enforcement | Inspected from Harmony |
| **Tools** | Multiple | Embedded | Capabilities in workbenches | Loaded by workbench |
| **Sparks** | Varies | Moving particles | Active agents | Visible while executing |
| **Harmony** | 1 | The void | Background + workbench | Click empty space |

---

## Next Steps for Implementation

1. **Render the cosmic map** with stars, moons, gates as visual entities
2. **Implement zoom navigation** with smooth transitions to/from star interiors
3. **Define workbench contracts** — what each star's interior must provide
4. **Implement gate logging** — capture data flows and violations into Harmony
5. **Add spark rendering** — show executing agents as visible particles
6. **Create the eight default star workbenches** — one for each framework default
7. **Enable custom star creation** — let users add their own workbenches to the map
8. **Build Harmony workbench** — gate log viewer, violation browser, flow visualization

---

**Document Version:** 1.0
**Last Updated:** 2026-02-11
**Status:** Design Specification (Ready for Implementation Planning)
