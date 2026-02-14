# Provider Toggle Guide

Complete guide for switching between Anthropic API and Ollama local models in ActionFlows Dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Configuration](#configuration)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Topics](#advanced-topics)
7. [FAQ](#faq)

---

## 1. Overview

### What is Provider Toggling?

Provider toggling allows you to switch the AI provider used by Claude Code between:

- **Anthropic API** (Cloud) - Claude Sonnet/Opus/Haiku models via API
- **Ollama** (Local) - Open-source models running on your machine

### Use Cases

**Use Anthropic API when:**
- You need the highest quality responses (Claude Opus)
- You have reliable internet connection
- You're working on critical production code
- Cost is not a primary concern

**Use Ollama when:**
- You're offline or have unreliable internet
- You want zero API costs
- You're experimenting with rapid iterations
- You prefer privacy (data stays on your machine)

### Tradeoffs

| Aspect | Anthropic API | Ollama |
|--------|--------------|--------|
| **Quality** | Highest (Claude Opus 4.6) | Good (model-dependent) |
| **Speed** | Fast (2-5s cloud latency) | Slower (30s-2min local) |
| **Cost** | Pay-per-use ($) | Free after setup |
| **Privacy** | Data sent to Anthropic | Data stays local |
| **Internet** | Required | Not required |
| **Setup** | API key only | Install + pull models |
| **Disk Space** | None | 5-20GB |

---

## 2. Installation

### Installing Ollama

#### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verify installation:
```bash
ollama --version
# Example: ollama version is 0.1.32
```

#### macOS

```bash
# Option 1: Homebrew
brew install ollama

# Option 2: Download installer
# Visit https://ollama.com and download the .dmg
```

Verify installation:
```bash
ollama --version
```

#### Windows

1. Download installer from [https://ollama.com](https://ollama.com)
2. Run the `.exe` installer
3. Verify installation:
   ```powershell
   ollama --version
   ```

### Starting Ollama

#### Linux (systemd)

```bash
# Start Ollama service
systemctl start ollama

# Enable auto-start on boot
systemctl enable ollama

# Check status
systemctl status ollama
```

#### macOS

```bash
# Start Ollama service
brew services start ollama

# Or run manually
ollama serve
```

#### Windows

Ollama starts automatically after installation. To start manually:

```powershell
ollama serve
```

### Pulling Models

After Ollama is running, pull the recommended model:

```bash
# Default model (balanced)
ollama pull qwen2.5-coder:7b

# Verify model is available
ollama list
```

**Available models:**

```bash
# Fast, smaller model
ollama pull gemma3:4b

# Default, balanced
ollama pull qwen2.5-coder:7b

# Slow, high quality
ollama pull qwen2.5-coder:32b
```

### Setting Up Anthropic API

1. **Get API key** from [https://console.anthropic.com](https://console.anthropic.com)

2. **Add to config**:
   ```bash
   # Edit config
   nano ~/.claude/config.json
   ```

   Add your key:
   ```json
   {
     "primaryApiKey": "sk-ant-api03-YOUR-KEY-HERE"
   }
   ```

3. **Verify**:
   ```bash
   cat ~/.claude/config.json | grep primaryApiKey
   ```

---

## 3. Usage

### Quick Commands

All commands use pnpm scripts:

```bash
# Check current provider
pnpm provider:status

# Switch to Ollama
pnpm provider:ollama

# Switch to Anthropic
pnpm provider:anthropic

# Restore from backup
pnpm provider:restore
```

### Detailed Workflow

#### Switching to Ollama

1. **Verify Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

   Expected output:
   ```json
   {"models":[{"name":"qwen2.5-coder:7b",...}]}
   ```

2. **Run toggle command:**
   ```bash
   pnpm provider:ollama
   ```

   Expected output:
   ```
   ℹ️  Switching to Ollama (local)...

   ℹ️  Checking Ollama...
   ✅ Ollama is running
   ℹ️  Available models:
       qwen2.5-coder:7b

   ℹ️  Backup created: config.backup.20260214-120000.json
   ✅ Switched to Ollama
   ℹ️  Model: qwen2.5-coder:7b
   ```

3. **Verify switch:**
   ```bash
   pnpm provider:status
   ```

   Expected output:
   ```
   Current Configuration:
     Provider: ollama
     Model:    qwen2.5-coder:7b
   ```

#### Switching to Anthropic

1. **Run toggle command:**
   ```bash
   pnpm provider:anthropic
   ```

   Expected output:
   ```
   ℹ️  Switching to Anthropic API...

   ℹ️  Backup created: config.backup.20260214-130000.json
   ℹ️  Preserved existing API key
   ✅ Switched to Anthropic API
   ℹ️  Model: sonnet
   ```

2. **Verify switch:**
   ```bash
   pnpm provider:status
   ```

   Expected output:
   ```
   Current Configuration:
     Provider: anthropic
     Model:    sonnet
   ```

#### Restoring from Backup

If something goes wrong:

```bash
pnpm provider:restore
```

This restores the most recent backup (timestamped automatically).

---

## 4. Configuration

### Customizing Templates

Templates are located in `.claude/config-templates/`.

#### Change Default Ollama Model

Edit `.claude/config-templates/settings.ollama.json`:

```json
{
  "model": "gemma3:4b"
}
```

Now `pnpm provider:ollama` will use `gemma3:4b` instead of `qwen2.5-coder:7b`.

#### Change Default Anthropic Model

Edit `.claude/config-templates/settings.anthropic.json`:

```json
{
  "model": "opus"
}
```

Available Anthropic models:
- `sonnet` - Claude Sonnet (default, balanced)
- `opus` - Claude Opus (highest quality, slower)
- `haiku` - Claude Haiku (fastest, cheapest)

### Model Selection Guide

#### Ollama Models

| Model | Size | RAM | Speed | Quality | Use Case |
|-------|------|-----|-------|---------|----------|
| `gemma3:4b` | 2.5GB | 6GB | ~18s | Good | Quick iterations, learning |
| `qwen2.5-coder:7b` | 4.7GB | 8GB | ~45s | Very Good | General development |
| `qwen2.5-coder:32b` | 19GB | 24GB | >2min | Excellent | Critical reviews, production |

#### Anthropic Models

| Model | Cost (per 1M tokens) | Speed | Quality | Use Case |
|-------|---------------------|-------|---------|----------|
| Haiku | ~$0.25 | Fast | Good | Quick iterations |
| Sonnet | ~$3 | Medium | Very Good | General development |
| Opus | ~$15 | Slow | Excellent | Production code, complex tasks |

### Advanced Configuration

#### Preserve Additional Settings

The toggle script only modifies `model` in `settings.json`. Other settings are preserved:

```json
{
  "model": "qwen2.5-coder:7b",  // Changed by toggle
  "hooks": {                     // Preserved
    "enabled": true
  },
  "workspace": "~/projects"      // Preserved
}
```

#### Custom Ollama Base URL

If Ollama runs on a different port or host:

Edit `.claude/config-templates/config.ollama.json`:

```json
{
  "baseURL": "http://192.168.1.100:11434",
  "provider": "ollama"
}
```

---

## 5. Troubleshooting

### Ollama Not Running

**Error:**
```
❌ Error: Ollama is not running
```

**Diagnosis:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check Ollama process
ps aux | grep ollama
```

**Fix:**
```bash
# Linux
systemctl start ollama

# macOS
brew services start ollama

# Manual
ollama serve
```

### No Models Found

**Error:**
```
⚠️  Warning: Ollama running but no models found
```

**Diagnosis:**
```bash
ollama list
```

**Fix:**
```bash
# Pull a model
ollama pull qwen2.5-coder:7b

# Verify
ollama list
```

### Invalid JSON in Config

**Error:**
```
❌ Error: Invalid JSON in config.json
```

**Diagnosis:**
```bash
# Validate JSON manually
jq empty ~/.claude/config.json
```

**Fix:**
```bash
# Restore from backup
pnpm provider:restore

# Or manually restore
ls -t ~/.claude/config.backup.*.json | head -1
cp ~/.claude/config.backup.YYYYMMDD-HHMMSS.json ~/.claude/config.json
```

### Missing API Key

**Warning:**
```
⚠️  Warning: No existing API key found
You'll need to manually add your Anthropic API key to:
  ~/.claude/config.json
```

**Fix:**

Edit `~/.claude/config.json` and add your key:

```json
{
  "primaryApiKey": "sk-ant-api03-YOUR-KEY-HERE"
}
```

### Template Not Found

**Error:**
```
❌ Error: Template not found: .claude/config-templates/config.ollama.json
```

**Fix:**

Restore templates from git:

```bash
git checkout .claude/config-templates/
```

### Permission Denied

**Error:**
```
bash: ./scripts/toggle-provider.sh: Permission denied
```

**Fix:**

Make script executable:

```bash
chmod +x scripts/toggle-provider.sh
```

### Ollama Port Conflict

**Error:**
```
Error: bind: address already in use
```

**Diagnosis:**
```bash
lsof -i :11434  # macOS/Linux
netstat -ano | findstr :11434  # Windows
```

**Fix:**

Kill the process using port 11434 or change Ollama port:

```bash
# Change Ollama port
OLLAMA_HOST=0.0.0.0:11435 ollama serve
```

Then update `.claude/config-templates/config.ollama.json`:

```json
{
  "baseURL": "http://localhost:11435",
  "provider": "ollama"
}
```

---

## 6. Advanced Topics

### Hybrid Workflows

**Scenario:** Use Anthropic for primary work, Ollama for second opinions

**Setup:**

1. Keep primary provider as Anthropic:
   ```bash
   pnpm provider:anthropic
   ```

2. The second-opinion system in ActionFlows automatically uses Ollama independently of the primary provider.

3. No additional configuration needed - hybrid mode works out of the box.

### Cost Optimization

**Strategy 1: Time-based switching**

Use Ollama during rapid iteration, Anthropic for final review:

```bash
# Morning: Quick iteration with Ollama
pnpm provider:ollama

# Afternoon: Final review with Anthropic
pnpm provider:anthropic
```

**Strategy 2: Task-based switching**

Use Ollama for low-stakes tasks, Anthropic for critical work:

```bash
# Experiment: Use Ollama
pnpm provider:ollama

# Production code review: Use Anthropic
pnpm provider:anthropic
```

### Performance Tuning

#### Ollama Performance

**Speed up Ollama:**

1. **Use smaller models:**
   ```bash
   ollama pull gemma3:4b
   ```

2. **Increase RAM allocation** (if possible)

3. **Use GPU acceleration** (if available):
   ```bash
   # Check GPU is detected
   nvidia-smi  # NVIDIA
   rocm-smi    # AMD
   ```

#### Anthropic Performance

**Reduce latency:**

1. **Use Haiku model** for faster responses
2. **Check internet connection** quality
3. **Use CDN-friendly networks** (avoid VPNs if possible)

### Per-Project Overrides (Future)

**Current limitation:** Provider toggle is global (affects all Claude Code projects).

**Workaround:**

Create project-specific toggle scripts:

```bash
#!/usr/bin/env bash
# project-specific-toggle.sh

# Save current config
cp ~/.claude/config.json ~/.claude/config.global-backup.json

# Apply project config
cp ./configs/project-ollama.json ~/.claude/config.json

# Reminder to restore
echo "Remember to restore: cp ~/.claude/config.global-backup.json ~/.claude/config.json"
```

---

## 7. FAQ

### General Questions

**Q: Can I use different providers per project?**

A: Not currently. The toggle affects all Claude Code projects on your machine. Provider configuration is stored globally in `~/.claude/config.json`.

**Q: What happens to second-opinion when I switch?**

A: The second-opinion system in ActionFlows uses Ollama independently. It works regardless of your primary provider setting.

**Q: How do I switch models within Ollama?**

A: Edit `~/.claude/settings.json` manually and change the `model` field:

```json
{
  "model": "gemma3:4b"
}
```

**Q: Can I use custom Ollama models?**

A: Yes. Pull any Ollama-compatible model and set it in `settings.json`:

```bash
ollama pull custom-model:latest
```

Then edit `~/.claude/settings.json`:

```json
{
  "model": "custom-model:latest"
}
```

**Q: Are backups created automatically?**

A: Yes. Every time you run `pnpm provider:anthropic` or `pnpm provider:ollama`, a timestamped backup is created in `~/.claude/config.backup.YYYYMMDD-HHMMSS.json`. Only the last 5 backups are kept.

**Q: How much disk space do Ollama models use?**

A: Model sizes vary:
- `gemma3:4b`: ~2.5GB
- `qwen2.5-coder:7b`: ~4.7GB
- `qwen2.5-coder:32b`: ~19GB

**Q: Can I use Ollama remotely?**

A: Yes. Edit `.claude/config-templates/config.ollama.json` and set `baseURL` to your remote Ollama instance:

```json
{
  "baseURL": "http://remote-server:11434",
  "provider": "ollama"
}
```

### Troubleshooting Questions

**Q: Toggle script says "Ollama is running" but Claude Code can't connect**

A: Verify Ollama API is accessible:

```bash
curl http://localhost:11434/api/tags
```

If this fails, restart Ollama:

```bash
systemctl restart ollama  # Linux
brew services restart ollama  # macOS
```

**Q: I switched to Ollama but responses are extremely slow**

A: Check system resources:

```bash
# Monitor CPU/RAM usage
top

# Check Ollama logs
journalctl -u ollama -f  # Linux
```

Solutions:
- Switch to a smaller model (`gemma3:4b`)
- Close other resource-intensive applications
- Ensure GPU acceleration is working (if available)

**Q: My API key was lost after toggling**

A: Restore from backup:

```bash
pnpm provider:restore
```

Or manually restore the key from the most recent backup:

```bash
ls -t ~/.claude/config.backup.*.json | head -1
cat ~/.claude/config.backup.YYYYMMDD-HHMMSS.json | grep primaryApiKey
```

**Q: Toggle script fails with "jq: command not found"**

A: Install `jq` (JSON processor):

```bash
# Linux
sudo apt install jq  # Debian/Ubuntu
sudo yum install jq  # RHEL/CentOS

# macOS
brew install jq

# Windows (via Chocolatey)
choco install jq
```

### Advanced Questions

**Q: Can I automate toggling based on task type?**

A: Yes. Create wrapper scripts:

```bash
#!/usr/bin/env bash
# experiment.sh - Use Ollama for experiments

pnpm provider:ollama
claude-code "$@"
pnpm provider:anthropic  # Restore after
```

**Q: How do I monitor Ollama performance?**

A: Use Ollama's built-in metrics:

```bash
# Check model performance
curl http://localhost:11434/api/generate \
  -d '{"model":"qwen2.5-coder:7b","prompt":"test"}' \
  --verbose
```

**Q: Can I use multiple Ollama models simultaneously?**

A: No. Claude Code uses one model at a time (set in `settings.json`). However, you can manually switch models between sessions:

```bash
# Edit settings
nano ~/.claude/settings.json

# Change "model": "gemma3:4b" to "model": "qwen2.5-coder:7b"
```

**Q: What happens if I toggle while Claude Code is running?**

A: Current Claude Code session continues with the old provider. Changes take effect on the next session start. It's recommended to close Claude Code before toggling.

---

## Additional Resources

- **Ollama Documentation:** [https://github.com/ollama/ollama](https://github.com/ollama/ollama)
- **Anthropic API Docs:** [https://docs.anthropic.com](https://docs.anthropic.com)
- **Claude Code Settings:** `~/.claude/settings.json`
- **Template Files:** `.claude/config-templates/`
- **Toggle Script Source:** `scripts/toggle-provider.sh`

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
