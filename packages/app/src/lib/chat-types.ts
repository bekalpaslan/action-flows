import type { ApprovalStatus } from '@afw/shared';

export type { ApprovalStatus } from '@afw/shared';

export type MessageRole = 'user' | 'agent' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'streaming' | 'complete' | 'error';

export interface ChatApprovalRequest {
  approvalId: string;
  action: string;
  description: string;
  files?: string[];
  workbenchId: string;
  autonomyLevel: string;
  status: ApprovalStatus;
  expiresAt: string;
  resolvedAt?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: string;       // JSON string
  output: string | null;
  status: 'running' | 'complete' | 'error';
}

export interface ParsedQuestion {
  type: 'single_select' | 'multi_select' | 'free_text' | 'confirmation';
  question: string;
  header?: string;
  options?: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  defaultValue?: string | string[];
}

export interface AskUserQuestion {
  toolCallId: string;
  question: ParsedQuestion;
  response: string | null;
  submitted: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status: MessageStatus;
  toolCalls?: ToolCall[];
  askUserQuestion?: AskUserQuestion;
  approvalRequest?: ChatApprovalRequest;
}

export interface WorkbenchChat {
  messages: ChatMessage[];
  inputValue: string;
  isStreaming: boolean;
  activeSessionId: string | null;
}

/**
 * Parse raw Agent SDK AskUserQuestionInput into a structured ParsedQuestion array.
 * Returns empty array on malformed input (graceful fallback to raw JSON rendering).
 */
export function parseAskUserQuestion(input: unknown): ParsedQuestion[] {
  try {
    if (!input || typeof input !== 'object') return [];

    const obj = input as Record<string, unknown>;
    const questions = obj.questions;
    if (!Array.isArray(questions)) return [];

    return questions.map((q: unknown) => {
      if (!q || typeof q !== 'object') {
        throw new Error('Invalid question entry');
      }
      const qObj = q as Record<string, unknown>;
      const questionText = typeof qObj.question === 'string' ? qObj.question : '';
      const isMultiSelect = qObj.multiSelect === true;
      const header = typeof qObj.header === 'string' ? qObj.header : undefined;
      const defaultValue = qObj.defaultValue as string | string[] | undefined;

      let options: ParsedQuestion['options'];
      if (Array.isArray(qObj.options)) {
        options = qObj.options.map((opt: unknown) => {
          if (!opt || typeof opt !== 'object') {
            return { value: String(opt), label: String(opt) };
          }
          const optObj = opt as Record<string, unknown>;
          const label = typeof optObj.label === 'string' ? optObj.label : String(optObj.label ?? '');
          const description = typeof optObj.description === 'string' ? optObj.description : undefined;
          return { value: label, label, description };
        });
      }

      // Determine type based on input shape
      let type: ParsedQuestion['type'];
      if (isMultiSelect) {
        type = 'multi_select';
      } else if (options && options.length > 0) {
        type = 'single_select';
      } else {
        type = 'free_text';
      }

      const result: ParsedQuestion = { type, question: questionText };
      if (header !== undefined) result.header = header;
      if (options !== undefined) result.options = options;
      if (defaultValue !== undefined) result.defaultValue = defaultValue;

      return result;
    });
  } catch {
    return [];
  }
}

/**
 * Build a response object for Agent SDK AskUserQuestion tool call.
 * Constructs { questions: originalInput.questions, answers: { questionText: selectedLabel } }
 */
export function buildAskUserResponse(
  originalInput: unknown,
  selections: Record<string, string | string[]>
): Record<string, unknown> {
  const obj = (originalInput && typeof originalInput === 'object')
    ? originalInput as Record<string, unknown>
    : {};

  const answers: Record<string, string> = {};
  for (const [questionText, selection] of Object.entries(selections)) {
    if (Array.isArray(selection)) {
      answers[questionText] = selection.join(', ');
    } else {
      answers[questionText] = selection;
    }
  }

  return {
    questions: obj.questions ?? [],
    answers,
  };
}
