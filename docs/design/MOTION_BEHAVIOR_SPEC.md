# Motion Behavior Specification

**Version:** 1.0
**Last Updated:** 2026-02-21
**Status:** Canonical Reference

This document is the **single source of truth** for all animation, transition, and motion behavior in the ActionFlows Dashboard. All components must reference these specifications.

---

## 1. Philosophy

### Core Principles

**GPU-First Performance**
- Animate only `transform` and `opacity` whenever possible
- Avoid animating `width`, `height`, `top`, `left`, or other layout properties
- Use `transform: translateX/Y/Z` and `scale` instead of positional changes
- Exception: Progress bars and explicit layout animations may use `width`/`height`

**Snappy Responsiveness**
- Most interactions complete in 150-200ms
- Micro-interactions (checkbox, toggle) complete in 75ms
- Only deliberate motions (panel slides, page transitions) exceed 300ms
- Users should never wait for animations

**Natural Motion**
- Use Apple-style easing (`cubic-bezier(0.25, 0.1, 0.25, 1)`) for transforms
- Use symmetric easing (`ease-in-out`) for color and opacity changes
- Enter animations use `ease-out` (fast start, smooth landing)
- Exit animations use `ease-in` (smooth start, fast exit)

**Respectful Accessibility**
- Honor `prefers-reduced-motion` user preference
- Three tiers: Essential (keep), Functional (simplify), Decorative (remove)
- Reduced motion never breaks functionality
- State changes still occur, just without animation

**Layered Priority**
1. **Essential**: Progress indicators, state changes, focus visibility
2. **Functional**: Hover feedback, panel collapse, content transitions
3. **Decorative**: Agent character motion, ambient glow, hover lift effects

---

## 2. Token Reference

### Duration Scale

| Token | Value | Usage Guidelines |
|-------|-------|------------------|
| `--duration-instant` | 75ms | Micro-interactions: checkbox toggle, radio select, switch flip |
| `--duration-fast` | 150ms | Fast feedback: hover state, focus ring, button press |
| `--duration-normal` | 200ms | Standard transitions: color change, opacity fade, default |
| `--duration-slow` | 300ms | Deliberate motion: panel slide, sidebar expand, content swap |
| `--duration-slower` | 400ms | Complex choreography: multi-element sequences, coordinated moves |
| `--duration-slowest` | 500ms | Dramatic motion: page transitions, loading celebrations |

**Selection Guide:**
- Uncertain? Use `--duration-normal` (200ms)
- User-initiated action? Use `--duration-fast` or `--duration-normal`
- Automatic/system motion? Use `--duration-slow` or slower
- Multiple elements moving? Use `--duration-slower` with stagger

### Easing Curves

| Token | Value | Purpose | When to Use |
|-------|-------|---------|-------------|
| `--ease-linear` | `linear` | Constant velocity | Progress bars, loading spinners, continuous loops |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerating exit | Element leaving viewport, fade out, slide out |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Decelerating enter | Element appearing, fade in, slide in |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric motion | Color changes, opacity, toggles, swaps |
| `--ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful overshoot | Notifications, success celebrations, emphasis |
| `--ease-apple` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Premium feel | Transforms, morphs, panel slides, spatial motion |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Elastic pop | Pop-in effects, scale entrances, attention grabs |

**Selection Guide:**
- Transform motion (translate, scale)? → `--ease-apple`
- Color/opacity change? → `--ease-in-out`
- Enter animation? → `--ease-out`
- Exit animation? → `--ease-in`
- Need extra delight? → `--ease-spring` or `--ease-bounce`

### Transition Presets

| Token | Definition | Use Case |
|-------|------------|----------|
| `--transition-colors` | `color var(--duration-normal) var(--ease-in-out), background-color var(--duration-normal) var(--ease-in-out), border-color var(--duration-normal) var(--ease-in-out)` | Hover states, theme changes, status updates |
| `--transition-opacity` | `opacity var(--duration-fast) var(--ease-in-out)` | Fade in/out, visibility changes |
| `--transition-transform` | `transform var(--duration-normal) var(--ease-apple)` | Spatial motion, scale, position changes |
| `--transition-all` | `all var(--duration-normal) var(--ease-in-out)` | Prototyping only (replace with specific properties) |

**Usage:**
```css
/* Apply preset directly */
.button {
  transition: var(--transition-colors);
}

