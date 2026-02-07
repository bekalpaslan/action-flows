import type { StepNumber } from '@afw/shared';

/**
 * Parsed stream-JSON block
 */
export interface ParsedStreamBlock {
  type: 'tool_use' | 'tool_result' | 'text' | 'error';
  content: string;
  toolName?: string;
  toolUseId?: string;
  timestamp?: number;
}

/**
 * Enriched step data from stream-JSON
 */
export interface EnrichedStepData {
  stepNumber: StepNumber;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  toolUseId?: string;
  output?: string;
  error?: string;
}

/**
 * Parse Claude CLI stream-JSON output
 *
 * Stream-JSON format:
 * - Lines starting with "data: " contain JSON blocks
 * - Each block has a "type" field (e.g., "content_block_start", "content_block_delta", etc.)
 * - Tool use blocks have type="tool_use" with name and id
 * - Tool result blocks have type="tool_result" with tool_use_id
 */
export function parseStreamJson(output: string): ParsedStreamBlock[] {
  const blocks: ParsedStreamBlock[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Parse stream-JSON line
    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.slice(6); // Remove "data: " prefix
        const data = JSON.parse(jsonStr);

        // Extract content blocks
        if (data.type === 'content_block_start' && data.content_block) {
          const block = data.content_block;

          if (block.type === 'tool_use') {
            blocks.push({
              type: 'tool_use',
              content: JSON.stringify(block.input || {}),
              toolName: block.name,
              toolUseId: block.id,
              timestamp: Date.now(),
            });
          }
        }

        if (data.type === 'content_block_delta' && data.delta) {
          const delta = data.delta;

          if (delta.type === 'text_delta') {
            blocks.push({
              type: 'text',
              content: delta.text,
              timestamp: Date.now(),
            });
          }
        }

        // Tool results (from message_stop events)
        if (data.type === 'message_stop' && data.message?.content) {
          for (const contentBlock of data.message.content) {
            if (contentBlock.type === 'tool_result') {
              blocks.push({
                type: 'tool_result',
                content: JSON.stringify(contentBlock.content || {}),
                toolUseId: contentBlock.tool_use_id,
                timestamp: Date.now(),
              });
            }
          }
        }

        // Error blocks
        if (data.type === 'error') {
          blocks.push({
            type: 'error',
            content: data.error?.message || 'Unknown error',
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        // Invalid JSON, skip
        console.debug('[streamJsonParser] Failed to parse line:', line, error);
      }
    }
  }

  return blocks;
}

/**
 * Map tool_use blocks to chain steps
 *
 * Heuristic: Each tool_use represents a step in the chain
 */
export function mapToolUseToSteps(blocks: ParsedStreamBlock[]): EnrichedStepData[] {
  const steps: EnrichedStepData[] = [];
  const toolUseMap = new Map<string, EnrichedStepData>();

  let stepCounter = 1;

  for (const block of blocks) {
    if (block.type === 'tool_use' && block.toolName && block.toolUseId) {
      // Validate stepCounter is a positive integer before casting
      if (stepCounter > 0 && Number.isInteger(stepCounter)) {
        // Create step from tool_use
        const step: EnrichedStepData = {
          stepNumber: stepCounter as StepNumber,
          action: block.toolName,
          status: 'running',
          startedAt: block.timestamp,
          toolUseId: block.toolUseId,
        };

        steps.push(step);
        toolUseMap.set(block.toolUseId, step);
        stepCounter++;
      }
    }

    if (block.type === 'tool_result' && block.toolUseId) {
      // Update step with result
      const step = toolUseMap.get(block.toolUseId);
      if (step) {
        step.status = 'completed';
        step.completedAt = block.timestamp;
        step.output = block.content;

        if (step.startedAt && step.completedAt) {
          step.duration = step.completedAt - step.startedAt;
        }
      }
    }

    if (block.type === 'error') {
      // Mark last running step as failed
      const lastRunningStep = steps.find(s => s.status === 'running');
      if (lastRunningStep) {
        lastRunningStep.status = 'failed';
        lastRunningStep.error = block.content;
        lastRunningStep.completedAt = block.timestamp;
      }
    }
  }

  return steps;
}

/**
 * Detect Task spawns from stream-JSON
 *
 * Heuristic: Task tool uses with specific patterns
 */
export function detectTaskSpawns(blocks: ParsedStreamBlock[]): Array<{
  taskName: string;
  toolUseId: string;
  timestamp: number;
}> {
  const tasks: Array<{ taskName: string; toolUseId: string; timestamp: number }> = [];

  for (const block of blocks) {
    if (
      block.type === 'tool_use' &&
      block.toolName === 'Task' &&
      block.toolUseId &&
      block.timestamp
    ) {
      // Extract task name from content
      try {
        const input = JSON.parse(block.content);
        const taskName = input.task || input.name || 'Unnamed Task';

        tasks.push({
          taskName,
          toolUseId: block.toolUseId,
          timestamp: block.timestamp,
        });
      } catch {
        // Failed to parse, skip
      }
    }
  }

  return tasks;
}

/**
 * Extract metadata from stream-JSON (action names, durations, etc.)
 */
export function extractMetadata(output: string): {
  actions: string[];
  totalDuration?: number;
  errorCount: number;
} {
  const blocks = parseStreamJson(output);
  const steps = mapToolUseToSteps(blocks);

  const actions = steps.map(s => s.action);
  const errorCount = blocks.filter(b => b.type === 'error').length;

  let totalDuration: number | undefined;
  if (steps.length > 0) {
    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];

    if (firstStep.startedAt && lastStep.completedAt) {
      totalDuration = lastStep.completedAt - firstStep.startedAt;
    }
  }

  return {
    actions,
    totalDuration,
    errorCount,
  };
}
