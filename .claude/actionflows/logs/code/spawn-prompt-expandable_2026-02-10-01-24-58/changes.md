# Code Changes: spawn-prompt-expandable

## Files Modified

| File | Change |
|------|--------|
| `packages/app/src/hooks/useChatMessages.ts` | Added three new metadata fields (`toolUseId`, `toolInput`, `spawnPrompt`) to ChatMessage interface and updated event handler mappings to pass these fields through from backend events |
| `packages/app/src/components/SessionPanel/ChatPanel.tsx` | Added expandable spawn prompt section with state management (expandedSpawnPrompts Set), toggle handler, and UI rendering within message bubbles |
| `packages/app/src/components/SessionPanel/ChatPanel.css` | Added BEM-style CSS classes for spawn prompt expandable section with collapsible header, arrow icon, and code block styling |

## Files Created

None. All changes were edits to existing files.

## Implementation Details

### 1. Type Synchronization (useChatMessages.ts)
- **Updated ChatMessage interface** (lines 15-29) to include:
  - `toolUseId?: string`
  - `toolInput?: unknown`
  - `spawnPrompt?: string`
- **Updated chat:message event handler** (lines 85-106) to map new fields from backend events
- **Updated chat:history event handler** (lines 131-152) to map new fields from backend events

### 2. State Management (ChatPanel.tsx)
- **Added state** for tracking expanded spawn prompts: `const [expandedSpawnPrompts, setExpandedSpawnPrompts] = useState<Set<string>>(new Set());`
- **Added toggle handler** `toggleSpawnPrompt(msgId: string)` to add/remove message IDs from the Set
- **Positioned after** `handleCopyId` callback

### 3. UI Component (ChatPanel.tsx)
- **Inserted expandable section** in `renderMessage()` function between tool badge and message content
- **Conditional rendering** - Only shows when `isToolUse && msg.metadata?.spawnPrompt` exists
- **Structure:**
  - Collapsible header button with ▶/▼ arrow icon
  - "Spawn Prompt" label
  - Code block (`<pre><code>`) with spawn prompt content when expanded
- **Accessibility:**
  - `aria-expanded` attribute on header button
  - `aria-controls` linking header to content
  - `aria-label` for screen readers

### 4. CSS Styling (ChatPanel.css)
- **Added BEM classes** following existing convention:
  - `.chat-bubble__spawn-prompt` - Container
  - `.chat-bubble__spawn-prompt-header` - Clickable header button
  - `.chat-bubble__spawn-prompt-icon` - ▶/▼ arrow
  - `.chat-bubble__spawn-prompt-label` - "Spawn Prompt" label
  - `.chat-bubble__spawn-prompt-content` - Code block content
- **Styling patterns:**
  - Header uses `var(--panel-bg-elevated)` with hover effect
  - Code block uses `var(--font-mono)`, `var(--app-bg-primary)` background
  - Border and padding consistent with existing widget patterns
  - Smooth transitions on hover

## Verification

- **Type check:** PASS (no new TypeScript errors introduced)
- **Pattern consistency:** Uses DossierView collapsible pattern as reference
- **CSS convention:** Follows BEM naming convention established in ChatPanel
- **Accessibility:** Includes ARIA attributes for screen readers
- **Design tokens:** Uses existing CSS variables for consistent theming

## Notes

Pre-existing TypeScript errors in packages/app are unrelated to these changes. The implementation successfully:
1. Syncs frontend types with shared package metadata fields
2. Adds expandable UI for spawn prompts on tool_use messages
3. Follows established patterns (DossierView collapsible, widgets code block)
4. Uses BEM CSS naming convention
5. Includes proper accessibility attributes