/* Combine multiple presets */
.panel {
  transition: var(--transition-opacity), var(--transition-transform);
}

/* Override timing for specific case */
.slow-fade {
  transition: opacity var(--duration-slow) var(--ease-in-out);
}
```

---

## 3. Interaction Patterns

### Hover State

**Behavior:** Color and background color shift
**Duration:** `--duration-fast` (150ms)
**Easing:** `--ease-in-out`
**Properties:** `color`, `background-color`, `border-color`

```css
.button {
  transition: var(--transition-colors);
  background-color: var(--color-bg-secondary);
}

.button:hover {
  background-color: var(--color-bg-tertiary);
}
```

### Focus State

**Behavior:** Outline/ring appears instantly
**Duration:** `--duration-fast` (150ms)
**Easing:** `--ease-in-out`
**Properties:** `outline`, `box-shadow`

```css
.input {
  outline: 2px solid transparent;
  transition: outline-color var(--duration-fast) var(--ease-in-out);
}

.input:focus {
  outline-color: var(--color-accent);
}
```

### Press/Active State

**Behavior:** Slight scale down for tactile feedback
**Duration:** `--duration-instant` (75ms)
**Easing:** `--ease-in-out`
**Properties:** `transform`

```css
.button {
  transition: var(--transition-transform);
}

.button:active {
  transform: scale(0.97);
}
```

### Toggle/Switch

**Behavior:** State swap with smooth transition
**Duration:** `--duration-normal` (200ms)
**Easing:** `--ease-in-out`
**Properties:** `transform`, `background-color`

```css
.toggle__handle {
  transition:
    transform var(--duration-normal) var(--ease-in-out),
    background-color var(--duration-normal) var(--ease-in-out);
  transform: translateX(0);
}

.toggle[aria-checked="true"] .toggle__handle {
  transform: translateX(20px);
  background-color: var(--color-accent);
}
```

### Expand/Collapse

**Behavior:** Height/scale change with content fade
**Duration:** `--duration-slow` (300ms)
**Easing:** `--ease-apple`
**Properties:** `transform`, `opacity`

```css
.panel__content {
  transform-origin: top;
  transition:
    transform var(--duration-slow) var(--ease-apple),
    opacity var(--duration-fast) var(--ease-in-out);
}

.panel[aria-expanded="false"] .panel__content {
  transform: scaleY(0);
  opacity: 0;
  pointer-events: none;
}
```

### Slide In/Out

**Behavior:** Spatial motion entering or leaving viewport
**Duration:** `--duration-slow` (300ms)
**Easing:** `--ease-apple` (or `--ease-out` for in, `--ease-in` for out)
**Properties:** `transform`

```css
/* Slide in from right */
.panel {
  transform: translateX(0);
  transition: transform var(--duration-slow) var(--ease-out);
}

.panel[data-hidden="true"] {
  transform: translateX(100%);
  transition-timing-function: var(--ease-in);
}
```

### Fade In/Out

**Behavior:** Opacity change
**Duration:** `--duration-normal` (200ms)
**Easing:** `--ease-out` (in) / `--ease-in` (out)
**Properties:** `opacity`

```css
.modal {
  opacity: 1;
  transition: opacity var(--duration-normal) var(--ease-in);
}

