import { promises as fs } from 'fs';
import { join, dirname, resolve, sep } from 'path';
import { z } from 'zod';
import type { FlowHubFlowId, FlowManifest, FlowInstallResult } from '@afw/shared';
import { signatureVerifier } from './signatureVerifier.js';

/**
 * Flow Installer Service
 * Manages installation and removal of flows from FlowHub manifests
 */

/**
 * Validate action path to prevent path traversal attacks
 * Three-layer security:
 * 1. Input sanitization - reject dangerous patterns
 * 2. Path resolution - resolve to absolute paths
 * 3. Boundary check - ensure path stays within allowed directory
 */
function validateActionPath(actionType: string, rootDir: string): string {
  // Layer 1: Block obvious path traversal attempts
  if (
    actionType.includes('..') ||
    actionType.startsWith('/') ||
    actionType.startsWith('\\') ||
    actionType.includes('~') ||
    actionType.includes('\0') // Null byte injection
  ) {
    throw new Error(`Invalid action type: path traversal detected in "${actionType}"`);
  }

  // Layer 2: Resolve to absolute paths
  const targetPath = resolve(rootDir, actionType);
  const allowedRoot = resolve(rootDir);

  // Layer 3: Verify the resolved path stays within allowed boundary
  if (!targetPath.startsWith(allowedRoot + sep)) {
    throw new Error(`Invalid action type: path escapes allowed directory`);
  }

  return targetPath;
}

// ============================================================================
// Zod Schema for FlowManifest Validation
// ============================================================================

const AgentDefinitionSchema = z.object({
  actionType: z.string().min(1, 'actionType required'),
  agentMdContent: z.string().min(1, 'agentMdContent required'),
  personality: z.record(z.unknown()).optional(),
});

const FlowManifestSchema = z.object({
  flowId: z.string().min(1, 'flowId required'),
  name: z.string().min(1, 'name required'),
  description: z.string(),
  author: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver format'),
  downloads: z.number().int().min(0),
  rating: z.number().min(0).max(5),
  source: z.enum(['local', 'flow-hub', 'community']),
  tags: z.array(z.string()),
  categories: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  requiresCapabilities: z.array(z.string()),
  requiresSurfaces: z.array(z.string()),
  personalityMetadata: z.record(z.unknown()).optional(),
  agents: z.array(AgentDefinitionSchema).min(1, 'At least one agent required'),
  flowsEntry: z.string().min(1, 'flowsEntry required'),
  signature: z.string().optional(),
});

// ============================================================================
// FlowInstaller Class
// ============================================================================

class FlowInstaller {
  private readonly ACTIONFLOWS_ROOT = join('.claude', 'actionflows');
  private readonly FLOWS_MD_PATH = join('.claude', 'actionflows', 'FLOWS.md');

