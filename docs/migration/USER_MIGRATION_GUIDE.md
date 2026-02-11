# Living Universe User Migration Guide

Welcome to the Living Universe! This guide helps you navigate the new cosmic map interface for ActionFlows Dashboard.

---

## What is the Cosmic Map?

The **Cosmic Map** is a living, visual representation of your ActionFlows universe. Instead of navigating through traditional menus and sidebars, you explore **regions** (workbench areas) as stars in a cosmic landscape.

Key concepts:
- **Regions** = Workbench areas (Work, Settings, Logs, etc.) represented as stars
- **Light Bridges** = Connections between related regions
- **Fog of War** = Hidden regions that reveal as you interact
- **Command Center** = Bottom input bar for natural language commands

---

## Navigation

### God View (Default)
When you first open the dashboard, you see the full cosmic map with all visible regions.

**Controls:**
- **Click** a region star to zoom in
- **Escape** key to return to god view
- **Mouse wheel** to zoom manually
- **Click and drag** to pan the map

### Region Focus View
After clicking a region star, the map zooms and fades to reveal the workbench content.

**Controls:**
- **Escape** to return to cosmic map
- **God View button** (top-right) to return immediately

### Keyboard Shortcuts
- `Escape` — Return to god view
- `Tab` — Navigate between region stars
- `Enter` — Zoom into focused region
- `Ctrl+K` — Open command palette (if enabled)

---

## First-Time Experience

### Onboarding (3 Steps)
On your first visit, you'll see a guided tour:
1. **Welcome** — Introduction to the universe
2. **Command Center** — How to interact
3. **Discovery** — Hidden regions

**Skip anytime:**
- Click **Skip** button
- Press **Escape** key
- Click the overlay background

**Replay onboarding:**
- Go to **Settings → General → Reset Onboarding**

### Big Bang Animation
The first time you open the cosmic map, a 3-second Big Bang animation plays to show the universe's creation.

**Skip anytime:**
- Click **Skip** button (appears after 1 second)

---

## Switching to Classic Mode

If you prefer the traditional sidebar interface:

1. Open **Settings** (click the Settings region star)
2. Navigate to **Feature Flags** tab
3. Toggle **Cosmic Map Enabled** to OFF
4. Reload the page

This will restore the classic workbench sidebar.

---

## Command Center

The **Command Center** is a bottom input bar for natural language commands.

**Example commands:**
- "Show me the logs from yesterday"
- "Create a new session"
- "Run the health check"

**Status indicators:**
- Green pulse = Universe healthy
- Yellow pulse = Degraded performance
- Red pulse = Critical error

---

## Feature Flags

Control which Living Universe features are active:

| Flag | Description | Default |
|------|-------------|---------|
| Cosmic Map Enabled | Show/hide cosmic map interface | ✅ ON |
| Command Center Enabled | Show/hide bottom command bar | ✅ ON |
| Spark Animation Enabled | Show/hide data flow sparks | ✅ ON |
| Evolution Enabled | Auto-evolve hidden regions | ✅ ON |

**Access:** Settings → Feature Flags

---

## Troubleshooting

### Cosmic Map Not Visible
1. Check **Settings → Feature Flags → Cosmic Map Enabled**
2. Verify your browser supports WebGL (required for animations)
3. Check console for errors (F12)

### Animations Slow or Laggy
1. Open **Settings → Performance**
2. Check **Reduced Motion** status
3. If browser prefers reduced motion, animations are disabled
4. Toggle **Spark Animation Enabled** OFF if needed

### Onboarding Won't Dismiss
1. Check browser console for localStorage errors
2. Try **Settings → Advanced → Clear Local Storage**
3. Reload the page

### Region Star Not Clickable
1. Verify the region is not in "faint" fog state
2. Some regions require evolution to unlock
3. Check **Settings → Feature Flags → Evolution Enabled**

---

## Screenshots

### Cosmic Map Overview
[Screenshot placeholder — capture cosmic map in god view]

### Feature Flags Settings
[Screenshot placeholder — capture Settings → Feature Flags tab]

### Onboarding Flow
[Screenshot placeholder — capture 3-step tooltip sequence]

---

## FAQ

**Q: Can I use both cosmic map and sidebar?**
A: Not simultaneously. Toggle via Feature Flags.

**Q: Will my session data persist?**
A: Yes! Cosmic map is just a new visualization layer. All data persists as before.

**Q: Can I customize region positions?**
A: Not yet. Region layout is auto-generated based on the Living Universe schema.

**Q: How do I unlock hidden regions?**
A: Interact with the universe (run flows, create sessions). Evolution triggers automatically.

**Q: What if I have motion sensitivity?**
A: Enable **Reduced Motion** in your OS settings. Animations will auto-disable.

---

## Feedback

Found a bug or have a suggestion? Open an issue on GitHub or use the **DiscussButton** in Settings.

---

**Next Steps:**
- Read [Developer Guide](./DEVELOPER_GUIDE.md) for customization
- See [Rollout Strategy](./ROLLOUT_STRATEGY.md) for deployment plan
