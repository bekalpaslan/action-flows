/**
 * SkillRow — renders a single skill entry with actions dropdown.
 * Per UI-SPEC Section 4: flex row with name/trigger, description, and dropdown menu.
 */

import type { Skill } from '@afw/shared';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export interface SkillRowProps {
  skill: Skill;
  onEdit: () => void;
  onDelete: () => void;
}

export function SkillRow({ skill, onEdit, onDelete }: SkillRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-surface-2 border border-border rounded-md hover:border-border-strong transition-colors">
      {/* Left: Name + Trigger */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-body font-semibold truncate">{skill.name}</span>
        <span className="text-caption font-mono text-text-dim truncate">
          {skill.trigger}
        </span>
      </div>

      {/* Middle: Description */}
      <div className="flex-1 min-w-0 px-2">
        <span className="text-caption text-text-dim line-clamp-1">
          {skill.description}
        </span>
      </div>

      {/* Right: Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Skill actions for ${skill.name}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem onSelect={onDelete}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
