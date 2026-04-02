import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { Badge } from '@/components/ui';
import { useCommands } from './useCommands';
import { cn } from '@/lib/utils';

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const commands = useCommands();

  const navigationCmds = commands.filter((c) => c.group === 'navigation');
  const actionCmds = commands.filter((c) => c.group === 'actions');

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className={cn(
        'fixed left-1/2 top-[20%] -translate-x-1/2 z-[1400]',
        'w-full max-w-lg rounded-xl',
        'bg-surface-3 border border-border-strong shadow-xl',
      )}
      overlayClassName="fixed inset-0 z-[1400] bg-black/50 backdrop-blur-sm"
    >
      <div className="flex items-center border-b border-border">
        <Search className="h-5 w-5 text-text-muted shrink-0 ml-4" />
        <Command.Input
          placeholder="Type a command or search..."
          className="h-12 w-full bg-transparent px-4 text-body text-text placeholder:text-text-muted outline-none"
        />
      </div>
      <Command.List className="max-h-[320px] overflow-y-auto py-2">
        <Command.Empty className="py-6 text-center text-caption text-text-muted">
          No commands match your search -- try &apos;work&apos;, &apos;explore&apos;, or a number
          key (1-7).
        </Command.Empty>
        <Command.Group
          heading="Navigation"
          className={cn(
            '[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2',
            '[&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-semibold',
            '[&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:uppercase',
            '[&_[cmdk-group-heading]]:tracking-wider',
          )}
        >
          {navigationCmds.map((cmd) => (
            <Command.Item
              key={cmd.id}
              onSelect={cmd.action}
              value={cmd.label}
              className="h-11 px-4 flex items-center gap-3 cursor-pointer text-body text-text data-[selected=true]:bg-accent/10"
            >
              <cmd.icon className="h-5 w-5 text-text-dim shrink-0" />
              <span className="flex-1">{cmd.label}</span>
              {cmd.shortcut && (
                <Badge variant="default" size="sm">
                  <span className="font-mono">{cmd.shortcut}</span>
                </Badge>
              )}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group
          heading="Actions"
          className={cn(
            '[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2',
            '[&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:font-semibold',
            '[&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:uppercase',
            '[&_[cmdk-group-heading]]:tracking-wider',
          )}
        >
          {actionCmds.map((cmd) => (
            <Command.Item
              key={cmd.id}
              onSelect={cmd.action}
              value={cmd.label}
              className="h-11 px-4 flex items-center gap-3 cursor-pointer text-body text-text data-[selected=true]:bg-accent/10"
            >
              <cmd.icon className="h-5 w-5 text-text-dim shrink-0" />
              <span className="flex-1">{cmd.label}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
