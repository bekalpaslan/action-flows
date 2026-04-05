import type { LucideIcon } from 'lucide-react';
import type { CustomWorkbenchId } from '@afw/shared';
import {
  Briefcase,
  Compass,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Archive,
  Palette,
} from 'lucide-react';

/** The 7 default workbench IDs */
export type DefaultWorkbenchId = 'work' | 'explore' | 'review' | 'pm' | 'settings' | 'archive' | 'studio';

/** Widened WorkbenchId supporting both default and custom workbenches */
export type WorkbenchId = DefaultWorkbenchId | CustomWorkbenchId;

const DEFAULT_IDS: readonly string[] = ['work', 'explore', 'review', 'pm', 'settings', 'archive', 'studio'];

/** Type guard to check if a WorkbenchId is one of the 7 defaults */
export function isDefaultWorkbench(id: WorkbenchId): id is DefaultWorkbenchId {
  return DEFAULT_IDS.includes(id);
}

export interface WorkbenchMeta {
  id: WorkbenchId;
  label: string;
  icon: LucideIcon;
  greeting: string;
  tone: string;
  systemPromptSnippet: string;
}

export const WORKBENCHES: readonly WorkbenchMeta[] = [
  {
    id: 'work',
    label: 'Work',
    icon: Briefcase,
    greeting: 'What needs building?',
    tone: 'Direct, action-oriented',
    systemPromptSnippet: 'You are a Work agent. Be direct and action-oriented. Focus on active sessions and ongoing chains.',
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: Compass,
    greeting: 'What shall we discover?',
    tone: 'Curious, inviting',
    systemPromptSnippet: 'You are an Explore agent. Be curious and inviting. Help users navigate and understand the codebase.',
  },
  {
    id: 'review',
    label: 'Review',
    icon: ShieldCheck,
    greeting: 'What needs auditing?',
    tone: 'Strict, focused',
    systemPromptSnippet: 'You are a Review agent. Be strict and focused. Enforce quality gates and audit standards.',
  },
  {
    id: 'pm',
    label: 'PM',
    icon: LayoutDashboard,
    greeting: "What's the priority?",
    tone: 'Strategic, structured',
    systemPromptSnippet: 'You are a PM agent. Be strategic and structured. Focus on planning, roadmaps, and task tracking.',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    greeting: 'System status: nominal.',
    tone: 'Technical, matter-of-fact',
    systemPromptSnippet: 'You are a Settings agent. Be technical and matter-of-fact. Manage configuration and system health.',
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    greeting: 'Search your history.',
    tone: 'Calm, archival',
    systemPromptSnippet: 'You are an Archive agent. Be calm and archival. Help users search and browse historical sessions.',
  },
  {
    id: 'studio',
    label: 'Studio',
    icon: Palette,
    greeting: 'Ready to experiment.',
    tone: 'Creative, playful',
    systemPromptSnippet: 'You are a Studio agent. Be creative and playful. Help users preview components and test layouts.',
  },
] as const;
