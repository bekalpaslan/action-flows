import { useCallback } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useValidationStore } from '@/stores/validationStore';
import { WORKBENCHES } from '@/lib/types';
import type { WorkbenchId } from '@/lib/types';
import type { AutonomyLevel } from '@afw/shared';
import { toast } from 'sonner';

/**
 * Settings page with per-workbench autonomy level configuration.
 * Part of the neural validation safety layer (Phase 8).
 */
export function SettingsPage() {
  const autonomyLevels = useValidationStore((s) => s.autonomyLevels);

  const handleAutonomyChange = useCallback(async (workbenchId: WorkbenchId, level: AutonomyLevel) => {
    // Optimistic UI update
    useValidationStore.getState().setAutonomyLevel(workbenchId, level);

    const wb = WORKBENCHES.find((w) => w.id === workbenchId);
    const label = wb?.label ?? workbenchId;

    try {
      const res = await fetch(`/api/approvals/autonomy/${workbenchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      });
      if (res.ok) {
        toast.success(`${label} autonomy set to ${level.charAt(0).toUpperCase() + level.slice(1)}`);
      } else {
        toast.error('Failed to update autonomy level');
      }
    } catch {
      toast.error('Failed to update autonomy level');
    }
  }, []);

  return (
    <div className="workbench-page">
      <h1 className="workbench-page__heading">Settings</h1>
      <p className="workbench-page__body">Configuration, preferences, and system health</p>

      {/* Autonomy Settings Card */}
      <div className="p-6 max-w-2xl">
        <div className="rounded-lg border border-border bg-surface-2 p-6">
          {/* Header */}
          <h2 className="text-heading font-semibold mb-1">Workbench Autonomy Levels</h2>
          <p className="text-caption text-text-dim mb-6">
            Control what actions require human approval per workbench
          </p>

          {/* Workbench rows */}
          <div className="flex flex-col gap-4">
            {WORKBENCHES.map((wb) => {
              const Icon = wb.icon;
              return (
                <div key={wb.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-text-muted" />
                    <span className="text-body">{wb.label}</span>
                  </div>
                  <Select
                    value={autonomyLevels.get(wb.id) ?? 'supervised'}
                    onValueChange={(value: string) => handleAutonomyChange(wb.id, value as AutonomyLevel)}
                  >
                    <SelectTrigger className="w-[180px]" aria-label={`${wb.label} autonomy level`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="supervised">Supervised</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {/* Descriptions */}
          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-caption text-text-dim"><span className="font-semibold">Full</span> -- Auto-approve all agent actions</p>
            <p className="text-caption text-text-dim"><span className="font-semibold">Supervised</span> -- Approve destructive operations only</p>
            <p className="text-caption text-text-dim"><span className="font-semibold">Restricted</span> -- Approve all file edits</p>
          </div>
        </div>
      </div>
    </div>
  );
}
