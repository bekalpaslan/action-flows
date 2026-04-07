import type { CustomWorkbench } from '@afw/shared';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from '@/components/ui';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { ICON_MAP, DEFAULT_ICON } from '@/lib/iconMap';

interface CustomWorkbenchCardProps {
  workbench: CustomWorkbench;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Card component for displaying a custom workbench in the Settings panel.
 * Shows icon, name, tone, greeting (truncated), and creation date.
 */
export function CustomWorkbenchCard({ workbench, onEdit, onDelete }: CustomWorkbenchCardProps) {
  const Icon = ICON_MAP[workbench.iconName] ?? DEFAULT_ICON;

  const createdDate = new Date(workbench.createdAt);
  const relativeTime = getRelativeTime(createdDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-3">
              <Icon className="h-5 w-5 text-text-dim" />
            </div>
            <div>
              <CardTitle className="text-body">{workbench.name}</CardTitle>
              <CardDescription>{workbench.tone}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${workbench.name}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-body text-text-dim line-clamp-2">{workbench.greeting}</p>
      </CardContent>
      <CardFooter>
        <span className="text-caption text-text-muted">Created {relativeTime}</span>
      </CardFooter>
    </Card>
  );
}

/** Simple relative time formatter */
function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return date.toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
