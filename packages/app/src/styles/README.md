# ActionFlows Dashboard — Style System

## Overview

The ActionFlows Dashboard uses an Apple-inspired design token system that provides a comprehensive set of CSS custom properties for building consistent, beautiful interfaces with a dark mode focus.

## Files

- **`design-tokens.css`** — Complete design token system (foundation)
- **`design-tokens-guide.css`** — Usage examples and best practices (reference only)
- **`themes/index.css`** — Theme system entry point
- **`themes/dark.css`** — Dark theme with backward compatibility mappings
- **`themes/light.css`** — Light theme definitions

## Quick Start

### Import Order

The design tokens are automatically imported via the theme system:

```tsx
// In App.tsx
import './styles/themes/index.css';
```

This imports:
1. `design-tokens.css` (foundation)
2. `dark.css` (dark theme)
3. `light.css` (light theme)

### Basic Usage

```css
/* Panel with Apple styling */
.my-panel {
  background: var(--panel-bg-base);
  border: var(--panel-border-default);
  border-radius: var(--panel-radius-md);
  box-shadow: var(--panel-glow-default);
  padding: var(--space-6);
}

/* Primary button */
.my-button {
  background: var(--btn-bg-primary);
  color: var(--btn-text-primary);
  border-radius: var(--btn-radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
  transition: var(--transition-colors);
}

.my-button:hover {
  background: var(--btn-hover-primary);
  box-shadow: var(--btn-glow-hover);
}

/* Input field */
.my-input {
  background: var(--input-bg-default);
  border: var(--input-border-default);
  border-radius: var(--input-radius-md);
  padding: var(--space-2) var(--space-3);
  color: var(--input-text-color);
}

.my-input:focus {
  border: var(--input-border-focus);
  box-shadow: var(--input-glow-focus);
}
```

## Token Categories

### 🎨 Colors

- **Base Colors**: `--app-bg-primary`, `--app-bg-secondary`, `--app-bg-tertiary`
- **Text Colors**: `--text-primary`, `--text-secondary`, `--text-tertiary`
- **System Colors**: `--system-blue`, `--system-purple`, `--system-red`, etc.
- **Fill Colors**: `--fill-primary`, `--fill-secondary`, `--fill-tertiary`

### 📦 Panel Tokens

- **Backgrounds**: `--panel-bg-base`, `--panel-bg-elevated`, `--panel-bg-raised`
- **Borders**: `--panel-border-default`, `--panel-border-subtle`, `--panel-border-strong`
- **Radius**: `--panel-radius-sm/md/lg/xl`
- **Glows**: `--panel-glow-default`, `--panel-glow-accent`, `--panel-glow-hover`

### 🔘 Button Tokens

- **Backgrounds**: `--btn-bg-primary/secondary/tertiary/danger`
- **Hover**: `--btn-hover-primary/secondary/tertiary/danger`
- **Borders**: `--btn-border-default`, `--btn-border-focus`
- **Radius**: `--btn-radius-sm/md/lg/pill`
- **Glows**: `--btn-glow-default`, `--btn-glow-hover`, `--btn-glow-focus`

### 📝 Input Tokens

- **Backgrounds**: `--input-bg-default/hover/focus/disabled`
- **Borders**: `--input-border-default/hover/focus/error`
- **Radius**: `--input-radius-sm/md/lg`
- **Glows**: `--input-glow-default`, `--input-glow-focus`, `--input-glow-error`

### 🧊 Glass Effect Tokens

- **Backgrounds**: `--glass-bg-light/medium/dark`
- **Blur**: `--glass-blur-sm/md/lg/xl`
- **Borders**: `--glass-border-default/subtle/strong`

### ✨ Glow Tokens

- **Colors**: `--glow-color-default/accent/success/warning/error/purple`
- **Spread**: `--glow-spread-sm/md/lg/xl`

### 📏 Spacing Scale (4px base)

