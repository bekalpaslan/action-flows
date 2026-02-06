#!/usr/bin/env node
/**
 * ActionFlows Workspace - Bootstrap Integration Script
 *
 * This script prompts the user for Workspace configuration during framework bootstrap
 * and installs hook scripts into the target project.
 *
 * Usage:
 *   node scripts/bootstrap-hooks.ts <target-project-path>
 *
 * Example:
 *   node scripts/bootstrap-hooks.ts /path/to/cityzen
 *
 * The script:
 * 1. Prompts for Workspace settings (backend URL, username, etc.)
 * 2. Writes settings to <target>/.claude/settings.json
 * 3. Copies hook scripts from packages/hooks/src/ to <target>/.claude/hooks/
 * 4. Makes hooks executable
 * 5. Verifies installation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Configuration
const HOOK_SCRIPTS = [
  'afw-format-check.ts',
  'afw-chain-parse.ts',
  'afw-step-spawned.ts',
  'afw-step-completed.ts',
  'afw-control-check.ts',
  'afw-input-inject.ts',
  'afw-output-capture.ts',
  'afw-session-start.ts',
  'afw-session-end.ts',
];

const UTILS_DIR = 'utils';

interface WorkspaceSettings {
  enabled: boolean;
  backendUrl: string;
  user?: string;
  hooks: {
    formatCheck: boolean;
    chainParse: boolean;
    stepTracking: boolean;
    controlCommands: boolean;
    inputInjection: boolean;
    terminalOutput: boolean;
    sessionLifecycle: boolean;
  };
  formatEnforcement: {
    enabled: boolean;
    warnOnly: boolean;
    ignoreViolations: string[];
  };
  polling: {
    inputTimeoutMs: number;
    commandCheckIntervalMs: number;
  };
}

/**
 * Prompts user for input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Prompts for yes/no question
 */
async function promptYesNo(question: string, defaultValue: boolean = true): Promise<boolean> {
  const defaultStr = defaultValue ? 'yes' : 'no';
  const answer = await prompt(`${question} (yes/no, default: ${defaultStr}): `);

  if (!answer) return defaultValue;

  return answer.toLowerCase().startsWith('y');
}

/**
 * Collects Workspace settings from user
 */
async function collectSettings(): Promise<WorkspaceSettings | null> {
  console.log('\n=== ActionFlows Workspace Integration ===\n');

  // Question 1: Enable Workspace?
  const enabled = await promptYesNo(
    'Would you like to enable ActionFlows Workspace integration?\n' +
    'The Workspace provides real-time chain visualization, multi-session monitoring,\n' +
    'file explorer, code editor, terminal, and control features.\n\n' +
    'Enable Workspace?',
    true
  );

  if (!enabled) {
    console.log('\nWorkspace integration disabled. Skipping configuration.\n');
    return {
      enabled: false,
      backendUrl: 'http://localhost:3001',
      hooks: {
        formatCheck: false,
        chainParse: false,
        stepTracking: false,
        controlCommands: false,
        inputInjection: false,
        terminalOutput: false,
        sessionLifecycle: false,
      },
      formatEnforcement: {
        enabled: false,
        warnOnly: true,
        ignoreViolations: [],
      },
      polling: {
        inputTimeoutMs: 30000,
        commandCheckIntervalMs: 1000,
      },
    };
  }

  // Question 2: Backend URL
  const backendUrl = await prompt(
    '\nWhat is the URL of your ActionFlows Workspace backend?\n' +
    'Common options:\n' +
    '  - http://localhost:3001 (local development)\n' +
    '  - http://192.168.1.X:3001 (team server on LAN)\n' +
    '\nBackend URL (default: http://localhost:3001): '
  );

  const finalBackendUrl = backendUrl || 'http://localhost:3001';

  // Question 3: Username
  const username = await prompt(
    '\nWhat username should be used for session attribution?\n' +
    'This helps identify your sessions in the team Dashboard.\n' +
    '\nUsername (leave blank to use system username): '
  );

  // Question 4: Format Enforcement
  const formatEnforcement = await promptYesNo(
    '\nEnable format enforcement for orchestrator output?\n' +
    'Format enforcement checks chain compilations follow standard format.\n' +
    'Violations show as warnings but won\'t block execution.\n\n' +
    'Enable format enforcement?',
    true
  );

  // Question 5: Hook Selection
  const customizeHooks = await promptYesNo(
    '\nAll Workspace hooks are enabled by default.\n' +
    'Would you like to customize which hooks are active?\n\n' +
    'Customize hooks?',
    false
  );

  let hooks = {
    formatCheck: true,
    chainParse: true,
    stepTracking: true,
    controlCommands: true,
    inputInjection: true,
    terminalOutput: true,
    sessionLifecycle: true,
  };

  if (customizeHooks) {
    console.log('\nCustomizing hooks:\n');
    hooks.formatCheck = await promptYesNo('Enable formatCheck (format enforcement warnings)?', true);
    hooks.chainParse = await promptYesNo('Enable chainParse (chain compilation parsing)?', true);
    hooks.stepTracking = await promptYesNo('Enable stepTracking (step spawn/complete tracking)?', true);
    hooks.controlCommands = await promptYesNo('Enable controlCommands (Dashboard control)?', true);
    hooks.inputInjection = await promptYesNo('Enable inputInjection (Dashboard conversation interface)?', true);
    hooks.terminalOutput = await promptYesNo('Enable terminalOutput (terminal output streaming)?', true);
    hooks.sessionLifecycle = await promptYesNo('Enable sessionLifecycle (session start/end tracking)?', true);
  }

  return {
    enabled: true,
    backendUrl: finalBackendUrl,
    user: username || undefined,
    hooks: hooks,
    formatEnforcement: {
      enabled: formatEnforcement,
      warnOnly: true,
      ignoreViolations: [],
    },
    polling: {
      inputTimeoutMs: 30000,
      commandCheckIntervalMs: 1000,
    },
  };
}

