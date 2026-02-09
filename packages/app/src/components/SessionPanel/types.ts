/**
 * SessionPanel Types
 * Additional types for the session panel components
 */

/**
 * Checklist item definition
 */
export interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  category: 'pre-commit' | 'review' | 'deploy' | 'security' | 'testing' | 'documentation';
  icon?: string;
  items: string[]; // Individual checklist items to verify
}

/**
 * Human prompt template definition
 */
export interface HumanPromptItem {
  id: string;
  name: string;
  prompt: string; // Template with {placeholders}
  category: 'debug' | 'refactor' | 'feature' | 'analysis' | 'review';
  description?: string;
  icon?: string;
}

/**
 * Tab types for SmartPromptLibrary
 */
export type PromptLibraryTab = 'flows' | 'actions' | 'checklists' | 'prompts';
