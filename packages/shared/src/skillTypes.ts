/**
 * Skill System Types for Phase 10: Customization & Automation
 *
 * Types for user-created reusable commands per workbench.
 * Skills are named triggers that execute predefined actions.
 */

/** @internal Unique symbol for SkillId branding */
declare const SkillIdSymbol: unique symbol;
/** Unique identifier for a skill */
export type SkillId = string & { readonly [SkillIdSymbol]: true };

/** A user-defined skill attached to a workbench */
export interface Skill {
  id: SkillId;
  workbenchId: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  createdAt: string;
}

/** Payload for invoking a skill */
export interface SkillInvocation {
  skillId: SkillId;
  workbenchId: string;
  input?: string;
}
