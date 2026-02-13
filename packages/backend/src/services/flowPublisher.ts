import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { join, resolve, sep } from 'path';
import type { FlowHubFlowId, FlowManifest } from '@afw/shared';
import { toFlowHubFlowId } from '@afw/shared';

/**
 * Flow Publisher Service
 * Packages local flows for distribution via FlowHub
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

class FlowPublisher {
  private readonly ACTIONFLOWS_ROOT = join('.claude', 'actionflows');
  private readonly FLOWS_MD_PATH = join('.claude', 'actionflows', 'FLOWS.md');

  /**
   * Publish a flow from local registry to FlowHub manifest format
   */
  async publishFlow(flowId: FlowHubFlowId): Promise<FlowManifest> {
    console.log(`[FlowPublisher] Starting publish: ${flowId}`);

    try {
      // 1. Read FLOWS.md to find flow definition
      if (!(await this.fileExists(this.FLOWS_MD_PATH))) {
        throw new Error('FLOWS.md not found. No flows available to publish.');
      }

      const flowsContent = await fs.readFile(this.FLOWS_MD_PATH, 'utf-8');

      // 2. Extract flow entry for this flowId
      const flowEntry = await this.extractFlowEntry(flowsContent, flowId);
      if (!flowEntry) {
        throw new Error(`Flow not found in FLOWS.md: ${flowId}`);
      }

      // 3. Parse flow entry to extract agent action types
      const agentActionTypes = this.extractAgentActionTypes(flowEntry);
      if (agentActionTypes.length === 0) {
        throw new Error(`No agents found in flow definition for: ${flowId}`);
      }

      // 4. Collect agent.md files
      const agents = await this.collectAgentFiles(agentActionTypes);

      // 5. Generate metadata
      const metadata = await this.generateMetadata(flowId, flowEntry);

      // 6. Build FlowManifest
      const manifest: FlowManifest = {
        flowId,
        name: metadata.name,
        description: metadata.description,
        author: metadata.author,
        version: metadata.version,
        downloads: 0, // Initial publish
        rating: 0, // No ratings yet
        source: 'local',
        tags: metadata.tags,
        categories: metadata.categories,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requiresCapabilities: [], // TODO: Parse from flow definition
        requiresSurfaces: [], // TODO: Parse from flow definition
        agents,
        flowsEntry: flowEntry,
      };

      console.log(`[FlowPublisher] Published manifest: ${flowId} (${agents.length} agents)`);
      return manifest;
    } catch (error) {
      console.error(`[FlowPublisher] Publish failed:`, error);
      throw error;
    }
  }

  /**
   * Generate a shareable URL for the manifest (data URL for now)
   */
  async generateManifestUrl(manifest: FlowManifest): Promise<string> {
    try {
      const manifestJson = JSON.stringify(manifest, null, 2);
      const base64 = Buffer.from(manifestJson).toString('base64');
      const dataUrl = `data:application/json;base64,${base64}`;

      console.log(`[FlowPublisher] Generated data URL for manifest: ${manifest.flowId} (${manifestJson.length} bytes)`);
      return dataUrl;
    } catch (error) {
      console.error(`[FlowPublisher] Failed to generate manifest URL:`, error);
      throw error;
    }
  }

  /**
   * Extract flow entry from FLOWS.md by flowId
   */
  private async extractFlowEntry(flowsContent: string, flowId: FlowHubFlowId): Promise<string | null> {
    // Strategy: Find flow header (## <flowId>) and extract content until next flow or end
    const lines = flowsContent.split('\n');
    let flowStart = -1;
    let flowEnd = -1;

    // Find flow header
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for header like "## flowId/" or section containing flowId
      if (line.startsWith('##') && line.toLowerCase().includes(flowId.toLowerCase())) {
        flowStart = i;
        break;
      }
    }

    if (flowStart === -1) {
      return null;
    }

    // Find end of flow section (next ## header or end of file)
    for (let i = flowStart + 1; i < lines.length; i++) {
      if (lines[i].startsWith('##')) {
        flowEnd = i;
        break;
      }
    }

    if (flowEnd === -1) {
      flowEnd = lines.length;
    }

    const flowEntry = lines.slice(flowStart, flowEnd).join('\n').trim();
    return flowEntry;
  }

  /**
   * Extract agent action types from flow entry
   * Looks for patterns like "code/", "review/", "analyze/", etc.
   */
  private extractAgentActionTypes(flowEntry: string): string[] {
    const actionTypes: Set<string> = new Set();

    // Pattern 1: Look for action names in chain definitions
    const actionPatternRegex = /(\w+(?:\/\w+)*)/g;
    const matches = Array.from(flowEntry.matchAll(actionPatternRegex));

    for (const match of matches) {
      const candidate = match[1];
      // Filter for action-like patterns (contains /, or common action names)
      if (candidate.includes('/') || ['code', 'review', 'analyze', 'plan', 'test', 'audit', 'commit'].includes(candidate)) {
        actionTypes.add(candidate);
      }
    }

    return Array.from(actionTypes);
  }

  /**
   * Collect agent.md files for given action types
   */
  private async collectAgentFiles(actionTypes: string[]): Promise<Array<{ actionType: string; agentMdContent: string }>> {
    const agents: Array<{ actionType: string; agentMdContent: string }> = [];

    for (const actionType of actionTypes) {
      try {
        // Security: Validate actionType to prevent path traversal
        const actionsRoot = join(this.ACTIONFLOWS_ROOT, 'actions');
        const validatedPath = validateActionPath(actionType, actionsRoot);
        const agentPath = join(validatedPath, 'agent.md');

        if (!(await this.fileExists(agentPath))) {
          console.warn(`[FlowPublisher] Agent file not found (skipping): ${actionType} -> ${agentPath}`);
          continue;
        }

        const agentMdContent = await fs.readFile(agentPath, 'utf-8');
        agents.push({ actionType, agentMdContent });
        console.log(`[FlowPublisher] Collected agent: ${actionType}`);
      } catch (error) {
        console.error(`[FlowPublisher] Failed to read agent file for ${actionType}:`, error);
        // Continue with other agents
      }
    }

    return agents;
  }

  /**
   * Generate metadata for the flow
   */
  private async generateMetadata(flowId: FlowHubFlowId, flowEntry: string): Promise<{
    name: string;
    description: string;
    author: string;
    version: string;
    tags: string[];
    categories: string[];
  }> {
    // Extract name from flow entry (first line after ##)
    const lines = flowEntry.split('\n');
    const headerLine = lines.find(line => line.startsWith('##'));
    const name = headerLine ? headerLine.replace(/^##\s*/, '').trim() : flowId;

    // Extract description (first paragraph after header)
    const descriptionLine = lines.find((line, idx) => idx > 0 && line.trim().length > 0 && !line.startsWith('#'));
    const description = descriptionLine ? descriptionLine.trim() : 'No description available';

    // Get author from git config
    let author = 'Unknown';
    try {
      author = execSync('git config user.name', { encoding: 'utf-8' }).trim();
    } catch (error) {
      console.warn(`[FlowPublisher] Could not get git user.name:`, error);
    }

    // Version: default to 1.0.0 for new flows
    const version = '1.0.0';

    // Extract tags from flow entry (look for tags: line)
    const tagsLine = lines.find(line => line.toLowerCase().includes('tags:'));
    const tags = tagsLine
      ? tagsLine.split(':')[1].split(',').map(t => t.trim()).filter(Boolean)
      : [flowId.split('/')[0]]; // Default to first segment of flowId

    // Categories: infer from flowId or default to 'Custom'
    const categories = [flowId.includes('/') ? flowId.split('/')[0] : 'Custom'];

    return { name, description, author, version, tags, categories };
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
export const flowPublisher = new FlowPublisher();