.modal[data-visible="true"] {
  opacity: 1;
  transition-timing-function: var(--ease-out);
}
```

### Pop In

**Behavior:** Scale from small + fade in
**Duration:** `--duration-slow` (300ms)
**Easing:** `--ease-spring`
**Properties:** `transform`, `opacity`

```css
@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.notification {
  animation: popIn var(--duration-slow) var(--ease-spring);
}
```

### Hover Lift

**Behavior:** Subtle upward motion
**Duration:** `--duration-normal` (200ms)
**Easing:** `--ease-out`
**Properties:** `transform`, `box-shadow`

```css
.card {
  transition:
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### Drag

**Behavior:** Transform follows cursor with no easing
**Duration:** `--duration-instant` (or no transition)
**Easing:** None (direct manipulation)
**Properties:** `transform`

```css
.draggable {
  /* No transition during drag */
  transition: none;
}

.draggable[data-dragging="false"] {
  /* Re-enable transition for snap-back */
  transition: transform var(--duration-normal) var(--ease-apple);
}
```

---

## 4. Shell Behaviors

### Layout Constants

```css
/* packages/app/src/components/Shell/shell-layout.css */
--sidebar-width: 260px;
--toolbar-height: 48px;
--command-center-height: 64px;
--chat-window-width: 360px;
--shell-gap: 20px;
--panel-border-radius: 10px;
```

### Sidebar Collapse/Expand

**Behavior:** Width collapse with content fade
**Duration:** `--duration-slow` (300ms)
**Easing:** `--ease-apple`
**Properties:** `transform` (translateX), `opacity`

```css
.sidebar {
  width: var(--sidebar-width);
  transform: translateX(0);
  transition: transform var(--duration-slow) var(--ease-apple);
}

.sidebar[data-collapsed="true"] {
  transform: translateX(calc(-1 * var(--sidebar-width)));
}

.sidebar__content {
  opacity: 1;
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

.sidebar[data-collapsed="true"] .sidebar__content {
  opacity: 0;
}
```

### Chat Window Slide

**Behavior:** Slide in/out from right edge
**Duration:** `--duration-slow` (300ms)
**Easing:** `--ease-apple`
**Properties:** `transform` (translateX)

```css
.chat-window {
  width: var(--chat-window-width);
  transform: translateX(0);
  transition: transform var(--duration-slow) var(--ease-apple);
}

.chat-window[data-hidden="true"] {
  transform: translateX(calc(var(--chat-window-width) + var(--shell-gap)));
}
```

### Workbench Content Switch

**Behavior:** Cross-dissolve between workbench views
**Duration:** Exit 200ms → Enter 200ms
**Easing:** `--ease-in` (exit) → `--ease-out` (enter)
**Properties:** `opacity`

```css
.workbench__view {
  opacity: 1;
  transition: opacity var(--duration-normal) var(--ease-in);
}

.workbench__view[data-exiting="true"] {
  opacity: 0;
}

.workbench__view[data-entering="true"] {
  opacity: 0;
  transition-timing-function: var(--ease-out);
}

.workbench__view[data-active="true"] {
  opacity: 1;
}
```

### Command Center

**Behavior:** Static, no animation
**Properties:** None

The Command Center does not animate. It remains fixed at 64px height and responds to interactions without motion.

### Panel Independence Rule

Each panel in the workbench animates independently. When one panel collapses/expands, others maintain their state without cascading animations. Layout shifts are handled by CSS Grid/Flexbox without explicit animation.

---

## 5. Panel Behaviors

### Collapsible Panel

**Behavior:** Height animation with content fade stagger
**Duration:** `--duration-slow` (300ms)
**Easing:** `--ease-apple`
**Properties:** `max-height`, `opacity`, `padding`

```css
.panel__content {
  max-height: 1000px; /* Adjust to actual max */
  opacity: 1;
  padding: var(--spacing-md);
  overflow: hidden;
  transition:
    max-height var(--duration-slow) var(--ease-apple),
    opacity var(--duration-normal) var(--ease-in-out),
    padding var(--duration-slow) var(--ease-apple);
}

.panel[aria-expanded="false"] .panel__content {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
```

### Panel Appear

**Behavior:** Fade in + slide up from below
**Duration:** `--duration-slow` (300ms)
**Easing:** `--ease-out`
**Properties:** `opacity`, `transform`

```css
@keyframes panelAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel[data-appearing="true"] {
  animation: panelAppear var(--duration-slow) var(--ease-out);
}
```

### Panel Dismiss

**Behavior:** Fade out + slide down
**Duration:** `--duration-normal` (200ms)
**Easing:** `--ease-in`
**Properties:** `opacity`, `transform`

```css
@keyframes panelDismiss {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

.panel[data-dismissing="true"] {
  animation: panelDismiss var(--duration-normal) var(--ease-in);
}
```

### Panel Hover

**Behavior:** Subtle border glow
**Duration:** `--duration-fast` (150ms)
**Easing:** `--ease-in-out`
**Properties:** `border-color`, `box-shadow`

```css
.panel {
  border: 1px solid var(--color-border);
  transition:
    border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out);
}

.panel:hover {
  border-color: var(--color-accent-muted);
  box-shadow: 0 0 0 1px var(--color-accent-muted);
}
```

---

## 6. Glow System

### Activation Triggers

Glows activate on:
- Status changes (idle → active → error)
- Active states (focused input, selected panel)
- System events (new notification, agent spawn)
- User interactions (button press, toggle switch)

### Intensity Tiers

| Tier | Opacity | Use Case |
|------|---------|----------|
| Subtle | 0.4 | Idle state, ambient presence |
| Medium | 0.7 | Active state, hover feedback |
| Strong | 1.0 | Error state, critical alerts |

```css
.glow--subtle { opacity: 0.4; }
.glow--medium { opacity: 0.7; }
.glow--strong { opacity: 1.0; }
```

### Color Mapping

| State | Color Variable | Hex (GitHub Dark) | Use Case |
|-------|---------------|-------------------|----------|
| Info | `--color-glow-info` | `#58a6ff` | Neutral information, default state |
| Success | `--color-glow-success` | `#3fb950` | Completed, positive confirmation |
| Warning | `--color-glow-warning` | `#d29922` | Caution, review needed |
| Error | `--color-glow-error` | `#f85149` | Failure, critical issue |

### Pulse Timing

**Duration:** 2000ms (2s cycle)
**Easing:** `ease-in-out`
**Pattern:** Subtle brightness oscillation

```css
@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.glow {
  animation: glow-pulse 2s var(--ease-in-out) infinite;
}
```

### Glow Component Structure

```css
/* Base glow (always present) */
.glow {
  position: absolute;
  border-radius: inherit;
  filter: blur(12px);
  pointer-events: none;
  transition: opacity var(--duration-normal) var(--ease-in-out);
}

/* State-specific glows */
.glow--info { background-color: var(--color-glow-info); }
.glow--success { background-color: var(--color-glow-success); }
.glow--warning { background-color: var(--color-glow-warning); }
.glow--error { background-color: var(--color-glow-error); }

/* Pulse animation */
.glow--pulsing {
  animation: glow-pulse 2s var(--ease-in-out) infinite;
}
```

---

## 7. Agent Character Motion

**Inspiration:** Studio Ghibli natural movement (gentle, organic, non-mechanical)

### Idle State

**Float:** Gentle vertical bob
**Duration:** 3000ms cycle
**Easing:** `ease-in-out`

```css
@keyframes agent-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.agent-character[data-state="idle"] {
  animation: agent-float 3s ease-in-out infinite;
}
```

**Blink:** Periodic eye close/open
**Duration:** 150ms blink, 3-5s interval
**Easing:** `ease-in-out`

```css
@keyframes agent-blink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0; }
}

.agent-character__eyes {
  animation: agent-blink 150ms ease-in-out;
  /* Triggered via JS at random intervals */
}
```

**Sway:** Subtle horizontal drift
**Duration:** 4000ms cycle
**Easing:** `ease-in-out`

```css
@keyframes agent-sway {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  50% { transform: translateX(4px) rotate(2deg); }
}

.agent-character[data-state="idle"] {
  animation:
    agent-float 3s ease-in-out infinite,
    agent-sway 4s ease-in-out infinite;
}
```

### Active State

**Pulse:** Breathing effect (scale)
**Duration:** 1500ms cycle
**Easing:** `ease-in-out`

```css
@keyframes agent-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.agent-character[data-state="active"] {
  animation: agent-pulse 1.5s ease-in-out infinite;
}
```

**Brighter Aura:** Increased glow opacity
**Duration:** `--duration-normal` (200ms)
**Easing:** `--ease-in-out`

```css
.agent-character__aura {
  opacity: 0.4;
  transition: opacity var(--duration-normal) var(--ease-in-out);
}

.agent-character[data-state="active"] .agent-character__aura {
  opacity: 0.8;
}
```

### Error State

**Jolt:** Shake/tremble
**Duration:** 500ms (single play)
**Easing:** `ease-in-out`

```css
@keyframes agent-jolt {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px) rotate(-2deg); }
  75% { transform: translateX(4px) rotate(2deg); }
}

.agent-character[data-state="error"] {
  animation: agent-jolt 500ms ease-in-out;
}
```

**Red Aura:** Error glow
**Duration:** Instant
**Color:** `--color-glow-error`

```css
.agent-character[data-state="error"] .agent-character__aura {
  background-color: var(--color-glow-error);
  opacity: 1.0;
}
```

### Spawn Animation

**Behavior:** Scale from small + fade in
**Duration:** `--duration-slower` (400ms)
**Easing:** `--ease-spring`

```css
@keyframes agent-spawn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.agent-character[data-spawning="true"] {
  animation: agent-spawn var(--duration-slower) var(--ease-spring);
}
```

### Celebration

**Sparkle:** Particle burst effect
**Duration:** 800ms (single play)
**Easing:** `ease-out`

```css
@keyframes agent-sparkle {
  from {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  to {
    transform: scale(1.5) rotate(180deg);
    opacity: 0;
  }
}

.agent-character__sparkle {
  animation: agent-sparkle 800ms ease-out;
}
```

---

## 8. Choreography Rules

### Stagger Pattern

**Delay:** 50ms between sibling elements
**Use Case:** List items appearing, card grids, navigation items

```css
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
.list-item:nth-child(4) { animation-delay: 150ms; }
/* ... */

/* Or via JS */
element.style.animationDelay = `${index * 50}ms`;
```

### Sequence Rule

**Pattern:** Parent enters before children
**Implementation:** Parent animation completes, then children animate with stagger

```css
.panel {
  animation: panelAppear var(--duration-slow) var(--ease-out);
}

.panel__content {
  animation: fadeIn var(--duration-normal) var(--ease-out);
  animation-delay: calc(var(--duration-slow) + 50ms);
}
```

### Cross-Dissolve

**Pattern:** Old content fades out (fast), new content fades in (normal)
**Timing:** Exit completes before enter begins

```css
/* Old content */
.content[data-exiting="true"] {
  animation: fadeOut var(--duration-fast) var(--ease-in);
}

/* New content */
.content[data-entering="true"] {
  animation: fadeIn var(--duration-normal) var(--ease-out);
  animation-delay: var(--duration-fast);
}
```

### Page Transition

**Pattern:** Workbench exit (200ms) → Workbench enter (200ms)
**Total Duration:** 400ms

```css
.workbench__view--exiting {
  animation: fadeOut var(--duration-normal) var(--ease-in);
}

.workbench__view--entering {
  animation: fadeIn var(--duration-normal) var(--ease-out);
  animation-delay: var(--duration-normal);
}
```

---

## 9. Reduced Motion Policy

### Three-Tier System

| Tier | Definition | Treatment | Examples |
|------|------------|-----------|----------|
| **Essential** | Critical for usability and accessibility | KEEP (instant, no animation) | Progress bars, focus indicators, state changes, selection feedback |
| **Functional** | Useful feedback but not critical | SIMPLIFY (instant transitions) | Hover color change, panel collapse, tooltip appear |
| **Decorative** | Aesthetic enhancement only | REMOVE (disable entirely) | Agent float/sway, glow pulse, hover lift, sparkle effects |

### Implementation Strategy

**Base Approach:** Set all duration tokens to `0ms` in `@media (prefers-reduced-motion: reduce)`

```css
/* packages/app/src/styles/design-tokens.css */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 0ms;
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
    --duration-slower: 0ms;
    --duration-slowest: 0ms;
  }
}
```

**Component-Level Overrides:** Only needed where `0ms` breaks usability

```css
/* Essential: Progress bar must transition for readability */
@media (prefers-reduced-motion: reduce) {
  .progress-bar__fill {
    transition: width 100ms linear; /* Keep minimal transition */
  }
}

/* Decorative: Remove entirely */
@media (prefers-reduced-motion: reduce) {
  .agent-character {
    animation: none;
  }

  .glow--pulsing {
    animation: none;
    opacity: 0.4; /* Static opacity */
  }

  .card:hover {
    transform: none; /* Remove lift */
  }
}

/* Functional: Instant state change */
@media (prefers-reduced-motion: reduce) {
  .panel__content {
    transition: none;
  }

  .panel[aria-expanded="false"] .panel__content {
    display: none; /* Instant hide instead of animated collapse */
  }
}
```

### Categorization Reference

**Essential (KEEP)**
- Progress bar fill (`width` transition at 100ms linear)
- Focus ring appearance (instant, but visible)
- Selection state changes (instant)
- Active state feedback (instant)

**Functional (SIMPLIFY)**
- Hover state color changes (instant)
- Panel expand/collapse (instant display toggle)
- Tooltip/popover appearance (instant)
- Sidebar collapse (instant hide)
- Chat window slide (instant hide)
- Tab switching (instant content swap)

**Decorative (REMOVE)**
- Agent character: float, sway, blink, pulse, sparkle
- Glow pulse animations
- Hover lift effects (`translateY`)
- Pop-in scale effects
- Ambient background animations
- Celebration animations

---

## 10. Remediation Checklist

### Hardcoded Values to Replace

#### `packages/app/src/components/Shell/WorkbenchLayout.css`
```css
/* BEFORE */
transition: opacity 0.2s ease-in-out;
transition: opacity 200ms ease-in-out;
transition: background-color 300ms ease;

/* AFTER */
transition: opacity var(--duration-normal) var(--ease-in-out);
transition: opacity var(--duration-normal) var(--ease-in-out);
transition: background-color var(--duration-slow) var(--ease-in-out);
```

#### `packages/app/src/components/Shell/sidebar.css`
```css
/* BEFORE */
transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);

/* AFTER */
transition: transform var(--duration-slow) var(--ease-apple),
            opacity var(--duration-normal) var(--ease-in-out);
/* Note: Replace 'all' with specific properties */
```

#### `packages/app/src/components/Glow/glow.css`
```css
/* BEFORE */
animation: glow-pulse 2s ease-in-out infinite;
transition: opacity 300ms ease-in-out;

/* AFTER */
animation: glow-pulse 2s var(--ease-in-out) infinite;
transition: opacity var(--duration-slow) var(--ease-in-out);
```

#### `packages/app/src/components/AgentSquad/SquadPanel.css`
```css
/* BEFORE */
/* Missing explicit timing - relies on CSS defaults or inline styles */
transform: scale(1.05);

/* AFTER */
.agent-card {
  transition: transform var(--duration-normal) var(--ease-out);
}

.agent-card:hover {
  transform: scale(1.05);
}
```

#### Easing Curve Duplicates

**Files with duplicate easing definitions:**
- `sidebar.css`: `cubic-bezier(0.4, 0, 0.2, 1)` → `var(--ease-in-out)`
- `WorkbenchLayout.css`: `ease-in-out`, `ease` → `var(--ease-in-out)`
- Various component files: Replace inline beziers with tokens

### Missing Specifications

**Chat Window Slide:**
Currently undocumented. Implement as:

```css
.chat-window {
  transform: translateX(0);
  transition: transform var(--duration-slow) var(--ease-apple);
}

.chat-window[data-hidden="true"] {
  transform: translateX(calc(var(--chat-window-width) + var(--shell-gap)));
}
```

**SquadPanel Animations:**
Add explicit timing:

```css
.agent-card {
  transition:
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.agent-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.agent-card__progress-fill {
  transition: width var(--duration-normal) var(--ease-linear);
}
```

---

## Usage Guidelines

### For Component Developers

1. **Always reference tokens, never hardcode values**
   - Use `var(--duration-*)` for timing
   - Use `var(--ease-*)` for easing
   - Use `var(--transition-*)` presets when applicable

2. **Choose the right duration:**
   - User-triggered? → `--duration-fast` or `--duration-normal`
   - System-triggered? → `--duration-slow` or slower
   - Micro-interaction? → `--duration-instant`

3. **Choose the right easing:**
   - Spatial motion (transform)? → `--ease-apple`
   - Color/opacity change? → `--ease-in-out`
   - Enter animation? → `--ease-out`
   - Exit animation? → `--ease-in`

4. **Animate only GPU-accelerated properties:**
   - Prefer `transform` and `opacity`
   - Avoid `width`, `height`, `top`, `left`
   - Exception: Progress bars, explicit layout changes

5. **Test with reduced motion:**
   - Verify animations disable cleanly
   - Ensure functionality remains intact
   - Check that essential feedback is preserved

### For Reviewers

**Checklist:**
- [ ] No hardcoded duration values (ms, s)
- [ ] No hardcoded easing curves (cubic-bezier, ease)
- [ ] GPU-accelerated properties used (transform, opacity)
- [ ] Reduced motion behavior defined
- [ ] Animation tier justified (essential/functional/decorative)
- [ ] Timing and easing match pattern from this spec

---

## Changelog

### Version 1.0 (2026-02-21)
- Initial specification
- Unified 32 existing keyframe animations
- Defined 7 duration tokens and 7 easing tokens
- Documented 11 interaction patterns
- Specified shell, panel, glow, and agent behaviors
- Established three-tier reduced motion policy
- Created remediation checklist for existing hardcoded values
