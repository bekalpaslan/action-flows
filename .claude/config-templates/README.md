# Claude Code Provider Configuration Templates

Manual setup instructions for switching between Anthropic and Ollama.

---

## Automated Setup (Recommended)

Use the toggle script via pnpm:

```bash
# Switch to Ollama (local models)
pnpm provider:ollama

# Switch to Anthropic (cloud API)
pnpm provider:anthropic

# Check current provider
pnpm provider:status

# Restore from backup
pnpm provider:restore
```

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

### Switch to Ollama

1. **Ensure Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

   If not running, start it:
   ```bash
   # Linux
   systemctl start ollama

   # macOS
   brew services start ollama

   # Manual
   ollama serve
   ```

2. **Pull models:**
   ```bash
   # Recommended default
   ollama pull qwen2.5-coder:7b

   # Alternative models
   ollama pull gemma3:4b          # Faster, smaller
   ollama pull qwen2.5-coder:32b  # Slower, higher quality
   ```

3. **Copy templates:**
   ```bash
   cp .claude/config-templates/config.ollama.json ~/.claude/config.json
   cp .claude/config-templates/settings.ollama.json ~/.claude/settings.json
   ```

4. **Verify:**
   ```bash
   cat ~/.claude/settings.json | grep model
   # Should show: "model": "qwen2.5-coder:7b"
   ```

---

## Customization

### Change Ollama Model

Edit `settings.ollama.json` and change the model field:

```json
{
  "model": "gemma3:4b"
}
```

Available models:
- `gemma3:4b` - Fast, good for quick iterations (2.5GB)
- `qwen2.5-coder:7b` - Balanced performance (4.7GB, default)
- `qwen2.5-coder:32b` - High quality, slow (19GB)

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

### Ollama Not Running

**Error:** `Ollama is not running`

**Fix:**
```bash
# Check if Ollama is installed
which ollama

# Start Ollama
ollama serve

# Verify
curl http://localhost:11434/api/tags
```

### No Models Found

**Error:** `Ollama running but no models found`

**Fix:**
```bash
# Pull a model
ollama pull qwen2.5-coder:7b

# Verify
ollama list
```

### Invalid JSON

**Error:** `Invalid JSON in config.json`

**Fix:**
```bash
# Restore from backup
pnpm provider:restore

# Or manually restore
cp ~/.claude/config.backup.YYYYMMDD-HHMMSS.json ~/.claude/config.json
```

### Missing API Key

**Warning:** `No existing API key found`

**Fix:**
Manually edit `~/.claude/config.json`:
```json
{
  "primaryApiKey": "sk-ant-api03-YOUR-KEY-HERE"
}
```

---

## Backups

The toggle script automatically creates timestamped backups:

```
~/.claude/config.backup.20260214-120000.json
~/.claude/config.backup.20260214-130000.json
...
```

Only the last 5 backups are kept. Older backups are automatically deleted.

---

## For More Information

See comprehensive guide: `docs/guides/PROVIDER_TOGGLE.md`
