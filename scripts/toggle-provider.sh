#!/usr/bin/env bash
set -euo pipefail

# Provider Toggle Script for Claude Code
# Switches between Anthropic API and Ollama local models

# Constants
CLAUDE_DIR="${HOME}/.claude"
CONFIG_FILE="${CLAUDE_DIR}/config.json"
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.claude/config-templates"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
error() {
    echo -e "${RED}❌ Error:${NC} $1" >&2
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️  Warning:${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ️${NC}  $1"
}

# Show usage
usage() {
    cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  anthropic    Switch to Anthropic API
  ollama       Switch to Ollama (local)
  status       Show current provider
  restore      Restore from latest backup

Examples:
  pnpm provider:anthropic
  pnpm provider:ollama
  pnpm provider:status
  pnpm provider:restore
EOF
    exit 1
}

# Create backup
create_backup() {
    local backup_file="${CLAUDE_DIR}/config.backup.$(date +%Y%m%d-%H%M%S).json"

    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$backup_file"
        info "Backup created: $(basename "$backup_file")"

        # Cleanup old backups (keep last 5)
        ls -t "${CLAUDE_DIR}"/config.backup.*.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    else
        warning "No existing config to backup"
    fi
}

# Validate JSON file
validate_json() {
    local file="$1"
    if ! python -m json.tool "$file" >/dev/null 2>&1; then
        error "Invalid JSON in $file"
        return 1
    fi
    return 0
}

# Get current provider
get_current_provider() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "unknown"
        return
    fi

    if grep -q '"baseURL"' "$CONFIG_FILE" 2>/dev/null; then
        local base_url
        base_url=$(grep -o '"baseURL"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG_FILE" | sed 's/.*"baseURL"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
        if [[ "$base_url" == *"localhost:11434"* ]] || [[ "$base_url" == *"127.0.0.1:11434"* ]]; then
            echo "ollama"
        else
            echo "custom"
        fi
    elif grep -q '"primaryApiKey"' "$CONFIG_FILE" 2>/dev/null; then
        echo "anthropic"
    else
        echo "unknown"
    fi
}

# Get current model
get_current_model() {
    if [ ! -f "$SETTINGS_FILE" ]; then
        echo "unknown"
        return
    fi

    local model
    model=$(grep -o '"model"[[:space:]]*:[[:space:]]*"[^"]*"' "$SETTINGS_FILE" 2>/dev/null | sed 's/.*"model"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    echo "${model:-unknown}"
}

# Show current status
show_status() {
    local provider
    local model

    provider=$(get_current_provider)
    model=$(get_current_model)

    echo ""
    echo "Current Configuration:"
    echo "  Provider: $provider"
    echo "  Model:    $model"
    echo ""

    if [ -f "$CONFIG_FILE" ]; then
        echo "Config file: $CONFIG_FILE"
        echo "Settings file: $SETTINGS_FILE"
    else
        warning "Config file not found"
    fi
    echo ""
}

# Check Ollama health
check_ollama() {
    info "Checking Ollama..."

    local response
    response=$(curl -s http://localhost:11434/api/tags 2>/dev/null)

    if [ -z "$response" ]; then
        error "Ollama is not running"
        echo ""
        echo "Start Ollama with:"
        echo "  systemctl start ollama  # Linux"
        echo "  brew services start ollama  # macOS"
        echo "  ollama serve  # Manual"
        echo ""
        return 1
    fi

    # Check for available models (parse JSON without jq)
    local model_count
    model_count=$(echo "$response" | grep -o '"name":"[^"]*"' | wc -l)

    if [ "$model_count" -eq 0 ]; then
        warning "Ollama running but no models found"
        echo ""
        echo "Pull a model first:"
        echo "  ollama pull qwen2.5-coder:7b"
        echo "  ollama pull gemma3:4b"
        echo ""
        return 1
    fi

    success "Ollama is running with $model_count model(s)"

    # List available models (extract names without jq)
    local models
    models=$(echo "$response" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g')
    if [ -n "$models" ]; then
        info "Available models:"
        echo "$models" | sed 's/^/    /'
    fi
    echo ""

    return 0
}

# Switch to Anthropic
switch_to_anthropic() {
    echo ""
    info "Switching to Anthropic API..."
    echo ""

    # Create backup
    create_backup

    # Get existing API key from backup if available
    local existing_key=""
    local latest_backup
    latest_backup=$(ls -t "${CLAUDE_DIR}"/config.backup.*.json 2>/dev/null | head -1)

    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        existing_key=$(grep -o '"primaryApiKey"[[:space:]]*:[[:space:]]*"[^"]*"' "$latest_backup" 2>/dev/null | sed 's/.*"primaryApiKey"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    fi

    # Check template exists
    if [ ! -f "$TEMPLATE_DIR/config.anthropic.json" ]; then
        error "Template not found: $TEMPLATE_DIR/config.anthropic.json"
        echo "Please restore from git: git checkout .claude/config-templates/"
        return 1
    fi

    # Apply config template
    if [ -n "$existing_key" ] && [ "$existing_key" != "null" ] && [ "$existing_key" != "" ]; then
        python -c "import json; d=json.load(open('$TEMPLATE_DIR/config.anthropic.json')); d['primaryApiKey']='$existing_key'; json.dump(d,open('${CONFIG_FILE}.tmp','w'),indent=2)"
        info "Preserved existing API key"
    else
        warning "No existing API key found"
        echo "You'll need to manually add your Anthropic API key to:"
        echo "  $CONFIG_FILE"
        cp "$TEMPLATE_DIR/config.anthropic.json" "${CONFIG_FILE}.tmp"
    fi

    # Apply settings template
    cp "$TEMPLATE_DIR/settings.anthropic.json" "${SETTINGS_FILE}.tmp"

    # Validate both files
    if ! validate_json "${CONFIG_FILE}.tmp"; then
        rm -f "${CONFIG_FILE}.tmp" "${SETTINGS_FILE}.tmp"
        error "Config validation failed"
        return 1
    fi

    if ! validate_json "${SETTINGS_FILE}.tmp"; then
        rm -f "${CONFIG_FILE}.tmp" "${SETTINGS_FILE}.tmp"
        error "Settings validation failed"
        return 1
    fi

    # Atomic move
    mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
    mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"

    success "Switched to Anthropic API"
    info "Model: $(get_current_model)"
    echo ""
}

# Switch to Ollama
switch_to_ollama() {
    echo ""
    info "Switching to Ollama (local)..."
    echo ""

    # Check Ollama health
    if ! check_ollama; then
        return 2
    fi

    # Create backup
    create_backup

    # Check template exists
    if [ ! -f "$TEMPLATE_DIR/config.ollama.json" ]; then
        error "Template not found: $TEMPLATE_DIR/config.ollama.json"
        echo "Please restore from git: git checkout .claude/config-templates/"
        return 1
    fi

    # Apply config template
    cp "$TEMPLATE_DIR/config.ollama.json" "${CONFIG_FILE}.tmp"

    # Apply settings template
    cp "$TEMPLATE_DIR/settings.ollama.json" "${SETTINGS_FILE}.tmp"

    # Validate both files
    if ! validate_json "${CONFIG_FILE}.tmp"; then
        rm -f "${CONFIG_FILE}.tmp" "${SETTINGS_FILE}.tmp"
        error "Config validation failed"
        return 1
    fi

    if ! validate_json "${SETTINGS_FILE}.tmp"; then
        rm -f "${CONFIG_FILE}.tmp" "${SETTINGS_FILE}.tmp"
        error "Settings validation failed"
        return 1
    fi

    # Atomic move
    mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
    mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"

    success "Switched to Ollama"
    info "Model: $(get_current_model)"
    echo ""
}

# Restore from backup
restore_from_backup() {
    echo ""
    info "Restoring from backup..."
    echo ""

    local latest_backup
    latest_backup=$(ls -t "${CLAUDE_DIR}"/config.backup.*.json 2>/dev/null | head -1)

    if [ -z "$latest_backup" ] || [ ! -f "$latest_backup" ]; then
        error "No backup found"
        return 1
    fi

    if ! validate_json "$latest_backup"; then
        error "Backup file is corrupted: $(basename "$latest_backup")"
        return 1
    fi

    cp "$latest_backup" "$CONFIG_FILE"

    success "Restored from backup: $(basename "$latest_backup")"
    info "Provider: $(get_current_provider)"
    echo ""
}

# Main
main() {
    if [ $# -eq 0 ]; then
        usage
    fi

    local command="$1"

    case "$command" in
        anthropic)
            switch_to_anthropic
            ;;
        ollama)
            switch_to_ollama
            ;;
        status)
            show_status
            ;;
        restore)
            restore_from_backup
            ;;
        *)
            error "Unknown command: $command"
            echo ""
            usage
            ;;
    esac
}

main "$@"
