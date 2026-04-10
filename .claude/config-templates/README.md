# Claude Code Configuration Templates

Manual setup instructions for configuring Anthropic as your Claude Code provider.

---

## Manual Setup

### Switch to Anthropic

1. **Copy templates:**
   ```bash
   cp .claude/config-templates/config.anthropic.json ~/.claude/config.json
   cp .claude/config-templates/settings.anthropic.json ~/.claude/settings.json
   ```

2. **Edit config:**
   Open `~/.claude/config.json` and replace `YOUR_ANTHROPIC_API_KEY_HERE` with your actual Anthropic API key.

3. **Verify:**
   ```bash
   cat ~/.claude/settings.json | grep model
   # Should show: "model": "sonnet"
   ```

---

## Customization

### Change Anthropic Model

Edit `settings.anthropic.json`:

```json
{
  "model": "sonnet"
}
```

Available models:
- `sonnet` - Claude Sonnet (default, balanced)
- `opus` - Claude Opus (highest quality, slower)
- `haiku` - Claude Haiku (fastest, cheaper)

---

## Troubleshooting

### Missing API Key

**Warning:** `No existing API key found`

**Fix:**
Manually edit `~/.claude/config.json`:
```json
{
  "primaryApiKey": "sk-ant-api03-YOUR-KEY-HERE"
}
```

### Invalid JSON

**Error:** `Invalid JSON in config.json`

**Fix:**
Restore from a backup copy of your original `~/.claude/config.json`.
