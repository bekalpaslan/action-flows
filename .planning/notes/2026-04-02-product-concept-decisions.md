---
date: "2026-04-02 20:15"
promoted: false
---

PRODUCT CONCEPT DECISIONS (from brainstorm session):

1. Distribution: Locally running app — install executable or pull from git, connect Claude account, start using.

2. File separation: XDG-style split
   - Framework: git repo (updatable, pull new versions)
   - User data: ~/.flows-os/ (reports, sessions, custom flows, learnings, generated artifacts)
   - Clean boundary — framework updates don't touch user data

3. Workflow design: Team type first
   - Templates configure everything based on who you are
   - Team type sets workbenches, autonomy, flows, personalities, validation strictness
   - Users can override per stage, but the template is the starting point

4. Minimum viable agent stack: All 7 default workbenches
   - Work, Explore, Review, PM, Settings, Archive, Studio are the minimum for everyone
   - Templates add custom workbenches on top (e.g. Compliance for enterprise)
   - Even solo devs benefit from all 7

5. Agent transparency: Progressive disclosure
   - Agents explain more when you're new, less as you demonstrate mastery
   - The system adapts to skill level over time
   - Collapsible tool cards already support this (expanded for newcomers, collapsed for experts)
   - Workbench agent personality could calibrate verbosity based on usage patterns