- `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px)
- `--space-6` (24px), `--space-8` (32px), `--space-12` (48px), etc.

### 🔤 Typography

- **Sizes**: `--text-xs` through `--text-6xl`
- **Weights**: `--font-light/normal/medium/semibold/bold`
- **Line Heights**: `--leading-tight/normal/relaxed`
- **Families**: `--font-sans`, `--font-mono`

### ⏱️ Transitions & Animations

- **Duration**: `--duration-fast/normal/slow`
- **Easing**: `--ease-in-out`, `--ease-apple`
- **Common**: `--transition-colors`, `--transition-opacity`, `--transition-transform`

### 🎚️ Z-Index Scale

- `--z-dropdown` (1000)
- `--z-modal` (1400)
- `--z-tooltip` (1600)
- `--z-notification` (1700)

## Design Principles

### 1. Layered Depth

Use semi-transparent backgrounds to create depth:

```css
.surface-level-1 { background: var(--panel-bg-base); }      /* 95% opacity */
.surface-level-2 { background: var(--panel-bg-elevated); }  /* 92% opacity */
.surface-level-3 { background: var(--panel-bg-raised); }    /* 90% opacity */
```

### 2. Subtle Borders & Glows

Combine thin borders with gentle glows:

```css
.element {
  border: var(--panel-border-default);  /* 1px, 6% white */
  box-shadow: var(--panel-glow-default); /* Subtle 3px glow */
}
```

### 3. Frosted Glass

Apply backdrop blur for premium feel:

```css
.glass-panel {
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-md);
  -webkit-backdrop-filter: var(--glass-blur-md); /* Safari */
  border: var(--glass-border-default);
}
```

### 4. Consistent Spacing

Use the 4px-based spacing scale:

```css
.component {
  padding: var(--space-4);        /* 16px */
  gap: var(--space-3);            /* 12px */
  margin-bottom: var(--space-6);  /* 24px */
}
```

### 5. Apple-Style Radius

Use the predefined radius scale:

```css
.small-element { border-radius: var(--radius-sm); }    /* 6px */
.button { border-radius: var(--btn-radius-md); }       /* 8px */
.panel { border-radius: var(--panel-radius-md); }      /* 10px */
.modal { border-radius: var(--panel-radius-xl); }      /* 18px */
```

## Backward Compatibility

Existing components using legacy tokens still work:

```css
/* Old (still works) */
.legacy {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

/* New (recommended) */
.modern {
  background: var(--panel-bg-base);
  border: var(--panel-border-default);
  color: var(--text-primary);
}
```

## Common Patterns

### Panel with Header

```css
.panel {
  background: var(--panel-bg-base);
  border: var(--panel-border-default);
  border-radius: var(--panel-radius-md);
  overflow: hidden;
}

.panel__header {
  background: var(--panel-header-bg);
  border-bottom: var(--panel-header-border);
  padding: var(--space-4) var(--space-6);
  font-weight: var(--font-semibold);
}

.panel__body {
  padding: var(--space-6);
}
```

### Interactive Card

```css
.card {
  background: var(--panel-bg-base);
  border: var(--panel-border-default);
  border-radius: var(--panel-radius-md);
  box-shadow: var(--panel-glow-default);
  transition: var(--transition-all);
  cursor: pointer;
}

.card:hover {
  background: var(--panel-bg-elevated);
  box-shadow: var(--panel-glow-hover);
  transform: translateY(-2px);
}
```

### Status Badge

```css
.badge-success {
  background: var(--status-success-bg);
  color: var(--status-success-text);
  border: 1px solid var(--status-success-border);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}
```

### Modal

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: var(--glass-blur-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
}

.modal {
  background: var(--panel-bg-elevated);
  border: var(--panel-border-strong);
  border-radius: var(--panel-radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 600px;
  width: 90%;
}
```

## Reference Files

See `design-tokens-guide.css` for comprehensive examples of:
- Panel styling variations
- Button states and sizes
- Input field patterns
- Navigation components
- Status indicators
- Card layouts
- Modal structures
- Typography utilities
- Glow effects

## Color Reference

### Apple System Colors

| Token | Color | Usage |
|-------|-------|-------|
| `--system-blue` | #0a84ff | Primary actions, links |
| `--system-purple` | #bf5af2 | Accent, highlights |
| `--system-red` | #ff453a | Errors, destructive |
| `--system-orange` | #ff9f0a | Warnings |
| `--system-green` | #32d74b | Success states |
| `--system-yellow` | #ffd60a | Cautions |
| `--system-pink` | #ff375f | Special highlights |
| `--system-teal` | #64d2ff | Info states |

### Background Hierarchy

| Token | Color | Opacity | Usage |
|-------|-------|---------|-------|
| `--app-bg-base` | #000000 | 100% | Foundation |
| `--app-bg-primary` | #1c1c1e | 100% | Main app bg |
| `--app-bg-secondary` | #2c2c2e | 100% | Surfaces |
| `--app-bg-tertiary` | #3a3a3c | 100% | Elevated |
| `--panel-bg-base` | #1c1c1e | 95% | Standard panels |
| `--panel-bg-elevated` | #2c2c2e | 92% | Raised panels |

## Tips & Best Practices

1. **Always use tokens** — Never hard-code colors, spacing, or sizing
2. **Layer with transparency** — Use semi-opaque backgrounds for depth
3. **Thin borders + glows** — Combine for Apple-style definition
4. **Test glass effects** — Backdrop blur is expensive, use sparingly
5. **Consistent transitions** — Use token durations and easing
6. **Accessible contrast** — Ensure text meets WCAG standards
7. **Touch targets** — Minimum 44x44px for mobile
8. **Focus indicators** — Always provide clear focus states

## Migration Guide

When updating existing components:

1. Replace hard-coded colors with token equivalents
2. Use spacing scale instead of arbitrary values
3. Apply radius tokens for all border-radius
4. Add subtle glows to borders
5. Use transition tokens for consistency
6. Update typography to use scale

## Questions?

Check `design-tokens-guide.css` for detailed examples or refer to the complete token definitions in `design-tokens.css`.
