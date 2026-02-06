/**
 * Parser utility for extracting structured data from agent output
 * Gracefully handles missing or malformed output
 */

/**
 * Parsed data from agent output
 */
export interface ParsedAgentOutput {
  stepNumber?: number | null;
  action?: string | null;
  result?: string | null;
  learning?: string | null;
}

/**
 * Attempts to extract step number from output
 * Looks for patterns like "Step 1", "## Step 2 complete", etc.
 */
function parseStepNumber(output: string): number | null {
  const matches = output.match(/(?:^|\s|##)\s*(?:Step|step)\s+(\d+)/m);
  if (matches && matches[1]) {
    const num = parseInt(matches[1], 10);
    return !isNaN(num) ? num : null;
  }
  return null;
}

/**
 * Attempts to extract action name from output
 * Looks for patterns like "action/" or action in output
 */
function parseAction(output: string): string | null {
  // Look for patterns like "Spawning Step 1: action/" or "Step 1: action-name/"
  const matches = output.match(/(?:Spawning\s+Step\s+\d+:\s+|Step\s+\d+:\s+)([a-z\-]+)(?:\/)?/i);
  if (matches && matches[1]) {
    return matches[1];
  }

  // Fallback: look for any word followed by forward slash (action/)
  const actionMatches = output.match(/([a-z\-]+)\/(?:\s|$)/i);
  if (actionMatches && actionMatches[1]) {
    return actionMatches[1];
  }

  return null;
}

/**
 * Attempts to extract result/summary from output
 * Looks for "Result:", "Summary:", or similar markers
 */
function parseResult(output: string): string | null {
  // Look for result or summary markers
  const resultMatches = output.match(/(?:^|\n)\s*(?:Result|Summary|Outcome):\s*(.+?)(?:\n|$)/im);
  if (resultMatches && resultMatches[1]) {
    return resultMatches[1].trim();
  }

  // Fallback: get last line if it looks like a summary
  const lines = output.trim().split('\n');
  if (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim();
    if (lastLine.length > 0 && lastLine.length < 200) {
      return lastLine;
    }
  }

  return null;
}

/**
 * Attempts to extract learning section from output
 * Looks for "## Learnings" or "### Learning" markdown headers
 */
function parseLearning(output: string): string | null {
  // Look for learning section markers
  const learningMatches = output.match(/(?:^|\n)(?:##|###)\s+(?:Learning|Learnings)(?:.*?)(?:\n\n|$)([\s\S]*?)(?:\n##|$)/im);
  if (learningMatches && learningMatches[1]) {
    const content = learningMatches[1].trim();
    if (content.length > 0) {
      return content;
    }
  }

  // Alternative: look for "Agent Learning" pattern
  const agentLearningMatches = output.match(/Agent Learning[\s\S]*?(?:Issue|Suggested fix):\s*"?(.+?)"?(?:\n|$)/i);
  if (agentLearningMatches && agentLearningMatches[1]) {
    return agentLearningMatches[1].trim();
  }

  return null;
}

/**
 * Parses agent output and extracts structured data
 * All parsed fields are nullable - gracefully handles missing data
 */
export function parseAgentOutput(output: string): ParsedAgentOutput {
  if (!output || typeof output !== 'string') {
    return {
      stepNumber: null,
      action: null,
      result: null,
      learning: null,
    };
  }

  return {
    stepNumber: parseStepNumber(output),
    action: parseAction(output),
    result: parseResult(output),
    learning: parseLearning(output),
  };
}