/**
 * Writes settings to .claude/settings.json
 */
function writeSettings(targetDir: string, settings: WorkspaceSettings): void {
  const claudeDir = path.join(targetDir, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');

  // Create .claude directory if not exists
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Read existing settings if any
  let existingSettings: any = {};
  if (fs.existsSync(settingsPath)) {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    existingSettings = JSON.parse(content);
  }

  // Merge with workspace settings
  existingSettings.workspace = settings;

  // Write back
  fs.writeFileSync(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf-8');

  console.log(`\n✓ Settings written to ${settingsPath}`);
}

/**
 * Copies hook scripts to target project
 */
function copyHookScripts(targetDir: string, enabled: boolean): void {
  if (!enabled) {
    console.log('\n✓ Hook installation skipped (Workspace disabled)');
    return;
  }

  const hooksDir = path.join(targetDir, '.claude', 'hooks');
  const sourceDir = path.join(__dirname, '..', 'packages', 'hooks', 'src');

  // Create hooks directory
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Copy hook scripts
  let copiedCount = 0;
  for (const script of HOOK_SCRIPTS) {
    const sourcePath = path.join(sourceDir, script);
    const targetPath = path.join(hooksDir, script);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠ Warning: Hook script not found: ${sourcePath}`);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);

    // Make executable on Unix
    if (process.platform !== 'win32') {
      fs.chmodSync(targetPath, 0o755);
    }

    copiedCount++;
  }

  // Copy utils directory
  const sourceUtilsDir = path.join(sourceDir, UTILS_DIR);
  const targetUtilsDir = path.join(hooksDir, UTILS_DIR);

  if (fs.existsSync(sourceUtilsDir)) {
    if (!fs.existsSync(targetUtilsDir)) {
      fs.mkdirSync(targetUtilsDir, { recursive: true });
    }

    const utilFiles = fs.readdirSync(sourceUtilsDir);
    for (const file of utilFiles) {
      if (file.endsWith('.ts')) {
        const sourcePath = path.join(sourceUtilsDir, file);
        const targetPath = path.join(targetUtilsDir, file);
        fs.copyFileSync(sourcePath, targetPath);
      }
    }

    console.log(`\n✓ Copied ${copiedCount} hook scripts to ${hooksDir}`);
    console.log(`✓ Copied utils to ${targetUtilsDir}`);
  } else {
    console.warn(`⚠ Warning: Utils directory not found: ${sourceUtilsDir}`);
  }
}

/**
 * Verifies installation
 */
function verifyInstallation(targetDir: string, enabled: boolean): void {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json');

  // Check settings file
  if (!fs.existsSync(settingsPath)) {
    console.error('\n✗ ERROR: Settings file not created');
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(content);

    if (!settings.workspace) {
      console.error('\n✗ ERROR: Workspace section missing from settings');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ ERROR: Settings file is invalid JSON');
    process.exit(1);
  }

  if (!enabled) {
    console.log('\n✓ Installation verified (Workspace disabled)');
    return;
  }

  // Check hooks
  const hooksDir = path.join(targetDir, '.claude', 'hooks');
  if (!fs.existsSync(hooksDir)) {
    console.error('\n✗ ERROR: Hooks directory not created');
    process.exit(1);
  }

  let missingHooks = 0;
  for (const script of HOOK_SCRIPTS) {
    const hookPath = path.join(hooksDir, script);
    if (!fs.existsSync(hookPath)) {
      console.warn(`⚠ Warning: Hook not found: ${script}`);
      missingHooks++;
    }
  }

  if (missingHooks > 0) {
    console.warn(`\n⚠ ${missingHooks} hook(s) missing - installation may be incomplete`);
  } else {
    console.log('\n✓ Installation verified - all hooks installed');
  }
}

/**
 * Main bootstrap flow
 */
async function main() {
  // Get target directory from args
  const targetDir = process.argv[2];

  if (!targetDir) {
    console.error('Usage: node bootstrap-hooks.ts <target-project-path>');
    console.error('Example: node bootstrap-hooks.ts /path/to/cityzen');
    process.exit(1);
  }

  // Verify target directory exists
  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  console.log(`\nBootstrapping ActionFlows Workspace for: ${targetDir}\n`);

  // Collect settings
  const settings = await collectSettings();

  if (!settings) {
    console.error('\nError: Failed to collect settings');
    process.exit(1);
  }

  // Write settings
  writeSettings(targetDir, settings);

  // Copy hook scripts
  copyHookScripts(targetDir, settings.enabled);

  // Verify installation
  verifyInstallation(targetDir, settings.enabled);

  console.log('\n=== Bootstrap Complete ===\n');
  console.log('Next steps:');
  console.log('1. Start the ActionFlows Workspace backend server');
  console.log('2. Start Claude Code in the target project');
  console.log('3. Open the Workspace Electron app');
  console.log('4. Your session should appear in the Dashboard\n');
}

main().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
