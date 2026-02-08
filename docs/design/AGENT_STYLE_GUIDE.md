# Agent Character Style Guide

> Visual design system for the ActionFlows Dashboard agent characters

---

## 1. Visual Direction

**Style:** Clean Minimal (Persona 5 UI inspiration)
- Flat design with bold silhouettes
- Expressive through pose and color, not detail
- Professional with personality
- Dark mode native

---

## 2. Color System

### Background
- **Primary:** Near-black (#0D0D0F or similar)
- **Agents glow against darkness** — luminous accents, neon edges

### Agent Color Palettes

| Agent | Primary | Accent | Glow | Role |
|-------|---------|--------|------|------|
| **Orchestrator** | White/Silver | Gold | Warm white | Team captain, conductor |
| **Explore** | Teal | Cyan | Cool aqua | Scout, curious wanderer |
| **Plan** | Deep purple | Violet | Soft magenta | Strategist, chess master |
| **Bash** | Charcoal | Electric green | Terminal green | Mechanic, hands-on engineer |
| **Read** | Navy | Soft blue | Paper white | Bookworm, gentle archivist |
| **Write** | Cream/Off-white | Ink black | Warm amber | Calligrapher, artistic |
| **Edit** | Slate gray | Coral red | Surgical pink | Surgeon, precise |
| **Grep** | Forest green | Lime | Highlight yellow | Hunter, tracker |
| **Glob** | Indigo | Star white | Constellation blue | Cartographer, pattern-seeker |

---

## 3. Line Treatment

- **Style:** Thin consistent outlines
- **Weight:** 1-2px uniform
- **Purpose:** Clean readable shapes at any size
- **Color:** Slightly lighter than fill, or glow-tinted

---

## 4. Character Proportions

- **Ratio:** Chibi-adjacent (1:2 or 1:3 head:body)
- **Head:** Large, carries all expression
- **Body:** Compact, icon-friendly
- **Goal:** Maximum personality per pixel, works as small icons and full animations

---

## 5. Face & Expression

- **Style:** Full expressive faces
- **Elements:** Eyes, brows, mouth all animate
- **Range:** Wide emotion spectrum
- **Eyes:** Anime-style with highlights, most expressive feature

### Expression States

| State | Face | Body | Aura |
|-------|------|------|------|
| **Idle** | Neutral, soft blink | Relaxed float | Dim, slow pulse |
| **Thinking** | Eyes closed or upward, slight furrow | Gentle sway | Medium pulse |
| **Working** | Determined, focused | Active pose, motion | Bright, steady |
| **Waiting** | Patient, mild | Still, occasional shift | Slow breathe |
| **Success** | Smile, bright eyes | Satisfied pose | Sparkle burst |
| **Error** | Worried, sweatdrop | Startled, tense | Flicker red |
| **Spawning** | Concentrated | Gesture outward | Energy release |

---

## 6. Animation Principles

- **Motion feel:** Smooth & fluid
- **Easing:** Gentle curves, flowing transitions
- **Reference:** Studio Ghibli — natural, organic movement
- **Timing:** Never jarring, always breathable

### Key Animations

| Action | Animation |
|--------|-----------|
| **Spawn** | Materializes from Orchestrator's light, gentle fade-in |
| **Report back** | Bows slightly, hands invisible scroll upward |
| **Complete** | Satisfied expression, soft fade with sparkle |
| **Error** | Surprised jolt, recovers to concerned pose |
| **Parallel work** | Multiple agents visible, each in own rhythm |
| **Handoff** | Glowing orb passes between agents |

---

## 7. Ambient Effects

- **Style:** Subtle auras
- **Behavior:** Soft glow halos that pulse with activity
- **Idle:** Dim, slow breathing pulse
- **Active:** Brighter, faster pulse
- **Thinking:** Medium, rhythmic pulse
- **Error:** Flickers, destabilizes momentarily

---

## 8. UI Integration

### Panel Placement
- **Location:** Dedicated side panel (separate from ReactFlow canvas)
- **Purpose:** Shows active agent squad with personality layer

### Layout
- **Arrangement:** Orchestrator center, subagents horizontal row on either side
- **Hierarchy:** Clear visual — conductor in middle, crew flanking

### Scale
- **Orchestrator:** 1.5x size of subagents
- **Subagents:** Equal size to each other
- **Result:** Balanced hierarchy, all agents have presence

---

## 9. Information Display

### Progressive Disclosure

| State | Shows |
|-------|-------|
| **Rest** | Character + name label only |
| **Hover** | Name + status text + progress bar, aura brightens |
| **Click** | Inline expand with log panel below agent |

---

## 10. Interaction Behaviors

### Hover
- **Character reaction:** Turns to face cursor, eyes track
- **Scale:** Slight scale up (1.05-1.1x)
- **Aura:** Intensifies
- **Info:** Status + progress appears

### Click
- **Action:** Section expands downward
- **Content:** Log panel unfolds inline
- **Transition:** Smooth expand animation

---

## 11. Log Panel Design

### Container
- **Style:** Inline expand (unfolds beneath agent)
- **Background:** Slightly lighter than main bg
- **Border:** Subtle, matches agent's glow color

### Log Display
- **Style:** Chat bubbles — agent "speaks" their output
- **Alignment:** Left-aligned bubbles from agent
- **Typography:** Clean sans-serif, readable size

### Bubble Color Coding

| Log Type | Bubble Tint | Indicator |
|----------|-------------|-----------|
| Info/Progress | Neutral gray | Standard update |
| Success | Soft green | Positive outcome |
| Error | Soft red | Needs attention |
| Thinking | Soft purple | Processing |
| Warning | Soft amber | Caution |

---

## 12. Audio Design

- **Approach:** Subtle UI sounds
- **Volume:** Soft, non-intrusive
- **Style:** Gentle chimes and alerts

### Sound Cues

| Event | Sound |
|-------|-------|
| Agent spawn | Soft crystalline chime |
| Task complete | Gentle success tone |
| Error | Muted alert, not harsh |
| Thinking start | Subtle hum fade-in |
| Panel expand | Soft whoosh |

---

## 13. Character Personality Summary

| Agent | Archetype | Key Traits | Signature Gesture |
|-------|-----------|------------|-------------------|
| **Orchestrator** | Calm commander | Composed, guiding, warm | Conducts with open palm |
| **Explore** | Curious scout | Eager, alert, adventurous | Peers with hand-visor |
| **Plan** | Chess master | Thoughtful, strategic, patient | Moves pieces in air |
| **Bash** | Hands-on mechanic | Practical, energetic, direct | Rolls up sleeves |
| **Read** | Gentle archivist | Quiet, absorbed, wise | Adjusts floating books |
| **Write** | Artistic calligrapher | Graceful, creative, flowing | Brush strokes in air |
| **Edit** | Precise surgeon | Focused, careful, exact | Examines with precision |
| **Grep** | Sharp-eyed tracker | Alert, hunting, determined | Scans with monocle |
| **Glob** | Pattern cartographer | Dreamy, connecting, mapping | Traces constellations |

---

## 14. Implementation Notes

### Asset Requirements
- Each agent: idle, thinking, working, success, error states
- Orchestrator: additional spawning animation
- All agents: hover reaction (turn + eye track)
- Sprite sheets or Lottie animations recommended

### Responsive Behavior
- Panel collapses to icons on narrow viewports
- Hover info becomes tap-to-reveal on touch devices
- Log panel becomes modal on mobile

### Accessibility
- Aura pulses should respect `prefers-reduced-motion`
- Color-coded bubbles include subtle icons for colorblind users
- Sound is supplementary, never required for understanding

---

## 15. Reference Board

**Visual Inspirations:**
- Persona 5 UI (flat, bold, stylish)
- Studio Ghibli motion (fluid, natural)
- Overwatch character icons (readable at small sizes)
- Discord/Slack emoji (expressive chibi)

**Motion Inspirations:**
- Ghibli character acting
- iOS fluid animations
- Framer Motion spring physics

---

*Document version: 1.0*
*Created: 2026-02-08*
