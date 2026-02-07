import type { PromptType } from '@afw/shared';

/**
 * Pattern matcher for detecting prompt types from terminal output
 */
export interface PatternMatcher {
  type: PromptType;
  patterns: RegExp[];
  extractResponses?: (output: string) => string[];
}

/**
 * Common prompt pattern matchers
 */
const PATTERN_MATCHERS: PatternMatcher[] = [
  // Binary (yes/no)
  {
    type: 'binary',
    patterns: [
      /\(y\/n\)/i,
      /\(yes\/no\)/i,
      /proceed\?/i,
      /continue\?/i,
      /\[y\/n\]/i,
      /approve\?/i,
    ],
    extractResponses: () => ['y', 'n'],
  },

  // Choice (numbered or lettered options)
  {
    type: 'choice',
    patterns: [
      /\[1-\d+\]/i,
      /select.*option/i,
      /choose.*\d+/i,
      /^\s*\d+\)/gm,
      /^\s*[a-e]\)/gim,
    ],
    extractResponses: (output: string) => {
      // Extract numbered options (1-9)
      const numberMatches = output.match(/^\s*(\d+)\)/gm);
      if (numberMatches) {
        return numberMatches
          .map(m => m.match(/\d+/)?.[0])
          .filter((n): n is string => n !== undefined)
          .slice(0, 9);
      }

      // Extract lettered options (a-e)
      const letterMatches = output.match(/^\s*([a-e])\)/gim);
      if (letterMatches) {
        return letterMatches
          .map(m => m.match(/[a-e]/i)?.[0]?.toLowerCase())
          .filter((l): l is string => l !== undefined);
      }

      return [];
    },
  },

  // File path request
  {
    type: 'file-path',
    patterns: [
      /enter.*path/i,
      /provide.*file/i,
      /specify.*location/i,
      /file.*name/i,
      /directory/i,
    ],
  },

  // Confirmation prompts
  {
    type: 'confirmation',
    patterns: [
      /are you sure\?/i,
      /confirm/i,
      /press enter to/i,
      /type.*to confirm/i,
    ],
  },

  // Chain approval (ActionFlows-specific)
  {
    type: 'chain-approval',
    patterns: [
      /approve.*chain/i,
      /review.*steps/i,
      /proceed with.*plan/i,
      /execute.*chain/i,
    ],
    extractResponses: () => ['approve', 'reject', 'modify'],
  },
];

/**
 * Detect prompt type from terminal output
 */
export function detectPromptType(output: string): PromptType {
  for (const matcher of PATTERN_MATCHERS) {
    if (matcher.patterns.some(pattern => pattern.test(output))) {
      return matcher.type;
    }
  }

  return 'unknown';
}

/**
 * Extract quick response suggestions from output
 */
export function extractQuickResponses(output: string): string[] {
  const promptType = detectPromptType(output);

  const matcher = PATTERN_MATCHERS.find(m => m.type === promptType);
  if (matcher?.extractResponses) {
    return matcher.extractResponses(output);
  }

  // Default responses based on type
  switch (promptType) {
    case 'binary':
      return ['y', 'n'];
    case 'confirmation':
      return ['yes', 'no'];
    case 'text':
      return [];
    default:
      return [];
  }
}

/**
 * Generate quick actions from detected context
 */
export function generateQuickActionsFromContext(
  output: string
): Array<{ label: string; value: string; icon: string }> {
  const promptType = detectPromptType(output);
  const responses = extractQuickResponses(output);

  switch (promptType) {
    case 'binary':
      return [
        { label: 'Yes', value: 'y', icon: 'check' },
        { label: 'No', value: 'n', icon: 'x' },
      ];

    case 'choice':
      return responses.map((value) => ({
        label: `Option ${value}`,
        value,
        icon: 'number',
      }));

    case 'confirmation':
      return [
        { label: 'Confirm', value: 'yes', icon: 'check' },
        { label: 'Cancel', value: 'no', icon: 'x' },
      ];

    case 'chain-approval':
      return [
        { label: 'Approve', value: 'approve', icon: 'check' },
        { label: 'Reject', value: 'reject', icon: 'x' },
        { label: 'Modify', value: 'modify', icon: 'edit' },
      ];

    case 'file-path':
      return [
        { label: 'Browse', value: '', icon: 'folder' },
      ];

    default:
      return [];
  }
}