  /**
   * Install a flow from a manifest
   */
  async installFlow(
    manifest: FlowManifest,
    options?: { overrideExisting?: boolean }
  ): Promise<FlowInstallResult> {
    const errors: string[] = [];
    const installedAgents: string[] = [];
    let signatureVerified = false;

    try {
      console.log(`[FlowInstaller] Starting installation: ${manifest.name} (${manifest.flowId})`);

      // 1. Validate manifest schema
      try {
        FlowManifestSchema.parse(manifest);
      } catch (validationError) {
        console.error(`[FlowInstaller] Validation failed:`, validationError);
        return {
          success: false,
          flowId: manifest.flowId,
          installedAgents: [],
          addedToRegistry: false,
          signatureVerified: false,
          errors: [`Manifest validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`],
        };
      }

      // 2. Verify signature
      const verificationResult = await signatureVerifier.verifyFlowSignature(manifest);
      signatureVerified = verificationResult.verified;

      if (!verificationResult.verified) {
        const isStrictMode = signatureVerifier.isStrictModeEnabled();

        // Log verification failure
        console.warn(
          `[FlowInstaller] Signature verification failed for ${manifest.flowId}: ${verificationResult.reason}`
        );

        // In strict mode, reject unsigned or invalid flows
        if (isStrictMode) {
          console.error(`[FlowInstaller] STRICT MODE: Rejecting flow due to signature verification failure`);
          return {
            success: false,
            flowId: manifest.flowId,
            installedAgents: [],
            addedToRegistry: false,
            signatureVerified: false,
            errors: [
              `Signature verification failed in strict mode: ${verificationResult.reason}`,
              'Set FLOWHUB_STRICT_MODE=false to allow unsigned flows',
            ],
          };
        } else {
          // Non-strict mode: warn but proceed
          console.warn(`[FlowInstaller] Proceeding with installation despite signature verification failure`);
          errors.push(`Warning: Flow signature not verified (${verificationResult.reason})`);
        }
      } else {
        console.log(`[FlowInstaller] Signature verified successfully for ${manifest.flowId}`);
        if (verificationResult.signerId) {
          console.log(`[FlowInstaller] Signed by: ${verificationResult.signerId}`);
        }
      }

      // 3. Check if flow already installed (unless overrideExisting)
      if (!options?.overrideExisting) {
        const isInstalled = await this.isFlowInstalled(manifest.flowId);
        if (isInstalled) {
          console.warn(`[FlowInstaller] Flow already installed: ${manifest.flowId}`);
          return {
            success: false,
            flowId: manifest.flowId,
            installedAgents: [],
            addedToRegistry: false,
            signatureVerified,
            errors: [`Flow already installed: ${manifest.flowId}. Use overrideExisting to reinstall.`],
          };
        }
      }

      // 4. Install agent.md files
      for (const agent of manifest.agents) {
        try {
          // Security: Validate actionType to prevent path traversal
          const actionsRoot = join(this.ACTIONFLOWS_ROOT, 'actions');
          const validatedPath = validateActionPath(agent.actionType, actionsRoot);
          const agentPath = join(validatedPath, 'agent.md');
          const agentDir = dirname(agentPath);

          // Create directory if needed
          await fs.mkdir(agentDir, { recursive: true });

          // Check if agent.md already exists
          const agentExists = await this.fileExists(agentPath);
          if (agentExists && !options?.overrideExisting) {
            console.warn(`[FlowInstaller] Agent already exists (skipping): ${agent.actionType}`);
            errors.push(`Agent already exists: ${agent.actionType}`);
            continue;
          }

          // Write agent.md
          await fs.writeFile(agentPath, agent.agentMdContent, 'utf-8');
          installedAgents.push(agent.actionType);
          console.log(`[FlowInstaller] Installed agent: ${agent.actionType} -> ${agentPath}`);
        } catch (agentError) {
          const errorMsg = `Failed to install agent ${agent.actionType}: ${agentError instanceof Error ? agentError.message : String(agentError)}`;
          console.error(`[FlowInstaller] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // 5. Append flow entry to FLOWS.md with [Source: FlowHub] marker
      let addedToRegistry = false;
      try {
        const flowsEntry = `\n${manifest.flowsEntry}\n[Source: FlowHub, ID: ${manifest.flowId}, Version: ${manifest.version}]\n`;

        // Create FLOWS.md if it doesn't exist
        if (!(await this.fileExists(this.FLOWS_MD_PATH))) {
          await fs.writeFile(this.FLOWS_MD_PATH, '# ActionFlows Registry\n\n', 'utf-8');
        }

        await fs.appendFile(this.FLOWS_MD_PATH, flowsEntry, 'utf-8');
        addedToRegistry = true;
        console.log(`[FlowInstaller] Added flow entry to FLOWS.md: ${manifest.name}`);
      } catch (flowsError) {
        const errorMsg = `Failed to add flow to FLOWS.md: ${flowsError instanceof Error ? flowsError.message : String(flowsError)}`;
        console.error(`[FlowInstaller] ${errorMsg}`);
        errors.push(errorMsg);
      }

      const success = installedAgents.length > 0 && addedToRegistry;
      console.log(`[FlowInstaller] Installation ${success ? 'succeeded' : 'partially failed'}: ${manifest.flowId}`);

      return {
        success,
        flowId: manifest.flowId,
        installedAgents,
        addedToRegistry,
        signatureVerified,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error(`[FlowInstaller] Fatal error during installation:`, error);
      return {
        success: false,
        flowId: manifest.flowId,
        installedAgents,
        addedToRegistry: false,
        signatureVerified: false,
        errors: [`Installation failed: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * Uninstall a flow by removing flow entry from FLOWS.md
   *
   * NOTE: Agent.md files are preserved (conservative cleanup approach).
   * They may be shared by multiple flows, so removal requires reference counting.
   *
   * TODO: Implement reference counting in future versions to safely remove orphaned agents.
   * For now, users can manually clean up unused agent files if needed.
   */
  async uninstallFlow(flowId: FlowHubFlowId): Promise<{
    success: boolean;
    removedFromRegistry: boolean;
    agentFilesRemoved: boolean;
    warnings?: string[];
    errors?: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let removedFromRegistry = false;

    try {
      console.log(`[FlowInstaller] Starting uninstall: ${flowId}`);

      // 1. Read FLOWS.md to find flow entry and extract agent paths
      if (!(await this.fileExists(this.FLOWS_MD_PATH))) {
        return {
          success: false,
          removedFromRegistry: false,
          agentFilesRemoved: false,
          errors: ['FLOWS.md not found. Nothing to uninstall.'],
        };
      }

      const flowsContent = await fs.readFile(this.FLOWS_MD_PATH, 'utf-8');

      // Find flow entry marker (simple regex for now)
      const flowMarkerRegex = new RegExp(`\\[Source: FlowHub, ID: ${flowId}.*?\\]`, 'i');
      if (!flowMarkerRegex.test(flowsContent)) {
        return {
          success: false,
          removedFromRegistry: false,
          agentFilesRemoved: false,
          errors: [`Flow not found in FLOWS.md: ${flowId}`],
        };
      }

      // 2. Remove flow entry from FLOWS.md
      // Strategy: Remove section starting from flow header up to (but not including) next flow or end of file
      // For now, simple implementation: just remove lines with the marker
      const lines = flowsContent.split('\n');
      const markerLineIndex = lines.findIndex(line => flowMarkerRegex.test(line));

      if (markerLineIndex === -1) {
        errors.push('Could not locate flow marker in FLOWS.md');
      } else {
        // Remove flow entry (find start of section - previous header line)
        let sectionStart = markerLineIndex;
        while (sectionStart > 0 && !lines[sectionStart - 1].startsWith('##')) {
          sectionStart--;
        }
        if (lines[sectionStart].startsWith('##')) {
          sectionStart--; // Include the header
        }

        // Find end of section (next header or marker)
        let sectionEnd = markerLineIndex + 1;
        while (sectionEnd < lines.length && !lines[sectionEnd].startsWith('##') && !lines[sectionEnd].includes('[Source:')) {
          sectionEnd++;
        }

        // Remove section
        lines.splice(Math.max(0, sectionStart), sectionEnd - sectionStart);
        await fs.writeFile(this.FLOWS_MD_PATH, lines.join('\n'), 'utf-8');
        removedFromRegistry = true;
        console.log(`[FlowInstaller] Removed flow entry from FLOWS.md: ${flowId}`);
      }

      // 3. Agent files are preserved (conservative cleanup)
      // Rationale: Multiple flows may share agent definitions. Removing agents requires
      // reference counting to avoid breaking other installed flows.
      warnings.push(
        'Agent files preserved - may be shared by other flows. ' +
        'Manual cleanup required if orphaned. ' +
        'Future versions will include automatic orphan detection.'
      );

      console.log(`[FlowInstaller] Uninstall complete: ${flowId}`);
      return {
        success: true,
        removedFromRegistry,
        agentFilesRemoved: false,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error(`[FlowInstaller] Uninstall failed:`, error);
      return {
        success: false,
        removedFromRegistry: false,
        agentFilesRemoved: false,
        errors: [`Uninstall failed: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * Check if a flow is already installed
   */
  async isFlowInstalled(flowId: FlowHubFlowId): Promise<boolean> {
    try {
      if (!(await this.fileExists(this.FLOWS_MD_PATH))) {
        return false;
      }

      const flowsContent = await fs.readFile(this.FLOWS_MD_PATH, 'utf-8');
      const flowMarkerRegex = new RegExp(`\\[Source: FlowHub, ID: ${flowId}.*?\\]`, 'i');
      return flowMarkerRegex.test(flowsContent);
    } catch (error) {
      console.error(`[FlowInstaller] Error checking installation status:`, error);
      return false;
    }
  }

  /**
   * Check if a file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const flowInstaller = new FlowInstaller();
